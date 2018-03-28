import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import CloudFoundryClient from '../cf';
import * as cfData from '../cf/cf.test.data';
import NotificationClient from '../notify';
import UAAClient from '../uaa';
import * as uaaData from '../uaa/uaa.test.data';

import * as users from '.';
import { IContext } from '../app/context';

const tokenKey = 'secret';

// tslint:disable:max-line-length
nock('https://example.com/api').persist()
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, cfData.organization)
  .get('/v2/users/uaa-id-253/spaces?q=organization_guid:3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, cfData.spaces)
  .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces').reply(200, cfData.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').reply(200, cfData.spaces)
  .get('/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/organizations').reply(200, `{"resources": []}`)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').reply(200, cfData.userRolesForOrg)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles').reply(200, cfData.userRolesForSpace)
  .get('/v2/info').reply(200, cfData.info)
  .post('/v2/users').reply(200, cfData.user)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/uaa-user-edit-123456').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-edit-123456').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/uaa-user-edit-123456').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
  .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/uaa-user-edit-123456').reply(200, `{}`)
  .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/uaa-user-edit-123456').reply(200, `{}`)
  .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456').reply(200, `{}`)
  .delete('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/uaa-user-edit-123456').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/uaa-user-edit-123456').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-edit-123456').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/uaa-user-edit-123456').reply(200, `{}`)
  .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/99022be6-feb8-4f78-96f3-7d11f4d476f1').reply(200, `{}`)
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
  .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8').reply(200, {})
;

nock('https://example.com/uaa').persist()
  .get('/Users?filter=email+eq+%22imeCkO@test.org%22').reply(200, uaaData.usersByEmail)
  .get('/Users?filter=email+eq+%22jeff@jeff.com%22').reply(200, uaaData.noFoundUsersByEmail)
  .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation').reply(200, uaaData.invite)
  .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
;

nock(/api.notifications.service.gov.uk/).persist()
  .filteringPath(() => '/')
  .post('/').reply(200, {notify: 'FAKE_NOTIFY_RESPONSE'})
;
// tslint:enable:max-line-length

const time = Math.floor(Date.now() / 1000);
const rawToken = {user_id: 'uaa-id-253', scope: [], exp: (time + (24 * 60 * 60))};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = {
  cf: new CloudFoundryClient({
    apiEndpoint: 'https://example.com/api',
    accessToken,
  }),
  linkTo: () => '__LINKED_TO__',
  log: pino({level: 'silent'}),
  notify: new NotificationClient({apiKey: '__NOTIFY_KEY__', templates: {
    welcome: '__NOTIFY_WELCOME_TEMPLATE_GUID__',
  }}),
  rawToken,
  uaa: new UAAClient({
    apiEndpoint: 'https://example.com/uaa',
    clientCredentials: {
      clientID: '__UAA_CLIENT_ID__',
      clientSecret: '__UAA_CLIENT_SECRET__',
    },
  }),
};

test('should show the users pages', async t => {
  const response = await users.listUsers(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  });

  t.contains(response.body, 'Team members');
});

test('should show the invite page', async t => {
  const response = await users.inviteUserForm(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  });

  t.contains(response.body, 'Invite a new team member');
});

test('should show error message when email is missing', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {});

  t.contains(response.body, 'a valid email address is required');
  t.equal(response.status, 400);
});

test('should show error message when email is invalid according to our regex', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {email: 'x'});

  t.contains(response.body, 'a valid email address is required');
  t.equal(response.status, 400);
});

// TODO: implement this when refactoring tests
// tslint:disable:max-line-length
// test('should show error message when email is invalid acording to invite_users', async t => {
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
//   t.contains(response.text, 'a valid email address is required');
// });
// tslint:enable:max-line-length

test('should show error message when invitee is already a member of org', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {
    email: 'imeCkO@test.org',
    org_roles: {
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275': {
        billing_managers: '1',
      },
    },
  });

  t.contains(response.body, 'is already a member of the organisation');
  t.equal(response.status, 400);
});

