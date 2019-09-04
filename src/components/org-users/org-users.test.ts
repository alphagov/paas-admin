import jwt from 'jsonwebtoken';
import nock from 'nock';

import * as orgUsers from '.';

import * as cfData from '../../lib/cf/cf.test.data';
import {org as defaultOrg} from '../../lib/cf/test-data/org';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';
import {Token} from '../auth';

import {composeOrgRoles, composeSpaceRoles} from './test-helpers';

const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {user_id: 'uaa-id-253', scope: [], origin: 'uaa', exp: (time + (24 * 60 * 60))};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = createTestContext({
  token: new Token(accessToken, [tokenKey]),
});

describe('org-users test suite', () => {
  let nockCF: nock.Scope;
  let nockUAA: nock.Scope;
  let nockNotify: nock.Scope;
  let nockAccounts: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockCF = nock(ctx.app.cloudFoundryAPI);
    nockUAA = nock(ctx.app.uaaAPI);
    nockNotify = nock(/api.notifications.service.gov.uk/)
      .filteringPath(() => '/');
  });

  afterEach(() => {
    nockAccounts.done();
    nockNotify.done();
    nockUAA.done();
    nockCF.done();

    nock.cleanAll();
  });

  it('should show the users pages', async () => {
    nockCF
      .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles')
      .reply(200, cfData.userRolesForSpace)

      .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/user_roles')
      .reply(200, cfData.userRolesForSpace)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)
    ;

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .times(4)
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)

      .get('/Users/uaa-id-253')
      .reply(200, JSON.stringify({
        ...JSON.parse(uaaData.user),
        id: 'uaa-id-253',
      }))

      .get('/Users/uaa-user-edit-123456')
      .reply(200, JSON.stringify({
        ...JSON.parse(uaaData.user),
        id: 'uaa-user-edit-123456',
        origin: 'custom-origin-1',
      }))

      .get('/Users/uaa-user-changeperms-123456')
      .reply(200, JSON.stringify({
        ...JSON.parse(uaaData.user),
        id: 'uaa-user-changeperms-123456',
        origin: 'custom-origin-2',
      }))

      .get('/Users/99022be6-feb8-4f78-96f3-7d11f4d476f1')
      .reply(200, JSON.stringify({
        ...JSON.parse(uaaData.user),
        id: '99022be6-feb8-4f78-96f3-7d11f4d476f1',
        origin: 'custom-origin-3',
      }))
    ;

    const response = await orgUsers.listUsers(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });

    expect(response.body).toContain('Team members');
    expect(response.body).toContain('uaa');
    expect(response.body).toContain('Custom-origin-1');
    expect(response.body).toContain('Custom-origin-2');
    expect(response.body).toContain('Custom-origin-3');
  });

  it('should not show users who don\'t have UAA accounts', async () => {
    nockCF
      .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles')
      .reply(200, cfData.userRolesForSpace)

      .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/user_roles')
      .reply(200, cfData.userRolesForSpace)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)
    ;

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .times(4)
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)

      .get('/Users/uaa-id-253')
      .reply(200, JSON.stringify({
        ...JSON.parse(uaaData.user),
        id: 'uaa-id-253',
      }))

      .get('/Users/uaa-user-edit-123456')
      .reply(200, JSON.stringify({
        ...JSON.parse(uaaData.user),
        id: 'uaa-user-edit-123456',
        origin: 'custom-origin-1',
      }))

      .get('/Users/uaa-user-changeperms-123456')
      .reply(200, JSON.stringify({
        ...JSON.parse(uaaData.user),
        id: 'uaa-user-changeperms-123456',
        origin: 'custom-origin-2',
      }))

      // User 9902... should not be in UAA
      .get('/Users/99022be6-feb8-4f78-96f3-7d11f4d476f1')
      .reply(404, '')
    ;

    try {
      const response = await orgUsers.listUsers(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      });

      expect(response.body).not.toBeFalsy();
      expect(response.body).not.toContain('99022be6-feb8-4f78-96f3-7d11f4d476f1');
    } catch (error) {
      fail(error);
    }
  });

  it('should show the invite page', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;

    const response = await orgUsers.inviteUserForm(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });

    expect(response.body).toContain('Invite a new team member');
  });

  it('should show error message when email is missing', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;

    const response = await orgUsers.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {});

    expect(response.body).toContain('a valid email address is required');
    expect(response.status).toEqual(400);
  });

  it('should show error message when email is invalid according to our regex', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;

    const response = await orgUsers.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {email: 'x'});

    expect(response.body).toContain('a valid email address is required');
    expect(response.status).toEqual(400);
  });

  it('should show error message when invitee is already a member of org', async () => {
    nockUAA
      .get('/Users?filter=email+eq+%22imeCkO@test.org%22')
      .reply(200, uaaData.usersByEmail)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;

    const response = await orgUsers.inviteUser(ctx, {
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
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;

    const response = await orgUsers.inviteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    }, {email: 'jeff@jeff.com'});

    expect(response.body).toContain('at least one role should be selected');
    expect(response.status).toEqual(400);
  });

  it('should invite the user, set BillingManager role and show success', async () => {
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true')
      .reply(200, `{}`)
    ;
    // tslint:enable:max-line-length

    nockAccounts
      .post('/users/').reply(201)
    ;

    // tslint:disable:max-line-length
    nockUAA
      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .get('/Users?filter=email+eq+%22jeff@jeff.com%22')
      .reply(200, uaaData.noFoundUsersByEmail)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.inviteUser(ctx, {
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
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true')
      .reply(200, `{}`)
    ;

    nockUAA
      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)

      .get('/Users?filter=email+eq+%22jeff@jeff.com%22')
      .reply(200, uaaData.noFoundUsersByEmail)
    ;
    // tslint:enable:max-line-length

    nockAccounts
      .post('/users/').reply(201)
    ;

    const response = await orgUsers.inviteUser(ctx, {
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
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true')
      .reply(200, `{}`)
    ;

    nockUAA
      .get('/Users?filter=email+eq+%22jeff@jeff.com%22')
      .reply(200, uaaData.noFoundUsersByEmail)

      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`);

    nockAccounts
      .post('/users/').reply(201)
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.inviteUser(ctx, {
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
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)

      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(200, `{}`)
    ;

    nockUAA
      .get('/Users?filter=email+eq+%22jeff@jeff.com%22')
      .reply(200, uaaData.noFoundUsersByEmail)

      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockAccounts
      .post('/users/').reply(201)
    ;

    const response = await orgUsers.inviteUser(ctx, {
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
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)

      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(200, `{}`)
    ;

    nockUAA
      .get('/Users?filter=email+eq+%22jeff@jeff.com%22')
      .reply(200, uaaData.noFoundUsersByEmail)

      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockAccounts
      .post('/users/').reply(201)
    ;

    const response = await orgUsers.inviteUser(ctx, {
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
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)

      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(200, `{}`)
    ;

    nockUAA
      .get('/Users?filter=email+eq+%22jeff@jeff.com%22')
      .reply(200, uaaData.noFoundUsersByEmail)

      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockAccounts
      .post('/users/').reply(201)
    ;

    const response = await orgUsers.inviteUser(ctx, {
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

  it('should invite the user, and add them to accounts', async () => {
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8')
      .reply(201, `{"metadata": {"guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275"}}`)

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true')
      .reply(200, `{}`)
    ;
    // tslint:enable:max-line-length

    nockUAA
      .get('/Users?filter=email+eq+%22jeff@jeff.com%22')
      .reply(200, uaaData.noFoundUsersByEmail)

      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockAccounts
      .post('/users/').reply(201)
    ;

    await orgUsers.inviteUser(ctx, {
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
  });

  it('should fail if the user does not exist in org', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)
    ;

    await expect(orgUsers.resendInvitation(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'not-existing-user',
    }, {})).rejects.toThrow(/user not found/);
  });

  it('should resend user invite', async () => {
    // tslint:disable:max-line-length
    nockUAA
      .post('/invite_users?redirect_uri=https://www.cloud.service.gov.uk/next-steps?success&client_id=user_invitation')
      .reply(200, uaaData.invite)

      .get('/Users?filter=email+eq+%22user@uaa.example.com%22')
      .reply(200, uaaData.usersByEmail)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockNotify
      .post(
        '/',
        (body) => {
          const {url} = body.personalisation;
          return url === 'https://login.system_domain/invitations/accept?code=TWQlsE3gU2';
        },
      ).reply(200, {notify: 'FAKE_NOTIFY_RESPONSE'})
    ;

    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.resendInvitation(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-id-253',
    }, {});

    expect(response.body).toContain('Invited a new team member');
  });

  it('should show the user delete page', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;

    const response = await orgUsers.confirmDeletion(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    });

    expect(response.body).toContain('Confirm user deletion');
  });

  it('should update the user, set BillingManager role and show success - User Edit', async () => {
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8?recursive=true')
      .reply(200, {})

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.deleteUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: '5ff19d4c-8fa0-4d74-94e0-52eac86d55a8',
    }, {});

    expect(response.body).toContain('Deleted a team member');
  });

  it('should show the user edit page', async () => {
    nockUAA
      .get('/Users/uaa-user-edit-123456')
      .reply(200, uaaData.usersByEmail)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockAccounts.get('/users/uaa-user-edit-123456').reply(200, `{
      "user_uuid": "uaa-user-edit-123456",
      "user_email": "one@user.in.database",
      "username": "one@user.in.database"
    }`)
    ;

    nockCF
      .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles')
      .reply(200, cfData.userRolesForSpace)

      .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/user_roles')
      .reply(200, cfData.userRolesForSpace)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(4)
      .reply(200, cfData.userRolesForOrg)
    ;

    const response = await orgUsers.editUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    });

    expect(response.body).toContain('Update a team member');
    expect(response.body).toContain('one@user.in.database');
  });

  it('should fail to show the user edit page due to not existing user', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(4)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))
    ;

    await expect(orgUsers.editUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'not-existing-user',
    })).rejects.toThrow(/user not found/);
  });

  it('should fail to show the user edit page due to not existing paas-accounts user', async () => {
    nockUAA
      .get('/Users/uaa-user-edit-123456')
      .reply(200, uaaData.usersByEmail)

      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
    ;

    nockAccounts
      .get('/users/uaa-user-edit-123456')
      .reply(404, `{}`)
    ;

    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(4)
      .reply(200, cfData.userRolesForOrg)
    ;

    await expect(orgUsers.editUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    })).rejects.toThrow(/user not found/);
  });

  it('should show error when no roles selected - User Edit', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)
    ;

    const response = await orgUsers.updateUser(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      userGUID: 'uaa-user-edit-123456',
    }, {test: 'qwerty123456'});

    expect(response.body).toContain('at least one role should be selected');
    expect(response.status).toEqual(400);
  });

  it('should update the user, set BillingManager role and show success - User Edit', async () => {
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/uaa-user-edit-123456?recursive=true')
      .reply(200, `{}`)
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.updateUser(ctx, {
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
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/billing_managers/uaa-user-changeperms-123456?recursive=true')
      .reply(200, `{}`)
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.updateUser(ctx, {
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
  });

  it('should update the user, set OrgManager role and show success - User Edit', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-edit-123456?recursive=true')
      .reply(200, `{}`)
    ;

    const response = await orgUsers.updateUser(ctx, {
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
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/managers/uaa-user-changeperms-123456?recursive=true')
      .reply(200, `{}`)
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.updateUser(ctx, {
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
  });

  it('should update the user, set OrgAuditor role and show success - User Edit', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .put('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/uaa-user-edit-123456?recursive=true')
      .reply(200, `{}`)
    ;

    const response = await orgUsers.updateUser(ctx, {
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
    // tslint:disable:max-line-length
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .delete('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/auditors/uaa-user-changeperms-123456?recursive=true')
      .reply(200, `{}`)
    ;
    // tslint:enable:max-line-length

    const response = await orgUsers.updateUser(ctx, {
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
  });

  it('should update the user, set SpaceManager role and show success - User Edit', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/uaa-user-edit-123456')
      .reply(200, `{}`)
    ;

    const response = await orgUsers.updateUser(ctx, {
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
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456')
      .reply(200, `{}`)
    ;

    const response = await orgUsers.updateUser(ctx, {
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
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, JSON.stringify(defaultOrg()))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/uaa-user-edit-123456')
      .reply(200, `{}`)
    ;

    const response = await orgUsers.updateUser(ctx, {
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
