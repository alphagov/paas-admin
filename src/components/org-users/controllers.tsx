import lodash, { CollectionChain, mapValues, merge, values as values } from 'lodash';
import { BaseLogger } from 'pino';
import React from 'react';

import { isUndefined } from 'util';

import { Template } from '../../layouts';
import { AccountsClient } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import {
  IOrganizationUserRoles,
  IResource,
  ISpace,
  ISpaceUserRoles,
  OrganizationUserRoleEndpoints,
} from '../../lib/cf/types';
import NotificationClient from '../../lib/notify';
import { IParameters, IResponse } from '../../lib/router';
import { NotFoundError } from '../../lib/router/errors';
import UAAClient, { IUaaInvitation, IUaaUser } from '../../lib/uaa';

import { IContext } from '../app/context';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import { fromOrg } from '../breadcrumbs';
import {
  DeleteConfirmationPage,
  EditPage,
  InvitePage,
  IRoleValues,
  IUserRoles,
  IUserRolesByGuid,
  IValidationError,
  OrganizationUsersPage,
  SuccessPage,
} from './views';

interface IPostPermissions {
  readonly [guid: string]: {
    readonly [permission: string]: {
      readonly current: string;
      readonly desired: string;
    };
  };
}

interface IUserPostBody {
  email?: string;
  org_roles?: IPostPermissions;
  space_roles?: IPostPermissions;
}

interface ISpaceUsers {
  readonly space: ISpace;
  readonly users: ReadonlyArray<ISpaceUserRoles>;
}

class ValidationError extends Error {
  public readonly errors: ReadonlyArray<IValidationError>;

  constructor(arrayOfErrors: ReadonlyArray<IValidationError>) {
    super(arrayOfErrors.map(e => e.message).join(','));
    this.errors = arrayOfErrors;
    this.name = 'ValidationError';
  }
}

const VALID_EMAIL = /[^.]@[^.]/;

async function setAllUserRolesForOrg(
  cf: CloudFoundryClient,
  params: IParameters,
  roles: { readonly org: IPostPermissions, readonly space: IPostPermissions },
): Promise<any> {
  const spaces = await cf.orgSpaces(params.organizationGUID);

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
    organization,
    userOrgRoles,
    spacesVisibleToUser,
  ] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.organization(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
    cf.orgSpaces(params.organizationGUID),
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

  const template = new Template(ctx.viewContext, 'Team members');
  template.breadcrumbs = fromOrg(ctx, organization, [
    { text: 'Team members' },
  ]);

  return {
    body: template.render(<OrganizationUsersPage
      linkTo={ctx.linkTo}
      organizationGUID={organization.metadata.guid}
      privileged={isAdmin || isManager}
      users={users}
      userOriginMapping={userOriginMapping}
    />),
  };
}

export async function inviteUserForm(ctx: IContext, params: IParameters): Promise<IResponse> {
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

  const [organization, spaces] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.orgSpaces(params.organizationGUID),
  ]);

  /* istanbul ignore next */
  const formValues: IRoleValues = {
    org_roles: {
      [organization.metadata.guid]: {
        billing_managers: { current: false, desired: false },
        managers: { current: false, desired: false },
        auditors: { current: false, desired: false },
      },
    },
    space_roles: await spaces.reduce(async (next: Promise<any>, space: ISpace) => {
      const spaceRoles = await next;

      spaceRoles[space.metadata.guid] = {
        managers: { current: false, desired: false },
        developers: { current: false, desired: false },
        auditors: { current: false, desired: false },
      };

      return spaceRoles;
    }, Promise.resolve({})),
  };

  const template = new Template(ctx.viewContext, 'Invite a new team member');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      text: 'Team members',
      href: ctx.linkTo('admin.organizations.users', {organizationGUID: organization.metadata.guid}),
    },
    { text: 'Invite a new team member' },
  ]);

  return {
    body: template.render(<InvitePage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      organization={organization}
      spaces={spaces}
      values={formValues}
    />),
  };
}

