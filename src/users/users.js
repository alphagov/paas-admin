import express from 'express';
import merge from 'merge-deep';
import {requireOrgRole, hasOrgRole} from '../auth';
import {NotFoundError} from '../errors';
import syncHandler from '../app/sync-handler';
import usersTemplate from './users.njk';
import inviteTemplate from './invite.njk';
import editTemplate from './edit.njk';
import inviteSuccessTemplate from './invite.success.njk';
import editSuccessTemplate from './edit.success.njk';

const VALID_EMAIL = /[^.]@[^.]/;

const app = express();

class ValidationError extends Error {
  constructor(arrayOfErrors) {
    super(arrayOfErrors.map(e => e.message).join(','));
    this.errors = arrayOfErrors;
    this.name = 'ValidationError';
  }
}

async function getUsers(client, organization) {
  const users = await client.usersForOrganization(organization);

  return Promise.all(users.map(async user => {
    /* istanbul ignore next */
    try {
      user.spaces = await client.spacesForUserInOrganization(user.metadata.guid, organization);
    } catch (err) {
      console.log('BUG: users has no permission to fetch spacesForUser: ' + user.metadata.guid); // TODO: permissions issue here
      user.spaces = [];
    }
    return user;
  }));
}

async function setAllUserRolesForOrg(client, organizationGUID, userGUID, {orgRoles, spaceRoles}) {
  const spaces = await client.spaces(organizationGUID);

  return Promise.all([
    ...['billing_managers', 'managers', 'auditors'].map(role =>
      client.setOrganizationRole(organizationGUID, userGUID, role, orgRoles[organizationGUID] && orgRoles[organizationGUID][role])
    ),
    ...spaces.map(space => ['managers', 'developers', 'auditors'].map(role =>
      client.setSpaceRole(space.metadata.guid, userGUID, role, spaceRoles[space.metadata.guid] && spaceRoles[space.metadata.guid][role])
    ))
  ]);
}

app.get('/:organization', syncHandler(async (req, res) => {
  const organization = await req.cf.organization(req.params.organization);

  const users = await getUsers(req.cf, req.params.organization);

  res.send(usersTemplate.render({
    users,
    organization,
    isManager: await hasOrgRole(req.cf, {
      organizationGUID: req.params.organization,
      rawAccessToken: req.rawToken,
      role: 'org_manager',
      adminWrite: true
    })
  }));
}));

app.get('/:organization/invite', requireOrgRole('org_manager', true), syncHandler(async (req, res) => {
  const organization = await req.cf.organization(req.params.organization);

  const spaces = await req.cf.spaces(req.params.organization);

  res.send(inviteTemplate.render({
    spaces,
    organization,
    errors: [],
    values: {}
  }));
}));

