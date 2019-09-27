import lodash, {CollectionChain} from 'lodash';
import merge from 'merge-deep';
import {BaseLogger} from 'pino';

import {isUndefined} from 'util';
import {AccountsClient} from '../../lib/accounts';

import CloudFoundryClient from '../../lib/cf';
import {
  IOrganizationUserRoles,
  IResource,
  ISpace,
  ISpaceUserRoles,
  OrganizationUserRoleEndpoints,
  OrganizationUserRoles,
} from '../../lib/cf/types';
import NotificationClient from '../../lib/notify';
import {IParameters, IResponse} from '../../lib/router';
import {NotFoundError} from '../../lib/router/errors';
import UAAClient, {IUaaInvitation, IUaaUser} from '../../lib/uaa';

import {IContext} from '../app/context';
import {CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN} from '../auth';
import {fromOrg, IBreadcrumb} from '../breadcrumbs';

import deleteTemplate from './delete.njk';
import deleteSuccessTemplate from './delete.success.njk';
import editTemplate from './edit.njk';
import editSuccessTemplate from './edit.success.njk';
import inviteTemplate from './invite.njk';
import inviteSuccessTemplate from './invite.success.njk';
import orgUsersTemplate from './org-users.njk';

interface IInvalid {
  readonly field: string;
  readonly message: string;
}

interface IPermissions {
  readonly [guid: string]: {
    readonly [permission: string]: {
      readonly current: string;
      readonly desired?: string;
    };
  };
}

interface IUserRoles {
  readonly spaces: ReadonlyArray<ISpace>;
  readonly orgRoles: ReadonlyArray<OrganizationUserRoles>;
  readonly username: string;
}

interface IUserRolesByGuid {
  readonly [guid: string]: IUserRoles;
}

interface ISpaceUsers {
  readonly space: ISpace;
  readonly users: ReadonlyArray<ISpaceUserRoles>;
}

class ValidationError extends Error {
  public readonly errors: ReadonlyArray<IInvalid>;

  constructor(arrayOfErrors: ReadonlyArray<IInvalid>) {
    super(arrayOfErrors.map(e => e.message).join(','));
    this.errors = arrayOfErrors;
    this.name = 'ValidationError';
  }
}

interface IRoleValues {
  org_roles: {
    [key: string]: {
      billing_managers: 0 | 1;
      managers: 0 | 1;
      auditors: 0 | 1;
    };
  };
  space_roles: {
    [key: string]: {
      managers: 0 | 1;
      developers: 0 | 1;
      auditors: 0 | 1;
    };
  };
}

interface IUserPostBody {
  email: string;
  org_roles: IPermissions;
  space_roles: IPermissions;
}

const VALID_EMAIL = /[^.]@[^.]/;

async function setAllUserRolesForOrg(
  cf: CloudFoundryClient,
  params: IParameters,
  roles: { readonly [i: string]: IPermissions },
): Promise<any> {
  const spaces = await cf.spaces(params.organizationGUID);

  const orgRoleEndpoints: ReadonlyArray<OrganizationUserRoleEndpoints> = [
    'billing_managers',
    'managers',
    'auditors',
  ];

  await Promise.all(
    orgRoleEndpoints.map((role: OrganizationUserRoleEndpoints): Promise<IResource> | Promise<undefined> => {
      /* istanbul ignore next */
      if (!roles.org[params.organizationGUID]) {
        return Promise.resolve(undefined);
      }

      const oldPermission = roles.org[params.organizationGUID][role].current;
      const newPermission = roles.org[params.organizationGUID][role].desired;

      if (newPermission && newPermission === oldPermission) {
        return Promise.resolve(undefined);
      }

      if (isUndefined(newPermission) && oldPermission === '0') {
        return Promise.resolve(undefined);
      }

      return cf.setOrganizationRole(
        params.organizationGUID,
        params.userGUID,
        role,
        newPermission === '1',
      );
    }),
  );

  const spaceRoleEndpoints = [
    'managers',
    'developers',
    'auditors',
  ];

  await Promise.all(
    spaces.map((space: ISpace) => spaceRoleEndpoints.map(async (role: string) => {
        /* istanbul ignore next */
        if (!roles.space[space.metadata.guid]) {
          return Promise.resolve(undefined);
        }

        const oldPermission = roles.space[space.metadata.guid][role].current;
        const newPermission = roles.space[space.metadata.guid][role].desired;

        if (newPermission && newPermission === oldPermission) {
          return Promise.resolve(undefined);
        }

        if (isUndefined(newPermission) && oldPermission === '0') {
          return Promise.resolve(undefined);
        }

        return cf.setSpaceRole(
          space.metadata.guid,
          params.userGUID,
          role,
          newPermission === '1',
        );
      }),
    ));
}

