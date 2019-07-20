import jwt from 'jsonwebtoken';
import nock from 'nock';

import * as users from './users';

import {userSummary} from '../../lib/cf/cf.test.data';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';
import {CLOUD_CONTROLLER_ADMIN, Token} from '../auth';

const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {
  user_id: 'uaa-id-253',
  scope: [CLOUD_CONTROLLER_ADMIN],
  exp: (time + (24 * 60 * 60)),
};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = createTestContext({
  token: new Token(accessToken, [tokenKey]),
});

const rawNonAdminAccessToken = {
  user_id: 'uaa-id-253',
  scope: [],
  exp: (time + (24 * 60 * 60)),
};
const nonAdminAccessToken = jwt.sign(rawNonAdminAccessToken, tokenKey);
const nonAdminCtx: IContext = createTestContext({
  token: new Token(nonAdminAccessToken, [tokenKey]),
});

describe('users test suite', () => {
  // tslint:disable:max-line-length
  const nockAccounts = nock(ctx.app.accountsAPI).persist();
  const nockCF = nock(ctx.app.cloudFoundryAPI).persist();

  nockAccounts
    .get('/users?email=one@user.in.database').reply(200, `{
      "users": [{
        "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "user_email": "one@user.in.database",
        "username": "one@user.in.database"
      }]
    }`)
    .get('/users?email=no@user.in.database').reply(200, `{"users": []}`)
    .get('/user/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee').reply(200, `{
      "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "one@user.in.database",
      "username": "one@user.in.database"
    }`)
    .get('/user/aaaaaaaa-404b-cccc-dddd-eeeeeeeeeeee').reply(404);

  nockCF
    .get('/v2/users/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/summary').reply(200, userSummary);
  // tslint:enable:max-line-length

  afterAll(() => {
    nockAccounts.done();
    nockCF.done();
  });

  it('should show the users pages for a valid email', async () => {
    const response = await users.getUser(ctx, {
      emailOrUserGUID: 'one@user.in.database',
    });

    expect(response.body).toContain('User');
    expect(response.body).toContain('one@user.in.database');
    expect(response.body).toContain('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');

    expect(response.body).toContain('the-system_domain-org-name');
  });

  it('should return not found for the users pages when not admin', async () => {

    try {
      await users.getUser(nonAdminCtx, {
        emailOrUserGUID: 'one@user.in.database',
      });
    } catch (e) {
      expect(e.message).toContain('not found');
    }
  });

  it('should show return an error for an invalid email', async () => {
    try {
      await users.getUser(ctx, {
        emailOrUserGUID: 'no@user.in.database',
      });
    } catch (e) {
      expect(e.message).toContain('Could not find user');
    }
  });

  it('should show the users pages a valid guid', async () => {
    const response = await users.getUser(ctx, {
      emailOrUserGUID: 'one@user.in.database',
    });

    expect(response.body).toContain('User');
    expect(response.body).toContain('one@user.in.database');
    expect(response.body).toContain('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee');
  });

  it('should show return an error for an invalid guid', async () => {
    try {
      await users.getUser(ctx, {
        emailOrUserGUID: 'aaaaaaaa-404b-cccc-dddd-eeeeeeeeeeee',
      });
    } catch (e) {
      expect(e.message).toContain('Could not find user');
    }
  });

  it('should show return an error for an undefined param', async () => {
    try {
      await users.getUser(ctx, {
        emailOrUserGUID: undefined,
      });
    } catch (e) {
      expect(e.message).toContain('not found');
    }
  });

  it('should show return an error for an empty param', async () => {
    try {
      await users.getUser(ctx, {
        emailOrUserGUID: '',
      });
    } catch (e) {
      expect(e.message).toContain('Could not find user');
    }
  });
});
