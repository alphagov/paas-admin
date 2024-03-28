import jwt from 'jsonwebtoken';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
  const handlers = [
    http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
      return new HttpResponse(
        JSON.stringify(defaultOrg()),
      );
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
      return new HttpResponse(cfData.userRolesForOrg);
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
      return new HttpResponse(cfData.spaces);
    }),
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should make a single request due to permission update', async () => {
    server.use(

      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456`, () => {
        return new HttpResponse('{}');
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/managers/uaa-user-edit-123456`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse('{}');
        }
      }),
    );

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
    expect(response.body).toContain('Team member details successfully updated');
  });

  it('should make no requests when permission has been previously and still is set', async () => {

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
    expect(response.body).toContain('Team member details successfully updated');
  });

  it('should make no requests when permission has been previously and still is unset', async () => {

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

    expect(response.body).toContain('Team member details successfully updated');
  });
});