export async function _getUserRolesByGuid(
  userOrgRoles: ReadonlyArray<IOrganizationUserRoles>,
  spaceUserLists: ReadonlyArray<ISpaceUsers>,
  accountsClient: AccountsClient,
): Promise<IUserRolesByGuid> {

  const spacesByUser: { [key: string]: ISpace[] } = {};
  for (const spaceUserList of spaceUserLists) {
    for (const user of spaceUserList.users) {
      const spaces = spacesByUser[user.metadata.guid] || [];
      spaces.push(spaceUserList.space);
      spacesByUser[user.metadata.guid] = spaces;
    }
  }

  const userRolesByGuid: { [key: string]: IUserRoles } = {};
  for (const user of userOrgRoles) {
    const accountsUser = await accountsClient.getUser(user.metadata.guid);

    userRolesByGuid[user.metadata.guid] = {
      username: accountsUser && accountsUser.username ? accountsUser.username : user.entity.username,
      orgRoles: user.entity.organization_roles,
      spaces: spacesByUser[user.metadata.guid] || [],
    };
  }
  return userRolesByGuid;
}

function _excludeUsersWithoutUaaRecord(
  userRolesByGuid: IUserRolesByGuid,
  uaaUsers: ReadonlyArray<IUaaUser | null>,
  logger: BaseLogger,
): IUserRolesByGuid {

  const filteredRoles: { [key: string]: IUserRoles } = {};

  for (const guid in userRolesByGuid) {
    /* istanbul ignore next */
    if (!userRolesByGuid.hasOwnProperty(guid)) {
      continue;
    }

    const role = userRolesByGuid[guid];

    if (uaaUsers.some(u => u && u.id === guid)) {
      filteredRoles[guid] = role;
    } else {
      logger.warn(
        `User ${guid} was discovered in CloudFoundry, but did not have a record in UAA. ` +
        `Was the user deleted or created improperly?`,
      );
    }
  }

  return filteredRoles as IUserRolesByGuid;
}

export async function listUsers(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );

  const [
    isManager,
    isBillingManager,
    organization,
    userOrgRoles,
    spacesVisibleToUser,
  ] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
    cf.organization(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
    cf.spaces(params.organizationGUID),
  ]);

  const spaceUserLists = await Promise.all(spacesVisibleToUser.map(async space => {
    return {space, users: await cf.usersForSpace(space.metadata.guid)};
  }));

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    secret: ctx.app.accountsSecret,
    logger: ctx.app.logger,
  });

  const userRolesByGuid = await _getUserRolesByGuid(
    userOrgRoles,
    spaceUserLists,
    accountsClient,
  );

  const uaaUsers = await uaa.getUsers(userOrgRoles.map(u => u.metadata.guid));
  const users = _excludeUsersWithoutUaaRecord(userRolesByGuid, uaaUsers, ctx.app.logger);

  const userOriginMapping: { [key: string]: string } = (lodash
    .chain(uaaUsers)
    .filter(u => u != null) as CollectionChain<IUaaUser>)
    .keyBy(u => u.id)
    .mapValues(u => u.origin)
    .value()
  ;

  const userHasLoginMapping: { [key: string]: boolean } = lodash
    .chain(userOrgRoles.map(u => u.metadata.guid))
    .keyBy(id => id)
    .mapValues(id => uaaUsers.findIndex(u => u ? u.id === id : false) >= 0)
  .value();

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = fromOrg(ctx, organization, [
    { text: 'Team members' },
  ]);

  return {
    body: orgUsersTemplate.render({
      routePartOf: ctx.routePartOf,
      context: ctx.viewContext,
      isAdmin,
      isManager,
      isBillingManager,
      linkTo: ctx.linkTo,
      users,
      userOriginMapping,
      organization,
      userHasLoginMapping,
      breadcrumbs,
    }),
  };
}

