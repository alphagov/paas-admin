import jwt from 'jsonwebtoken';
import nock from 'nock';


import * as cfData from '../../lib/cf/cf.test.data';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { composeOrgRoles, composeSpaceRoles } from './test-helpers';

import * as orgUsers from '.';

const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {
  user_id: 'uaa-id-253',
  scope: [],
  origin: 'uaa',
  exp: time + 24 * 60 * 60,
};
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
      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20')
      .reply(200, defaultOrg())

      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces')
      .times(2)
      .reply(200, cfData.spaces)

      .put(
        '/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456',
      )
      .reply(200, '{}')

      .put(
        '/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/managers/uaa-user-edit-123456?recursive=true',
      )
      .reply(200, '{}');

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            managers: {
              current: '0',
              desired: '1',
            },
            aduitors: {
              current: '1',
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
      },
    );

    // expect(scope.isDone()).toBeTruthy();
    expect(response.body).toContain('Updated a team member');
  });

  it('should make no requests when permission has been previously and still is set', async () => {
    nockCF
      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20')
      .reply(200, defaultOrg())

      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces')
      .times(2)
      .reply(200, cfData.spaces);

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
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
      },
    );

    // expect(scope.isDone()).toBeTruthy();
    expect(response.body).toContain('Updated a team member');
  });

  it('should make no requests when permission has been previously and still is unset', async () => {
    nockCF
      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles')
      .times(2)
      .reply(200, cfData.userRolesForOrg)

      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20')
      .times(1)
      .reply(200, defaultOrg())

      .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces')
      .times(2)
      .reply(200, cfData.spaces);

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            managers: {
              current: '1',
              desired: '1',
            },
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
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Updated a team member');
  });
});