export async function inviteUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
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

  const accounts = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    secret: ctx.app.accountsSecret,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, spaces] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.orgSpaces(params.organizationGUID),
  ]);
  const errors: IValidationError[] = [];
  const userBody: IUserPostBody = merge({
    org_roles: {[params.organizationGUID]: {}},
    space_roles: {},
  }, body);

  try {
    errors.push(...validateValues(userBody));
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const uaaUser = await uaa.findUser(userBody.email!);
    let userGUID = uaaUser && uaaUser.id;
    let invitation: IUaaInvitation | undefined;

    if (!userGUID) {
      invitation = await uaa.inviteUser(
        userBody.email!,
        'user_invitation',
        encodeURIComponent('https://www.cloud.service.gov.uk/next-steps?success'),
      );

      /* istanbul ignore next */
      if (!invitation) {
        throw new ValidationError([{field: 'email', message: 'a valid email address is required'}]);
      }

      userGUID = invitation.userId;

      await accounts.createUser(userGUID, userBody.email!, userBody.email!);
    }

    const users = await cf.usersForOrganization(params.organizationGUID);
    const alreadyOrgUser = users.some((user: IOrganizationUserRoles) => {
      return user.metadata.guid === userGUID;
    });

    if (alreadyOrgUser) {
      throw new ValidationError([{field: 'email', message: 'user is already a member of the organisation'}]);
    }

    await cf.assignUserToOrganization(params.organizationGUID, userGUID);

    /* istanbul ignore next */
    await setAllUserRolesForOrg(
      cf,
      {
        organizationGUID: params.organizationGUID,
        userGUID,
      },
      {
        org: userBody.org_roles || {},
        space: userBody.space_roles || {},
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

        await notify.sendWelcomeEmail(userBody.email!, {
          organisation: organization.entity.name,
          url: invitation.inviteLink,
          location: ctx.app.location,
        });
      } catch (err) {
        ctx.log.error(`a user was assigned to org ${params.organizationGUID} ` +
          `but sending the invite email failed: ${err.message}`);
      }
    }

    const template = new Template(ctx.viewContext, 'Invited a new team member');

    return {
      body: template.render(<SuccessPage linkTo={ctx.linkTo} organizationGUID={organization.metadata.guid}>
        We have sent your invitation
      </SuccessPage>),
    };
  } catch (err) {
    /* istanbul ignore next */
    if (err instanceof ValidationError) {
      const template = new Template(ctx.viewContext, 'Invite a new team member');
      template.breadcrumbs = fromOrg(ctx, organization, [
        {
          text: 'Team members',
          href: ctx.linkTo('admin.organizations.users', {organizationGUID: organization.metadata.guid}),
        },
        { text: 'Invite a new team member' },
      ]);

      return {
        body: template.render(<InvitePage
          csrf={ctx.viewContext.csrf}
          errors={err.errors}
          linkTo={ctx.linkTo}
          organization={organization}
          spaces={spaces}
          values={parseValues(userBody)}
        />),
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
    encodeURIComponent('https://www.cloud.service.gov.uk/next-steps?success'),
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

  const template = new Template(ctx.viewContext, 'Invited a new team member');

  return {
    body: template.render(<SuccessPage linkTo={ctx.linkTo} organizationGUID={organization.metadata.guid}>
      We have sent your invitation
    </SuccessPage>),
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
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');

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
    cf.orgSpaces(params.organizationGUID),
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
  const formValues: IRoleValues = {
    org_roles: {
      [params.organizationGUID]: {
        billing_managers: {
          current: user.entity.organization_roles.includes('billing_manager'),
          desired: user.entity.organization_roles.includes('billing_manager'),
        },
        managers: {
          current: user.entity.organization_roles.includes('org_manager'),
          desired: user.entity.organization_roles.includes('org_manager'),
        },
        auditors: {
          current: user.entity.organization_roles.includes('org_auditor'),
          desired: user.entity.organization_roles.includes('org_auditor'),
        },
      },
    },
    space_roles: await spaces.reduce(async (next: Promise<any>, space: ISpace) => {
      const spaceRoles = await next;
      const spaceUsers = await cf.usersForSpace(space.metadata.guid);
      const usr = spaceUsers.find((u: ISpaceUserRoles) => u.metadata.guid === params.userGUID);

      spaceRoles[space.metadata.guid] = {
        managers: {
          current: usr?.entity.space_roles.includes('space_manager'),
          desired: usr?.entity.space_roles.includes('space_manager'),
        },
        developers: {
          current: usr?.entity.space_roles.includes('space_developer'),
          desired: usr?.entity.space_roles.includes('space_developer'),
        },
        auditors: {
          current: usr?.entity.space_roles.includes('space_auditor'),
          desired: usr?.entity.space_roles.includes('space_auditor'),
        },
      };

      return spaceRoles;
    }, Promise.resolve({})),
  };

  const template = new Template(ctx.viewContext, 'Update a team member');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      text: 'Team members',
      href: ctx.linkTo('admin.organizations.users', {organizationGUID: organization.metadata.guid}),
    },
    { text: accountsUser.email },
  ]);

  /* istanbul ignore next */
  return {
    body: template.render(<EditPage
      billingManagers={billingManagers.length}
      csrf={ctx.viewContext.csrf}
      email={accountsUser.email}
      errors={[]}
      isActive={uaaUser.active && uaaUser.verified}
      linkTo={ctx.linkTo}
      managers={managers.length}
      organization={organization}
      spaces={spaces}
      user={user}
      values={formValues}
    />),
  };
}