export async function inviteUserForm(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);

  const [isManager, isBillingManager] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
  ]);

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, spaces] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.spaces(params.organizationGUID),
  ]);

  /* istanbul ignore next */
  const values: IRoleValues = {
    org_roles: {
      [params.organizationGUID]: {
        billing_managers: 0,
        managers: 0,
        auditors: 0,
      },
    },
    space_roles: await spaces.reduce(async (next: Promise<any>, space: ISpace) => {
      const spaceRoles = await next;

      spaceRoles[space.metadata.guid] = {
        managers: 0,
        developers: 0,
        auditors: 0,
      };

      return spaceRoles;
    }, Promise.resolve({})),
  };

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = fromOrg(ctx, organization, [
    {
      text: 'Team members',
      href: ctx.linkTo('admin.organizations.users', {organizationGUID: organization.metadata.guid}),
    },
    { text: 'Invite a new team member' },
  ]);

  return {
    body: inviteTemplate.render({
      errors: [],
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      organization,
      spaces,
      values,
      isAdmin,
      isBillingManager,
      isManager,
      breadcrumbs,
    }),
  };
}

export async function inviteUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const [isManager, isBillingManager] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
  ]);

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, spaces] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.spaces(params.organizationGUID),
  ]);
  const errors = [];
  const values: IUserPostBody = merge({
    org_roles: {[params.organizationGUID]: {}},
    space_roles: {},
  }, body);

  try {
    if (!VALID_EMAIL.test(values.email)) {
      errors.push({field: 'email', message: 'a valid email address is required'});
    }

    if (Object.keys(values.org_roles[params.organizationGUID]).length === 0
      && Object.keys(values.space_roles).length === 0) {
      errors.push({field: 'roles', message: 'at least one role should be selected'});
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const uaa = new UAAClient({
      apiEndpoint: ctx.app.uaaAPI,
      clientCredentials: {
        clientID: ctx.app.oauthClientID,
        clientSecret: ctx.app.oauthClientSecret,
      },
    });

    const accounts = new AccountsClient({
      apiEndpoint: ctx.app.accountsAPI,
      secret: ctx.app.accountsSecret,
      logger: ctx.app.logger,
    });

    const uaaUser = await uaa.findUser(values.email);
    let userGUID = uaaUser && uaaUser.id;
    let invitation: IUaaInvitation | undefined;

    if (!userGUID) {
      invitation = await uaa.inviteUser(
        values.email,
        'user_invitation',
        'https://www.cloud.service.gov.uk/next-steps?success',
      );

      /* istanbul ignore next */
      if (!invitation) {
        throw new ValidationError([{field: 'email', message: 'a valid email address is required'}]);
      }

      userGUID = invitation.userId;

      await accounts.createUser(userGUID, values.email, values.email);
    }

    const users = await cf.usersForOrganization(params.organizationGUID);
    const alreadyOrgUser = users.some((user: IOrganizationUserRoles) => {
      return user.metadata.guid === userGUID;
    });

    if (alreadyOrgUser) {
      throw new ValidationError([{field: 'email', message: 'user is already a member of the organisation'}]);
    }

    await cf.assignUserToOrganization(params.organizationGUID, userGUID);

    await setAllUserRolesForOrg(
      cf,
      {
        organizationGUID: params.organizationGUID,
        userGUID,
      },
      {
        org: values.org_roles,
        space: values.space_roles,
      },
    );

    /* istanbul ignore next */
    if (invitation) {
      try {
        const notify = new NotificationClient({
          apiKey: ctx.app.notifyAPIKey,
          templates: {
            welcome: ctx.app.notifyWelcomeTemplateID,
          },
        });

        await notify.sendWelcomeEmail(values.email, {
          organisation: organization.entity.name,
          url: invitation.inviteLink,
          location: ctx.app.location,
        });
      } catch (err) {
        ctx.log.error(`a user was assigned to org ${params.organizationGUID} ` +
          `but sending the invite email failed: ${err.message}`);
      }
    }

    return {
      body: inviteSuccessTemplate.render({
        errors,
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        context: ctx.viewContext,
        organization,
        isAdmin,
        isBillingManager,
        isManager,
      }),
    };
  } catch (err) {
    /* istanbul ignore next */
    if (err instanceof ValidationError) {
      return {
        body: inviteTemplate.render({
          routePartOf: ctx.routePartOf,
          linkTo: ctx.linkTo,
          context: ctx.viewContext,
          errors: err.errors,
          organization,
          spaces,
          values,
          isAdmin,
          isBillingManager,
          isManager,
        }),
        status: 400,
      };
    }

    /* istanbul ignore next */
    throw err;
  }
}

