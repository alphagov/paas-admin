import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';

import * as cfData from '../../lib/cf/cf.test.data';
import * as uaaData from '../../lib/uaa/uaa.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import * as users from '.';

const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {user_id: 'uaa-id-253', scope: [], exp: (time + (24 * 60 * 60))};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = {
  app: config,
  routePartOf: () => false,
  linkTo: () => '__LINKED_TO__',
  log: pino({level: 'silent'}),
  token: new Token(accessToken, [tokenKey]),
  csrf: '',
};

function composeOrgRoles(setup: object) {
  const defaultRoles = {
    billing_managers: {
      current: '0',
    },
    managers: {
      current: '0',
    },
    auditors: {
      current: '0',
    },
  };

  return {
    ...defaultRoles,
    ...setup,
  };
}

function composeSpaceRoles(setup: object) {
  const defaultRoles = {
    developers: {
      current: '0',
    },
    managers: {
      current: '0',
    },
    auditors: {
      current: '0',
    },
  };

  return {
    ...defaultRoles,
    ...setup,
  };
}

describe('users test suite', async () => {
  // tslint:disable:max-line-length
  const nockCF = nock(ctx.app.cloudFoundryAPI).persist();
  const nockUAA = nock(ctx.app.uaaAPI).persist();
  const nockNotify = nock(/api.notifications.service.gov.uk/).persist();

  nockCF
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, cfData.organization)
    .get('/v2/users/uaa-id-253/spaces?q=organization_guid:3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, cfData.spaces)
    .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces').reply(200, cfData.spaces)
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').reply(200, cfData.spaces)
    .get('/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/organizations').reply(200, `{"resources": []}`)
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').reply(200, cfData.userRolesForOrg)
    .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles').reply(200, cfData.userRolesForSpace)
    .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/user_roles').reply(200, cfData.userRolesForSpace)
    .get('/v2/info').reply(200, cfData.info)
    .post('/v2/users').reply(200, cfData.user)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/uaa-user-edit-123456?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-edit-123456?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/uaa-user-edit-123456?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/99022be6-feb8-4f78-96f3-7d11f4d476f1?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/99022be6-feb8-4f78-96f3-7d11f4d476f1?recursive=true').reply(200, `{}`)
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/99022be6-feb8-4f78-96f3-7d11f4d476f1?recursive=true').reply(200, `{}`)
    .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
    .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
    .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
    .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/uaa-user-edit-123456').reply(200, `{}`)
    .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/uaa-user-edit-123456').reply(200, `{}`)
    .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456').reply(200, `{}`)
    .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/uaa-user-edit-123456?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/uaa-user-edit-123456?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-edit-123456?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/uaa-user-edit-123456?recursive=true').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/99022be6-feb8-4f78-96f3-7d11f4d476f1?recursive=true').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/uaa-user-edit-123456').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/uaa-user-edit-123456').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
    .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
    .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users').reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)
    .get('/v2/users/99022be6-feb8-4f78-96f3-7d11f4d476f1/spaces?q=organization_guid:3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, {resources: []})
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true').reply(200, {})
  ;

  nockUAA
    .get('/Users/uaa-user-edit-123456').reply(200, uaaData.usersByEmail)
    .get('/Users?filter=email+eq+%22imeCkO@test.org%22').reply(200, uaaData.usersByEmail)
    .get('/Users?filter=email+eq+%22user@example.com%22').reply(200, uaaData.usersByEmail)
    .get('/Users?filter=email+eq+%22jeff@jeff.com%22').reply(200, uaaData.noFoundUsersByEmail)
    .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation').reply(200, uaaData.invite)
    .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
  ;

  nockNotify
    .filteringPath(() => '/')
    .post('/').reply(200, {notify: 'FAKE_NOTIFY_RESPONSE'})
  ;
  // tslint:enable:max-line-length

  afterAll(() => {
    nockCF.done();
    nockUAA.done();
    nockNotify.done();
  });

  it('should show the users pages', async () => {
    const response = await users.listUsers(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });

    expect(response.body).toContain('Team members');
  });

  it('should show the invite page', async () => {
    const response = await users.inviteUserForm(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });

    expect(response.body).toContain('Invite a new team member');
  });

  it('should show error message when email is missing', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {});

    expect(response.body).toContain('a valid email address is required');
    expect(response.status).toEqual(400);
  });

  it('should show error message when email is invalid according to our regex', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {email: 'x'});

    expect(response.body).toContain('a valid email address is required');
    expect(response.status).toEqual(400);
  });

  // TODO: implement this when refactoring tests
  // tslint:disable:max-line-length
  // it('should show error message when email is invalid acording to invite_users', async () => {
  //   nock('https://example.com/uaa')
  //     .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation').reply(200, `{new_invites: []}`)
  //     .get('/Users?filter=email+eq+%22bang@thingcom%22').reply(200, uaaData.noFoundUsersByEmail)
  //   ;
  //   const response = await request(app)
  //     .post('/3deb9f04-b449-4f94-b3dd-c73cefe5b275/invite')
  //     .type('form')
  //     .send({
  //       email: 'bang@thingcom',
  //       'org_roles[3deb9f04-b449-4f94-b3dd-c73cefe5b275][billing_managers]': '1'
  //     });
  //   t.equal(response.status, 400);
  //   expect(response.text).toContain('a valid email address is required');
  // });
  // tslint:enable:max-line-length

  it('should show error message when invitee is already a member of org', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {
      email: 'imeCkO@test.org',
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          billing_managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(response.body).toContain('is already a member of the organisation');
    expect(response.status).toEqual(400);
  });

  it('should show error when no roles selected', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {email: 'jeff@jeff.com'});

    expect(response.body).toContain('at least one role should be selected');
    expect(response.status).toEqual(400);
  });

  it('should invite the user, set BillingManager role and show success', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {
      email: 'jeff@jeff.com',
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          billing_managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });

    expect(response.body).toContain('Invited a new team member');
  });

  it('should invite the user, set OrgManager role and show success', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {
      email: 'jeff@jeff.com',
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });

    expect(response.body).toContain('Invited a new team member');
  });

  it('should invite the user, set OrgAuditor role and show success', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {
      email: 'jeff@jeff.com',
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          auditors: {
            current: '0',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });

    expect(response.body).toContain('Invited a new team member');
  });

  it('should invite the user, set SpaceManager role and show success', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {
      email: 'jeff@jeff.com',
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({}),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(response.body).toContain('Invited a new team member');
  });

  it('should invite the user, set SpaceDeveloper role and show success', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {
      email: 'jeff@jeff.com',
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({}),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          developers: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(response.body).toContain('Invited a new team member');
  });

  it('should invite the user, set SpaceAuditor role and show success', async () => {
    const response = await users.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {
      email: 'jeff@jeff.com',
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({}),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          auditors: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(response.body).toContain('Invited a new team member');
  });

  it('should fail if the user does not exist in org', async () => {
    await expect(users.resendInvitation(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'not-existing-user',
    }, {})).rejects.toThrow(/user not found/);
  });

  it('should resend user invite', async () => {
    const response = await users.resendInvitation(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-id-253',
    }, {});

    expect(response.body).toContain('Invited a new team member');
  });

  it('should show the user delete page', async () => {
    const response = await users.confirmDeletion(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    });

    expect(response.body).toContain('Confirm user deletion');
  });

  it('should update the user, set BillingManager role and show success - User Edit', async () => { // TODO: fix label
    const response = await users.deleteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: '5ff19d4c-8fa0-4d74-94e0-52eac86d55a8',
    }, {});

    expect(response.body).toContain('Deleted a team member');
  });

  it('should show the user edit page', async () => {
    const response = await users.editUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    });

    expect(response.body).toContain('Update a team member');
  });

  it('should fail to show the user edit page due to not existing user', async () => {
    await expect(users.editUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'not-existing-user',
    })).rejects.toThrow(/user not found/);
  });

  it('should show error when no roles selected - User Edit', async () => {
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {test: 'qwerty123456'});

    expect(response.body).toContain('at least one role should be selected');
    expect(response.status).toEqual(400);
  });

  it('should update the user, set BillingManager role and show success - User Edit', async () => {
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          billing_managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });

    expect(response.body).toContain('Updated a team member');
  });

  it('should update the user, remove BillingManager role and show success - User Edit', async () => {
    const scope = nock(ctx.app.cloudFoundryAPI)
    // tslint:disable:max-line-length
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/uaa-user-changeperms-123456?recursive=true').reply(200, `{}`)
      // tslint:enable:max-line-length
    ;
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-changeperms-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          billing_managers: {
            current: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });
    expect(response.body).toContain('Updated a team member');
    expect(scope.isDone());
    scope.done();
  });

  it('should update the user, set OrgManager role and show success - User Edit', async () => {
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });

    expect(response.body).toContain('Updated a team member');
  });

  it('should update the user, remove OrgManager role and show success - User Edit', async () => {
    const scope = nock(ctx.app.cloudFoundryAPI)
    // tslint:disable:max-line-length
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-changeperms-123456?recursive=true').reply(200, `{}`)
      // tslint:enable:max-line-length
    ;
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-changeperms-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          managers: {
            current: '1',
          },
          auditors: {
            current: '1',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });
    expect(response.body).toContain('Updated a team member');
    expect(scope.isDone());
    scope.done();
  });

  it('should update the user, set OrgAuditor role and show success - User Edit', async () => {
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          auditors: {
            current: '0',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });

    expect(response.body).toContain('Updated a team member');
  });

  it('should update the user, remove OrgAuditor role and show success - User Edit', async () => {
    const scope = nock(ctx.app.cloudFoundryAPI)
    // tslint:disable:max-line-length
    .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/uaa-user-changeperms-123456?recursive=true').reply(200, `{}`)
      // tslint:enable:max-line-length
    ;
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-changeperms-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          auditors: {
            current: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
      },
    });
    expect(response.body).toContain('Updated a team member');
    expect(scope.isDone());
    scope.done();
  });

  it('should update the user, set SpaceManager role and show success - User Edit', async () => {
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({}),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(response.body).toContain('Updated a team member');
  });

  it('should update the user, set SpaceDeveloper role and show success - User Edit', async () => {
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({}),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          developers: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(response.body).toContain('Updated a team member');
  });

  it('should update the user, set SpaceAuditor role and show success - User Edit', async () => {
    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({}),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          auditors: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(response.body).toContain('Updated a team member');
  });
});