app.post('/:organization/invite', requireOrgRole('org_manager', true), syncHandler(async (req, res) => {
  const organizationGUID = req.params.organization;
  const organization = await req.cf.organization(organizationGUID);
  const spaces = await req.cf.spaces(organizationGUID);
  const errors = [];
  const values = merge({
    org_roles: {[organizationGUID]: {}},  // eslint-disable-line camelcase
    space_roles: {}                       // eslint-disable-line camelcase
  }, req.body);

  try {
    if (!VALID_EMAIL.test(values.email)) {
      errors.push({field: 'email', message: 'a valid email address is required'});
    }

    if (Object.keys(values.org_roles[organizationGUID]).length === 0 && Object.keys(values.space_roles).length === 0) {
      errors.push({field: 'roles', message: 'at least one role should be selected'});
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    const uaaUser = await req.uaa.findUser(values.email);
    let userGUID = uaaUser && uaaUser.id;
    let invitation;

    if (!userGUID) {
      invitation = await req.uaa.inviteUser(values.email, 'user_invitation', 'https://www.cloud.service.gov.uk/next-steps?success');
      /* istanbul ignore next */
      if (!invitation) { // TODO: test me
        throw new ValidationError([{field: 'email', message: 'a valid email address is required'}]);
      }
      userGUID = invitation.userId;
    }

    const alreadyOrgUser = (await req.cf.usersForOrganization(organizationGUID)).some(user => {
      return user.metadata.guid === userGUID;
    });
    if (alreadyOrgUser) {
      throw new ValidationError([{field: 'email', message: 'user is already a member of the organisation'}]);
    }

    await req.cf.assignUserToOrganizationByUsername(organizationGUID, values.email);

    await setAllUserRolesForOrg(
      req.cf,
      organizationGUID,
      userGUID,
      {orgRoles: values.org_roles, spaceRoles: values.space_roles}
    );

    /* istanbul ignore next */
    if (invitation) {
      try {
        await req.notify.sendWelcomeEmail(values.email, {
          organisation: organization.entity.name,
          url: invitation.inviteLink
        });
      } catch (err) {
        if (req.log) {
          req.log.error(`a user was assigned to org ${organizationGUID} but sending the invite email failed: ${err.message}`);
        }
      }
    }

    res.send(inviteSuccessTemplate.render({
      organization,
      errors
    }));
  } catch (err) {
    /* istanbul ignore next */
    if (err instanceof ValidationError) {
      return res.status(400).send(inviteTemplate.render({
        organization,
        spaces,
        errors: err.errors,
        values
      }));
    }
    /* istanbul ignore next */
    throw err;
  }
}));

app.get('/:organization/edit/:user', requireOrgRole('org_manager', true), syncHandler(async (req, res) => {
  const organization = await req.cf.organization(req.params.organization);
  const spaces = await req.cf.spaces(req.params.organization);
  const values = {};

  const orgUsers = await req.cf.usersForOrganization(req.params.organization);
  const user = orgUsers.find(u => u.metadata.guid === req.params.user);

  if (!user) {
    throw new NotFoundError('user not found');
  }

  values.org_roles = { // eslint-disable-line camelcase
    [req.params.organization]: {
      billing_managers: user.entity.organization_roles.includes('billing_manager'), // eslint-disable-line camelcase
      managers: user.entity.organization_roles.includes('org_manager'),
      auditors: user.entity.organization_roles.includes('org_auditor')
    }
  };

  values.space_roles = await spaces.reduce(async (next, space) => { // eslint-disable-line camelcase
    const spaceRoles = await next;
    const spaceUsers = await req.cf.usersForSpace(space.metadata.guid);
    const usr = spaceUsers.find(u => u.metadata.guid === req.params.user);

    /* istanbul ignore next */
    spaceRoles[space.metadata.guid] = {
      managers: usr && usr.entity.space_roles.includes('space_manager'),
      developers: usr && usr.entity.space_roles.includes('space_developer'),
      auditors: usr && usr.entity.space_roles.includes('space_auditor')
    };

    return spaceRoles;
  }, Promise.resolve({}));

  res.send(editTemplate.render({
    spaces,
    organization,
    errors: [],
    values,
    user
  }));
}));

app.post('/:organization/edit/:user', requireOrgRole('org_manager', true), syncHandler(async (req, res) => {
  const organizationGUID = req.params.organization;
  const organization = await req.cf.organization(organizationGUID);
  const spaces = await req.cf.spaces(req.params.organization);
  const errors = [];
  const values = merge({
    org_roles: {[organizationGUID]: {}},  // eslint-disable-line camelcase
    space_roles: {}                       // eslint-disable-line camelcase
  }, req.body);

  const orgUsers = await req.cf.usersForOrganization(req.params.organization);
  const user = orgUsers.find(u => u.metadata.guid === req.params.user);

  try {
    if (Object.keys(values.org_roles[organizationGUID]).length === 0 && Object.keys(values.space_roles).length === 0) {
      errors.push({field: 'roles', message: 'at least one role should be selected'});
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }

    await setAllUserRolesForOrg(
      req.cf,
      organizationGUID,
      req.params.user,
      {orgRoles: values.org_roles, spaceRoles: values.space_roles}
    );

    res.send(editSuccessTemplate.render({
      organization
    }));
  } catch (err) {
    /* istanbul ignore next */
    if (err instanceof ValidationError) {
      return res.status(400).send(editTemplate.render({
        organization,
        spaces,
        errors: err.errors,
        values,
        user
      }));
    }
    /* istanbul ignore next */
    throw err;
  }
}));

export default app;