export async function resendInvitation(ctx: IContext, params: IParameters, _: object): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, users] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
  ]);
  const user = users.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  if (!user) {
    throw new NotFoundError('user not found within the organisation');
  }

  /* istanbul ignore next */
  if (!VALID_EMAIL.test(user.entity.username)) {
    throw new Error('User: a valid email address is required.');
  }

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const uaaUser = await uaa.findUser(user.entity.username);
  let userGUID = uaaUser && uaaUser.id;

  /* istanbul ignore next */
  if (!userGUID) {
    throw new Error('User: the user does not exist');
  }

  const invitation = await uaa.inviteUser(
    user.entity.username,
    'user_invitation',
    'https://www.cloud.service.gov.uk/next-steps?success',
  );

  /* istanbul ignore next */
  if (!invitation) {
    throw new ValidationError([{field: 'email', message: 'a valid email address is required'}]);
  }

  userGUID = invitation.userId;

  const notify = new NotificationClient({
    apiKey: ctx.app.notifyAPIKey,
    templates: {
      welcome: ctx.app.notifyWelcomeTemplateID,
    },
  });

  await notify.sendWelcomeEmail(user.entity.username, {
    organisation: organization.entity.name,
    url: invitation.inviteLink,
    location: ctx.app.location,
  });

  return {
    body: inviteSuccessTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      errors: [],
      organization,
    }),
  };
}