export async function updateUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
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
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const [organization, spaces, orgUsers] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.orgSpaces(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
  ]);
  const errors: IValidationError[] = [];
  const userBody: IUserPostBody = merge({
    org_roles: {[params.organizationGUID]: {}},
    space_roles: {},
  }, body);

  const user = orgUsers.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);
  if (!user) {
    throw new NotFoundError('user not found in CF');
  }

  try {
    errors.push(...validateValues({...userBody, email: 'admin@example.com'}));
    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    /* istanbul ignore next */
    await setAllUserRolesForOrg(
      cf,
      {
        organizationGUID: params.organizationGUID,
        userGUID: params.userGUID,
      },
      {
        org: userBody.org_roles || {},
        space: userBody.space_roles || {},
      },
    );

    const template = new Template(ctx.viewContext, 'Updated a team member');

    return {
      body: template.render(<SuccessPage linkTo={ctx.linkTo} organizationGUID={organization.metadata.guid}>
        We have updated the user
      </SuccessPage>),
    };
  } catch (err) {
    /* istanbul ignore next */
    if (err instanceof ValidationError) {
      const users = await cf.usersForOrganization(params.organizationGUID);
      const managers = users.filter((manager: IOrganizationUserRoles) =>
        manager.entity.organization_roles.some(role => role === 'org_manager'),
      );
      const billingManagers = users.filter((manager: IOrganizationUserRoles) =>
        manager.entity.organization_roles.some(role => role === 'billing_manager'),
      );

      const uaaUser = await uaa.getUser(user.metadata.guid);
      const accountsUser = await accountsClient.getUser(params.userGUID);
      if (!accountsUser) {
        ctx.app.logger.warn(
          `user ${uaaUser.id} was found in UAA and CF, but not in paas-accounts. ` +
          `Was the user created incorrectly? They should be invited via paas-admin`,
        );
        throw new NotFoundError('user not found in paas-accounts');
      }

      const template = new Template(ctx.viewContext, 'Update a team member');
      template.breadcrumbs = fromOrg(ctx, organization, [
        {
          text: 'Team members',
          href: ctx.linkTo('admin.organizations.users', {organizationGUID: organization.metadata.guid}),
        },
        { text: accountsUser.email },
      ]);

      return {
        body: template.render(<EditPage
          billingManagers={billingManagers.length}
          csrf={ctx.viewContext.csrf}
          email={accountsUser.email}
          errors={err.errors}
          isActive={uaaUser.active && uaaUser.verified}
          linkTo={ctx.linkTo}
          managers={managers.length}
          organization={organization}
          spaces={spaces}
          user={user}
          values={parseValues(userBody)}
        />),
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
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('User not found');
  }

  const [organization, orgUsers] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID),
  ]);
  const user = orgUsers.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const template = new Template(ctx.viewContext, 'Confirm user deletion');

  return {
    body: template.render(<DeleteConfirmationPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      organizationGUID={organization.metadata.guid}
      user={user}
    />),
  };
}

export async function deleteUser(ctx: IContext, params: IParameters, _: object): Promise<IResponse> {
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

  const organization = await cf.organization(params.organizationGUID);

  await cf.setOrganizationRole(
    params.organizationGUID,
    params.userGUID,
    'users',
    false,
  );

  const template = new Template(ctx.viewContext, 'Deleted a team member');

  return {
    body: template.render(<SuccessPage linkTo={ctx.linkTo} organizationGUID={organization.metadata.guid}>
      We have unassigned this member from your organisation.
    </SuccessPage>),
  };
}

function validateValues(body: IUserPostBody): ReadonlyArray<IValidationError> {
  const errors: IValidationError[] = [];

  if (!body.email || !VALID_EMAIL.test(body.email)) {
    errors.push({field: 'email', message: 'a valid email address is required'});
  }

  const orgRolesSelected = values(body.org_roles).some(permissions => values(permissions).some(x => x.desired === '1'));
  const spaceRolesSelected = values(body.space_roles).some(permissions => values(permissions).some(x => x.desired === '1'));
  if (!orgRolesSelected && !spaceRolesSelected) {
    errors.push({field: 'roles', message: 'at least one role should be selected'});
  }

  return errors;
}

function parseValues(body: IUserPostBody) {
  const convert = (roles: IPostPermissions) => mapValues(roles, permissions =>
    mapValues(permissions, state => ({
      current: state.current === '1',
      desired: state.desired === '1',
    }),
  ));

  /* istanbul ignore next */
  return {
    email: body.email,
    org_roles: convert(body.org_roles || {}),
    space_roles: convert(body.space_roles || {}),
  };
}
