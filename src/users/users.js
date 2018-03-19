import express from 'express';
import merge from 'merge-deep';
import syncHandler from '../app/sync-handler';
import usersTemplate from './users.njk';
import inviteTemplate from './invite.njk';
import inviteSuccessTemplate from './invite.success.njk';

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
    organization
  }));
}));

app.get('/:organization/invite', syncHandler(async (req, res) => {
  const organization = await req.cf.organization(req.params.organization);

  const spaces = await req.cf.spaces(req.params.organization);

  res.send(inviteTemplate.render({
    spaces,
    organization,
    errors: [],
    values: {}
  }));
}));

app.post('/:organization/invite', syncHandler(async (req, res) => {
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

export default app;