export async function editUser(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    secret: ctx.app.accountsSecret,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const [isManager, isBillingManager] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
  ]);

  const users = await cf.usersForOrganization(params.organizationGUID);
  const managers = users.filter((manager: IOrganizationUserRoles) =>
    manager.entity.organization_roles.some(role => role === 'org_manager'),
  );
  const billingManagers = users.filter((manager: IOrganizationUserRoles) =>
    manager.entity.organization_roles.some(role => role === 'billing_manager'),
  );

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, spaces, orgUsers] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.spaces(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
  ]);

  const user = orgUsers.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  if (!user) {
    throw new NotFoundError('user not found in CF');
  }

  const uaaUser = await uaa.getUser(user.metadata.guid);

  const accountsUser = await accountsClient.getUser(params.userGUID);

  if (!accountsUser) {
    ctx.app.logger.warn(
      `user ${uaaUser.id} was found in UAA and CF, but not in paas-accounts. ` +
      `Was the user created incorrectly? They should be invited via paas-admin`,
    );
    throw new NotFoundError('user not found in paas-accounts');
  }

  /* istanbul ignore next */
  const values: IRoleValues = {
    org_roles: {
      [params.organizationGUID]: {
        billing_managers: user.entity.organization_roles.includes('billing_manager') ? 1 : 0,
        managers: user.entity.organization_roles.includes('org_manager') ? 1 : 0,
        auditors: user.entity.organization_roles.includes('org_auditor') ? 1 : 0,
      },
    },
    space_roles: await spaces.reduce(async (next: Promise<any>, space: ISpace) => {
      const spaceRoles = await next;
      const spaceUsers = await cf.usersForSpace(space.metadata.guid);
      const usr = spaceUsers.find((u: ISpaceUserRoles) => u.metadata.guid === params.userGUID);

      spaceRoles[space.metadata.guid] = {
        managers: usr && usr.entity.space_roles.includes('space_manager') ? 1 : 0,
        developers: usr && usr.entity.space_roles.includes('space_developer') ? 1 : 0,
        auditors: usr && usr.entity.space_roles.includes('space_auditor') ? 1 : 0,
      };

      return spaceRoles;
    }, Promise.resolve({})),
  };

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = fromOrg(ctx, organization, [
    {
      text: 'Team members',
      href: ctx.linkTo('admin.organizations.users', {organizationGUID: organization.metadata.guid}),
    },
    { text: accountsUser.email },
  ]);

  /* istanbul ignore next */
  return {
    body: editTemplate.render({
      isActive: uaaUser.active && uaaUser.verified,
      errors: [],
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      managers,
      billingManagers,
      organization,
      spaces,
      user,
      email: accountsUser.email,
      values,
      isAdmin,
      isBillingManager,
      isManager,
      breadcrumbs,
    }),
  };
}

export async function updateUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const [isManager, isBillingManager] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
  ]);

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, spaces, orgUsers] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.spaces(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
  ]);
  const errors = [];
  const values: IUserPostBody = merge({
    org_roles: {[params.organizationGUID]: {}},
    space_roles: {},
  }, body);

  const user = orgUsers.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  try {
    if (Object.keys(values.org_roles[params.organizationGUID]).length === 0
      && Object.keys(values.space_roles).length === 0) {
      errors.push({field: 'roles', message: 'at least one role should be selected'});
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    await setAllUserRolesForOrg(
      cf,
      {
        organizationGUID: params.organizationGUID,
        userGUID: params.userGUID,
      },
      {
        org: values.org_roles,
        space: values.space_roles,
      },
    );

    return {
      body: editSuccessTemplate.render({
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        context: ctx.viewContext,
        organization,
        isAdmin,
        isBillingManager,
        isManager,
      }),
    };
  } catch (err) {
    /* istanbul ignore next */
    if (err instanceof ValidationError) {
      return {
        body: editTemplate.render({
          routePartOf: ctx.routePartOf,
          linkTo: ctx.linkTo,
          context: ctx.viewContext,
          errors: err.errors,
          organization,
          spaces,
          user,
          values,
          isAdmin,
          isBillingManager,
          isManager,
        }),
        status: 400,
      };
    }

    /* istanbul ignore next */
    throw err;
  }
}

export async function confirmDeletion(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const [isManager, isBillingManager] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
  ]);

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, orgUsers] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
  ]);
  const user = orgUsers.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  return {
    body: deleteTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      organization,
      user,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}

export async function deleteUser(ctx: IContext, params: IParameters, _: object): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const [isManager, isBillingManager] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
  ]);

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const organization = await cf.organization(params.organizationGUID);

  await cf.setOrganizationRole(
    params.organizationGUID,
    params.userGUID,
    'users',
    false,
  );

  return {
    body: deleteSuccessTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      organization,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}
