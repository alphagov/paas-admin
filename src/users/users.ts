import merge from 'merge-deep';

import { IContext } from '../app/context';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import CloudFoundryClient from '../cf';
import {
  IOrganizationUserRoles,
  IResource,
  ISpace,
  ISpaceUserRoles,
  OrganizationUserRoleEndpoints,
} from '../cf/types';
import { IParameters, IResponse } from '../lib/router';
import { NotFoundError } from '../lib/router/errors';
import NotificationClient from '../notify';
import UAAClient from '../uaa';

import deleteTemplate from './delete.njk';
import deleteSuccessTemplate from './delete.success.njk';
import editTemplate from './edit.njk';
import editSuccessTemplate from './edit.success.njk';
import inviteTemplate from './invite.njk';
import inviteSuccessTemplate from './invite.success.njk';
import usersTemplate from './users.njk';

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
  roles: {[i: string]: IPermissions},
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

      if (!newPermission && oldPermission === '0') {
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
    spaces.map((space: ISpace) => spaceRoleEndpoints.map((role: string) => {
      /* istanbul ignore next */
      if (!roles.space[space.metadata.guid]) {
        return Promise.resolve(undefined);
      }

      const oldPermission = roles.space[space.metadata.guid][role].current;
      const newPermission = roles.space[space.metadata.guid][role].desired;

      if (newPermission && newPermission === oldPermission) {
        return Promise.resolve(undefined);
      }

      if (!newPermission && oldPermission === '0') {
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

export async function listUsers(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

  const organization = await cf.organization(params.organizationGUID);
  const users = await cf.usersForOrganization(params.organizationGUID);
  const usersWithSpaces = await Promise.all(users.map(async (user: IOrganizationUserRoles) => {
    const userWithSpaces = {
      ...user,
      spaces: new Array(),
    };

    /* istanbul ignore next */
    try {
      userWithSpaces.spaces = await cf.spacesForUserInOrganization(user.metadata.guid, params.organizationGUID);
    } catch {
      ctx.log.warn(
        `BUG: users has no permission to fetch spacesForUser: ${user.metadata.guid}`,
      ); // TODO: permissions issue here
    }

    return userWithSpaces;
  }));

  return {
    body: usersTemplate.render({
      routePartOf: ctx.routePartOf,
      isAdmin,
      isManager,
      isBillingManager,
      linkTo: ctx.linkTo,
      users: usersWithSpaces,
      organization,
    }),
  };
}

export async function inviteUserForm(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const organization = await cf.organization(params.organizationGUID);
  const spaces = await cf.spaces(params.organizationGUID);

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

  return {
    body: inviteTemplate.render({
      errors: [],
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      spaces,
      values,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}

export async function inviteUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const organization = await cf.organization(params.organizationGUID);
  const spaces = await cf.spaces(params.organizationGUID);
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

    const uaaUser = await uaa.findUser(values.email);
    let userGUID = uaaUser && uaaUser.id;
    let invitation;

    if (!userGUID) {
      invitation = await uaa.inviteUser(
        values.email,
        'user_invitation',
        'https://www.cloud.service.gov.uk/next-steps?success',
      );

      /* istanbul ignore next */
      if (!invitation) { // TODO: test me
        throw new ValidationError([{field: 'email', message: 'a valid email address is required'}]);
      }

      userGUID = invitation.userId;
    }

    const users = await cf.usersForOrganization(params.organizationGUID);
    const alreadyOrgUser = users.some((user: IOrganizationUserRoles) => {
      return user.metadata.guid === userGUID;
    });

    if (alreadyOrgUser) {
      throw new ValidationError([{field: 'email', message: 'user is already a member of the organisation'}]);
    }

    await cf.assignUserToOrganizationByUsername(params.organizationGUID, values.email);

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
          errors: err.errors,
          routePartOf: ctx.routePartOf,
          linkTo: ctx.linkTo,
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
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const organization = await cf.organization(params.organizationGUID);
  const users = await cf.usersForOrganization(params.organizationGUID);
  const user = users.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  if (!user) {
    throw new NotFoundError('user not found within the organisation');
  }

  /* istanbul ignore next */
  if (!VALID_EMAIL.test(user.entity.username)) {
    throw new Error('a valid email address is required');
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
    throw new Error('the user does not exist');
  }

  const invitation = await uaa.inviteUser(
    user.entity.username,
    'user_invitation',
    'https://www.cloud.service.gov.uk/next-steps?success',
  );

  /* istanbul ignore next */
  if (!invitation) { // TODO: test me
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
  });

  return {
    body: inviteSuccessTemplate.render({
      errors: [],
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
    }),
  };
}

export async function editUser(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

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

  const organization = await cf.organization(params.organizationGUID);
  const spaces = await cf.spaces(params.organizationGUID);

  const orgUsers = await cf.usersForOrganization(params.organizationGUID);
  const user = orgUsers.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  if (!user) {
    throw new NotFoundError('user not found');
  }

  const uaaUser = await uaa.getUser(user.metadata.guid);

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

  /* istanbul ignore next */
  return {
    body: editTemplate.render({
      isActive: uaaUser.active && uaaUser.verified,
      errors: [],
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      managers,
      billingManagers,
      organization,
      spaces,
      user,
      values,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}

export async function updateUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const organization = await cf.organization(params.organizationGUID);
  const spaces = await cf.spaces(params.organizationGUID);
  const errors = [];
  const values: IUserPostBody = merge({
    org_roles: {[params.organizationGUID]: {}},
    space_roles: {},
  }, body);

  const orgUsers = await cf.usersForOrganization(params.organizationGUID);
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
          errors: err.errors,
          routePartOf: ctx.routePartOf,
          linkTo: ctx.linkTo,
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
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }

  const organization = await cf.organization(params.organizationGUID);
  const orgUsers = await cf.usersForOrganization(params.organizationGUID);
  const user = orgUsers.find((u: IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  return {
    body: deleteTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
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
  });

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

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
      organization,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}
