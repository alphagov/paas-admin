import jwt from 'jsonwebtoken';
import nock from 'nock';

import * as orgUsers from '.';

import * as cfData from '../../lib/cf/cf.test.data';
import {anOrg} from '../../lib/cf/test-data/org';
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

describe('permissions calling cc api', () => {
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock(ctx.app.cloudFoundryAPI);
  });

  afterEach(() => {
    nockCF.done();

    nock.cleanAll();
  });

  it('should make a single request due to permission update', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, anOrg().with({}))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .put('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456')
      .reply(200, `{}`)

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
        '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
          developers: {
            current: '0',
            desired: '1',
          },
        }),
      },
    });

    // expect(scope.isDone()).toBeTruthy();
    expect(response.body).toContain('Updated a team member');
  });

  it('should make no requests when permission has been previously and still is set', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, anOrg().with({}))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)
    ;

    const response = await orgUsers.updateUser(ctx, {
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

    // expect(scope.isDone()).toBeTruthy();
    expect(response.body).toContain('Updated a team member');
  });

  it('should make no requests when permission has been previously and still is unset', async () => {
    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .times(1)
      .reply(200, anOrg().with({}))

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .times(2)
      .reply(200, cfData.spaces)
    ;

    const response = await orgUsers.updateUser(ctx, {
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

    expect(response.body).toContain('Updated a team member');
  });
});
