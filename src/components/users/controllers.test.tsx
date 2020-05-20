import jwt from 'jsonwebtoken';
import nock from 'nock';

import { userSummary } from '../../lib/cf/cf.test.data';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';
import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
  Token,
} from '../auth';

import * as users from './controllers';


const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {
  user_id: 'uaa-id-253',
  scope: [CLOUD_CONTROLLER_ADMIN],
  exp: time + 24 * 60 * 60,
  origin: 'uaa',
};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = createTestContext({
  token: new Token(accessToken, [tokenKey]),
});

const rawNonAdminAccessToken = {
  user_id: 'uaa-id-253',
  scope: [],
  exp: time + 24 * 60 * 60,
  origin: 'uaa',
};
const nonAdminAccessToken = jwt.sign(rawNonAdminAccessToken, tokenKey);
const nonAdminCtx: IContext = createTestContext({
  token: new Token(nonAdminAccessToken, [tokenKey]),
});

describe('users test suite', () => {
  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;
  let nockUAA: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockCF = nock(ctx.app.cloudFoundryAPI);
    nockUAA = nock(ctx.app.uaaAPI);
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.done();
    nockUAA.done();

    nock.cleanAll();
  });

  it('should show the users pages for a valid email', async () => {
    nockAccounts.get('/users?email=one@user.in.database').reply(
      200,
      `{
        "users": [{
          "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          "user_email": "one@user.in.database",
          "username": "one@user.in.database"
        }]
      }`,
    );

    nockCF
      .get('/v2/users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/summary')
      .reply(200, userSummary);

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/Users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
      .reply(200, uaaData.user);

    const response = await users.getUser(ctx, {
      emailOrUserGUID: 'one@user.in.database',
    });

    expect(response.body).toContain('User');
    expect(response.body).toContain('one@user.in.database');
    expect(response.body).toContain('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(response.body).toContain('uaa');

    expect(response.body).toContain('the-system_domain-org-name');

    expect(response.body).toContain('2018');
    expect(response.body).toContain('cloud_controller.read');
  });

  it('should not show the user page for a valid email when global auditor', async () => {
    const rawGlobalAuditorAccessToken = {
      user_id: 'uaa-id-253',
      scope: [CLOUD_CONTROLLER_GLOBAL_AUDITOR],
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
    };
    const globalAuditorAccessToken = jwt.sign(
      rawGlobalAuditorAccessToken,
      tokenKey,
    );
    const globalAuditorCtx: IContext = createTestContext({
      token: new Token(globalAuditorAccessToken, [tokenKey]),
    });

    await expect(
      users.getUser(globalAuditorCtx, {
        emailOrUserGUID: 'one@user.in.database',
      }),
    ).rejects.toThrowError('your "global auditor" permissions do not allow viewing users. sorry. please ask someone who will have more permissions, such as an engineer.');
  });

  it('should show the users pages for a valid email when read only admin', async () => {
    nockAccounts.get('/users?email=one@user.in.database').reply(
      200,
      `{
        "users": [{
          "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          "user_email": "one@user.in.database",
          "username": "one@user.in.database"
        }]
      }`,
    );

    nockCF
      .get('/v2/users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/summary')
      .reply(200, userSummary);

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/Users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
      .reply(200, uaaData.user);

    const rawReadOnlyAdminAccessToken = {
      user_id: 'uaa-id-253',
      scope: [CLOUD_CONTROLLER_READ_ONLY_ADMIN],
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
    };
    const readOnlyAdminAccessToken = jwt.sign(
      rawReadOnlyAdminAccessToken,
      tokenKey,
    );
    const readOnlyAdminCtx: IContext = createTestContext({
      token: new Token(readOnlyAdminAccessToken, [tokenKey]),
    });

    const response = await users.getUser(readOnlyAdminCtx, {
      emailOrUserGUID: 'one@user.in.database',
    });

    expect(response.body).toContain('the-system_domain-org-name');
  });

  it('should return not found for the users pages when not admin', async () => {
    await expect(
      users.getUser(nonAdminCtx, {
        emailOrUserGUID: 'one@user.in.database',
      }),
    ).rejects.toThrowError('not found');
  });

  it('should show return an error for an invalid email', async () => {
    nockAccounts
      .get('/users?email=no@user.in.database')
      .reply(200, '{"users": []}');

    await expect(
      users.getUser(ctx, {
        emailOrUserGUID: 'no@user.in.database',
      }),
    ).rejects.toThrowError('Could not find user');
  });

  it('should show the users pages a valid guid', async () => {
    nockAccounts.get('/users?email=one@user.in.database').reply(
      200,
      `{
        "users": [{
          "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
          "user_email": "one@user.in.database",
          "username": "one@user.in.database"
        }]
      }`,
    );

    nockCF
      .get('/v2/users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/summary')
      .reply(200, userSummary);

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/Users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
      .reply(200, uaaData.user);

    const response = await users.getUser(ctx, {
      emailOrUserGUID: 'one@user.in.database',
    });

    expect(response.body).toContain('User');
    expect(response.body).toContain('one@user.in.database');
    expect(response.body).toContain('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
    expect(response.body).toContain('uaa');

    expect(response.body).toContain('the-system_domain-org-name');

    expect(response.body).toContain('2018');
    expect(response.body).toContain('cloud_controller.read');
  });

  it('should show return an error for an invalid guid', async () => {
    nockAccounts.get('/users/aaaaaaaa-404b-cccc-dddd-eeeeeeeeeeee').reply(404);

    await expect(
      users.getUser(ctx, {
        emailOrUserGUID: 'aaaaaaaa-404b-cccc-dddd-eeeeeeeeeeee',
      }),
    ).rejects.toThrowError('Could not find user');
  });

  it('should show return an error for an undefined param', async () => {
    await expect(
      users.getUser(ctx, {
        emailOrUserGUID: undefined,
      }),
    ).rejects.toThrowError('not found');
  });

  it('should show return an error for an empty param', async () => {
    nockAccounts.get(`/users/${''}`).reply(404);

    await expect(
      users.getUser(ctx, {
        emailOrUserGUID: '',
      }),
    ).rejects.toThrowError('Could not find user');
  });
});