describe('permissions calling cc api', async () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  it('should make a single request due to permission update', async () => {
    const scope = nock(ctx.app.cloudFoundryAPI).persist()
      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-edit-123456?recursive=true')
      .reply(200, `{}`)
      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456')
      .reply(200, `{}`)
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .reply(200, cfData.userRolesForOrg)
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, cfData.organization)
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)
    ;

    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          managers: {
            current: '0',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          developers: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    expect(scope.isDone()).toBeTruthy();
    expect(response.body).toContain('Updated a team member');
  });

  it('should make no requests when permission has been previously and still is set', async () => {
    const scope = nock('https://example.com/api').persist()
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .reply(200, cfData.userRolesForOrg)
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, cfData.organization)
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)
    ;

    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          managers: {
            current: '1',
            desired: '1',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          developers: {
            current: '1',
            desired: '1',
          },
        }),
      },
    });

    expect(scope.isDone()).toBeTruthy();
    expect(response.body).toContain('Updated a team member');
  });

  it('should make no requests when permission has been previously and still is unset', async () => {
    const scope = nock('https://example.com/api').persist()
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .reply(200, cfData.userRolesForOrg)
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, cfData.organization)
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)
    ;

    const response = await users.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {
      org_roles: {
        '3deb9f04-b449-4f94-b3dd-c73cefe5b275': composeOrgRoles({
          billing_managers: {
            current: '0',
          },
        }),
      },
      space_roles: {
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          developers: {
            current: '0',
          },
        }),
      },
    });

    expect(scope.isDone()).toBeTruthy();
    expect(response.body).toContain('Updated a team member');
  });
});