test('should show error when no roles selected', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {email: 'jeff@jeff.com'});

  t.contains(response.body, 'at least one role should be selected');
  t.equal(response.status, 400);
});

test('should invite the user, set BillingManager role and show success', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {
    email: 'jeff@jeff.com',
    org_roles: {
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275': {
        billing_managers: '1',
      },
    },
  });

  t.contains(response.body, 'Invited a new team member');
});

test('should invite the user, set OrgManager role and show success', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {
    email: 'jeff@jeff.com',
    org_roles: {
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275': {
        managers: '1',
      },
    },
  });

  t.contains(response.body, 'Invited a new team member');
});

test('should invite the user, set OrgAuditor role and show success', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {
    email: 'jeff@jeff.com',
    org_roles: {
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275': {
        auditors: '1',
      },
    },
  });

  t.contains(response.body, 'Invited a new team member');
});

test('should invite the user, set SpaceManager role and show success', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {
    email: 'jeff@jeff.com',
    space_roles: {
      '5489e195-c42b-4e61-bf30-323c331ecc01': {
        managers: '1',
      },
    },
  });

  t.contains(response.body, 'Invited a new team member');
});

test('should invite the user, set SpaceDeveloper role and show success', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {
    email: 'jeff@jeff.com',
    space_roles: {
      '5489e195-c42b-4e61-bf30-323c331ecc01': {
        developers: '1',
      },
    },
  });

  t.contains(response.body, 'Invited a new team member');
});

test('should invite the user, set SpaceAuditor role and show success', async t => {
  const response = await users.inviteUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  }, {
    email: 'jeff@jeff.com',
    space_roles: {
      '5489e195-c42b-4e61-bf30-323c331ecc01': {
        auditors: '1',
      },
    },
  });

  t.contains(response.body, 'Invited a new team member');
});

test('should show the user edit page', async t => {
  const response = await users.editUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  });

  t.contains(response.body, 'Update a team member');
});

test('should fail to show the user edit page due to not existing user', async t => {
  t.rejects(users.editUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'not-existing-user',
  }), /user not found/);
});

test('should show error when no roles selected - User Edit', async t => {
  const response = await users.updateUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  }, {test: 'qwerty123456'});

  t.contains(response.body, 'at least one role should be selected');
  t.equal(response.status, 400);
});

test('should update the user, set BillingManager role and show success - User Edit', async t => {
  const response = await users.updateUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  }, {
    org_roles: {
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275': {
        billing_managers: '1',
      },
    },
  });

  t.contains(response.body, 'Updated a team member');
});

test('should update the user, set OrgManager role and show success - User Edit', async t => {
  const response = await users.updateUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  }, {
    org_roles: {
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275': {
        managers: '1',
      },
    },
  });

  t.contains(response.body, 'Updated a team member');
});

test('should update the user, set OrgAuditor role and show success - User Edit', async t => {
  const response = await users.updateUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  }, {
    org_roles: {
      '3deb9f04-b449-4f94-b3dd-c73cefe5b275': {
        auditors: '1',
      },
    },
  });

  t.contains(response.body, 'Updated a team member');
});

test('should update the user, set SpaceManager role and show success - User Edit', async t => {
  const response = await users.updateUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  }, {
    space_roles: {
      '5489e195-c42b-4e61-bf30-323c331ecc01': {
        managers: '1',
      },
    },
  });

  t.contains(response.body, 'Updated a team member');
});

test('should update the user, set SpaceDeveloper role and show success - User Edit', async t => {
  const response = await users.updateUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  }, {
    space_roles: {
      '5489e195-c42b-4e61-bf30-323c331ecc01': {
        developers: '1',
      },
    },
  });

  t.contains(response.body, 'Updated a team member');
});

test('should update the user, set SpaceAuditor role and show success - User Edit', async t => {
  const response = await users.updateUser(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    userGUID: 'uaa-user-edit-123456',
  }, {
    space_roles: {
      '5489e195-c42b-4e61-bf30-323c331ecc01': {
        auditors: '1',
      },
    },
  });

  t.contains(response.body, 'Updated a team member');
});
