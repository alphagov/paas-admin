import merge from 'merge-deep';

import { IContext } from '../app/context';
import { hasOrgRole } from '../auth';
import * as cf from '../cf/types';
import { IParameters, IResponse } from '../lib/router';
import { NotFoundError } from '../lib/router/errors';

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
    readonly [permission: string]: string;
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

const VALID_EMAIL = /[^.]@[^.]/;

async function requirePermissions(ctx: IContext, role: cf.OrganizationUserRoles, params: IParameters) {
  const isManager = await hasOrgRole(ctx, {
    adminWrite: true,
    organizationGUID: params.organizationGUID,
    role,
  });

  /* istanbul ignore next */
  if (!isManager) {
    throw new NotFoundError('not found');
  }
}

async function setAllUserRolesForOrg(
  ctx: IContext,
  params: IParameters,
  roles: {[i: string]: IPermissions},
): Promise<any> {
  const spaces = await ctx.cf.spaces(params.organizationGUID);

  const roleEndpoints: ReadonlyArray<cf.OrganizationUserRoleEndpoints> = ['billing_managers', 'managers', 'auditors'];
  await Promise.all(
    roleEndpoints.map((role: cf.OrganizationUserRoleEndpoints) =>
      ctx.cf.setOrganizationRole(
        params.organizationGUID,
        params.userGUID,
        role,
        roles.org[params.organizationGUID] && roles.org[params.organizationGUID][role] === '1',
      ),
    ),
  );

  await Promise.all(
    spaces.map((space: cf.ISpace) => ['managers', 'developers', 'auditors'].map((role: string) =>
      ctx.cf.setSpaceRole(
        space.metadata.guid,
        params.userGUID,
        role,
        roles.space[space.metadata.guid] && roles.space[space.metadata.guid][role] === '1'),
    )),
  );
}

export async function listUsers(ctx: IContext, params: IParameters): Promise<IResponse> {
  const isManager = await hasOrgRole(ctx, {
    organizationGUID: params.organizationGUID,
    role: 'org_manager',
    adminWrite: true,
  });

  const organization = await ctx.cf.organization(params.organizationGUID);
  const users = await ctx.cf.usersForOrganization(params.organizationGUID);

  await Promise.all(users.map(async (user: cf.IOrganizationUserRoles) => {
    const userWithSpaces = {
      ...user,
      spaces: new Array(),
    };

    /* istanbul ignore next */
    try {
      userWithSpaces.spaces = await ctx.cf.spacesForUserInOrganization(user.metadata.guid, params.organizationGUID);
    } catch {
      ctx.log.warn(
        `BUG: users has no permission to fetch spacesForUser: ${user.metadata.guid}`,
      ); // TODO: permissions issue here
    }

    return user;
  }));

  return {
    body: usersTemplate.render({
      routePartOf: ctx.routePartOf,
      isManager,
      linkTo: ctx.linkTo,
      users,
      organization,
    }),
  };
}

export async function inviteUserForm(ctx: IContext, params: IParameters): Promise<IResponse> {
  await requirePermissions(ctx, 'org_manager', params);

  const organization = await ctx.cf.organization(params.organizationGUID);
  const spaces = await ctx.cf.spaces(params.organizationGUID);

  return {
    body: inviteTemplate.render({
      errors: [],
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      spaces,
      values: {},
    }),
  };
}

export async function inviteUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
  await requirePermissions(ctx, 'org_manager', params);

  const organization = await ctx.cf.organization(params.organizationGUID);
  const spaces = await ctx.cf.spaces(params.organizationGUID);
  const errors = [];
  const values = merge({
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

    const uaaUser = await ctx.uaa.findUser(values.email);
    let userGUID = uaaUser && uaaUser.id;
    let invitation;

    if (!userGUID) {
      invitation = await ctx.uaa.inviteUser(
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

    const users = await ctx.cf.usersForOrganization(params.organizationGUID);
    const alreadyOrgUser = users.some((user: cf.IOrganizationUserRoles) => {
      return user.metadata.guid === userGUID;
    });

    if (alreadyOrgUser) {
      throw new ValidationError([{field: 'email', message: 'user is already a member of the organisation'}]);
    }

    await ctx.cf.assignUserToOrganizationByUsername(params.organizationGUID, values.email);

    await setAllUserRolesForOrg(
      ctx,
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
        await ctx.notify.sendWelcomeEmail(values.email, {
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
        }),
        status: 400,
      };
    }

    /* istanbul ignore next */
    throw err;
  }
}

export async function editUser(ctx: IContext, params: IParameters): Promise<IResponse> {
  await requirePermissions(ctx, 'org_manager', params);

  const organization = await ctx.cf.organization(params.organizationGUID);
  const spaces = await ctx.cf.spaces(params.organizationGUID);

  const orgUsers = await ctx.cf.usersForOrganization(params.organizationGUID);
  const user = orgUsers.find((u: cf.IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  if (!user) {
    throw new NotFoundError('user not found');
  }

  const values = {
    org_roles: {
      [params.organizationGUID]: {
        billing_managers: user.entity.organization_roles.includes('billing_manager'),
        managers: user.entity.organization_roles.includes('org_manager'),
        auditors: user.entity.organization_roles.includes('org_auditor'),
      },
    },
    space_roles: await spaces.reduce(async (next: Promise<any>, space: cf.ISpace) => {
      const spaceRoles = await next;
      const spaceUsers = await ctx.cf.usersForSpace(space.metadata.guid);
      const usr = spaceUsers.find((u: cf.ISpaceUserRoles) => u.metadata.guid === params.userGUID);

      /* istanbul ignore next */
      spaceRoles[space.metadata.guid] = {
        managers: usr && usr.entity.space_roles.includes('space_manager'),
        developers: usr && usr.entity.space_roles.includes('space_developer'),
        auditors: usr && usr.entity.space_roles.includes('space_auditor'),
      };

      return spaceRoles;
    }, Promise.resolve({})),
  };

  return {
    body: editTemplate.render({
      errors: [],
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      spaces,
      user,
      values,
    }),
  };
}

export async function updateUser(ctx: IContext, params: IParameters, body: object): Promise<IResponse> {
  await requirePermissions(ctx, 'org_manager', params);

  const organization = await ctx.cf.organization(params.organizationGUID);
  const spaces = await ctx.cf.spaces(params.organizationGUID);
  const errors = [];
  const values = merge({
    org_roles: {[params.organizationGUID]: {}},
    space_roles: {},
  }, body);

  const orgUsers = await ctx.cf.usersForOrganization(params.organizationGUID);
  const user = orgUsers.find((u: cf.IOrganizationUserRoles) => u.metadata.guid === params.userGUID);

  try {
    if (Object.keys(values.org_roles[params.organizationGUID]).length === 0
      && Object.keys(values.space_roles).length === 0) {
      errors.push({field: 'roles', message: 'at least one role should be selected'});
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    await setAllUserRolesForOrg(
      ctx,
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
        }),
        status: 400,
      };
    }

    /* istanbul ignore next */
    throw err;
  }
}