describe('_getUserRolesByGuid', () => {
  it('should return an empty map if there are no users', () => {
    const userOrgRoles: any = [];
    const spaceUserLists: any = [];
    const result = users._getUserRolesByGuid(userOrgRoles, spaceUserLists);
    expect(result).toEqual({});
  });

  it('should return org roles of a user that has no space access', () => {
    const userOrgRoles: any = [
      {
        metadata: {guid: 'some-user-guid'},
        entity: {organization_roles: ['org_manager'], username: 'some-user-name'},
      },
    ];
    const spaceUserLists: any = [];

    const result = users._getUserRolesByGuid(userOrgRoles, spaceUserLists);
    expect(result).toEqual({
      'some-user-guid': {
        orgRoles: ['org_manager'],
        username: 'some-user-name',
        spaces: [],
      },
    });
  });

  it('should return roles and space of a user that has access to one space', () => {
    const userOrgRoles: any = [
      {
        metadata: {guid: 'some-user-guid'},
        entity: {organization_roles: ['org_manager'], username: 'some-user-name'},
      },
    ];

    const space = {metadata: {guid: 'some-space-guid'}} as any;
    const user = {metadata: {guid: 'some-user-guid'}} as any;

    const spaceUserLists = [{
      space,
      users: [user],
    }];

    const result = users._getUserRolesByGuid(userOrgRoles, spaceUserLists);
    expect(result).toEqual({
      'some-user-guid': {
        orgRoles: ['org_manager'],
        username: 'some-user-name',
        spaces: [space],
      },
    });
  });

  it('should return roles and spaces of a user that has access to multiple spaces', () => {
    const userOrgRoles: any = [
      {
        metadata: {guid: 'some-user-guid'},
        entity: {organization_roles: ['org_manager'], username: 'some-user-name'},
      },
    ];

    const spaces = [1, 2, 3].map(i => ({metadata: {guid: `some-space-guid-${i}`}})) as any[];
    const user = {metadata: {guid: 'some-user-guid'}} as any;

    const spaceUserLists = spaces.map(space => ({
      space,
      users: [user],
    }));

    const result = users._getUserRolesByGuid(userOrgRoles, spaceUserLists);
    expect(result).toEqual({
      'some-user-guid': {
        orgRoles: ['org_manager'],
        username: 'some-user-name',
        spaces,
      },
    });
  });

  it('should return users, roles and spaces of multiple users', () => {
    const userOrgRoles: any = [0, 1, 2].map(i => (
      {
        metadata: {guid: `some-user-guid-${i}`},
        entity: {organization_roles: ['org_manager'], username: `some-user-name-${i}`},
      }
    ));

    const space: any = (i: number) => ({metadata: {guid: `some-space-guid-${i}`}});
    const user: any = (i: number) => ({metadata: {guid: `some-user-guid-${i}`}});

    const spaceUserLists = [
      { space: space(0), users: [user(0), user(1)]},
      { space: space(1), users: [user(1), user(2)]},
      { space: space(2), users: [user(0), user(1), user(2)]},
    ];

    const result = users._getUserRolesByGuid(userOrgRoles, spaceUserLists);
    expect(result).toEqual({
      'some-user-guid-0': {
        orgRoles: ['org_manager'],
        username: 'some-user-name-0',
        spaces: [space(0), space(2)],
      },
      'some-user-guid-1': {
        orgRoles: ['org_manager'],
        username: 'some-user-name-1',
        spaces: [space(0), space(1), space(2)],
      },
      'some-user-guid-2': {
        orgRoles: ['org_manager'],
        username: 'some-user-name-2',
        spaces: [space(1), space(2)],
      },
    });
  });
});
