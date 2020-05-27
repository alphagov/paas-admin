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
  exp: time + 24 * 60 * 60,
  origin: 'uaa',
  scope: [CLOUD_CONTROLLER_ADMIN],
  user_id: 'uaa-id-253',
};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = createTestContext({
  token: new Token(accessToken, [tokenKey]),
});

const rawNonAdminAccessToken = {
  exp: time + 24 * 60 * 60,
  origin: 'uaa',
  scope: [],
  user_id: 'uaa-id-253',
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
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
      scope: [CLOUD_CONTROLLER_GLOBAL_AUDITOR],
      user_id: 'uaa-id-253',
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
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
      scope: [CLOUD_CONTROLLER_READ_ONLY_ADMIN],
      user_id: 'uaa-id-253',
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

describe(users.resetPasswordRequestToken, () => {
  it('should display spacing correctly', async () => {
    const response = await users.resetPasswordRequestToken(ctx, {});
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(users.resetPasswordObtainToken, () => {
  let nockUAA: nock.Scope;
  let nockNotify: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockUAA = nock(ctx.app.uaaAPI);
    nockNotify = nock(/api.notifications.service.gov.uk/);
  });

  afterEach(() => {
    nockUAA.done();
    nockNotify.done();

    nock.cleanAll();
  });

  it('should display spacing correctly', async () => {
    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/Users?filter=email+eq+%22jeff@example.com%22')
      .reply(200, { resources: [{ origin: 'uaa', userName: 'jeff@example.com' }] })

      .post('/password_resets')
      .reply(201, { code: '1234567890' });

    nockNotify
      .post('/v2/notifications/email')
      .reply(200);

    const response = await users.resetPasswordObtainToken(ctx, {}, { email: 'jeff@example.com' });
    expect(response.status).toBeUndefined();
    expect(response.body).not.toContain('Error');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should stop action when user is using SSO', async () => {
    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/Users?filter=email+eq+%22jeff@example.com%22')
      .reply(200, { resources: [{ origin: 'google', userName: 'jeff@example.com' }] });

    const response = await users.resetPasswordObtainToken(ctx, {}, { email: 'jeff@example.com' });
    expect(response.status).toBeUndefined();
    expect(response.body).not.toContain('Error');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should throw an error if email is not provided', async () => {
    const response = await users.resetPasswordObtainToken(ctx, {}, {});
    expect(response.status).toEqual(400);
    expect(response.body).toContain('Error');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should throw an error if email is invalid', async () => {
    const response = await users.resetPasswordObtainToken(ctx, {}, { email: 'jeff' });
    expect(response.status).toEqual(400);
    expect(response.body).toContain('Error');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(users.resetPasswordProvideNew, () => {
  it('should display spacing correctly', async () => {
    const response = await users.resetPasswordProvideNew(ctx, { code: 'FAKE_PASSWORD_RESET_CODE' });
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should throw an error if code is not provided', async () => {
    await expect(users.resetPasswordProvideNew(ctx, {})).rejects.toThrowError(/Invalid password reset token/);
  });
});

describe(users.resetPassword, () => {
  let nockUAA: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockUAA = nock(ctx.app.uaaAPI);
  });

  afterEach(() => {
    nockUAA.done();

    nock.cleanAll();
  });

  it('should display spacing correctly', async () => {
    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .post('/password_change')
      .reply(200);

    const response = await users.resetPassword(ctx, {}, {
      code: 'FAKE_PASSWORD_RESET_CODE',
      password: '123',
      passwordConfirmation: '123',
    });
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should throw an error if code is not provided', async () => {
    await expect(users.resetPassword(ctx, {}, {
      code: '',
      password: '',
      passwordConfirmation: '',
    })).rejects.toThrowError(/Invalid password reset token/);
  });

  it('should throw an error if passwords missmatch', async () => {
    const response = await users.resetPassword(ctx, {}, {
      code: '1234567890',
      password: 'poiuytrewq',
      passwordConfirmation: 'qwertyuiop',
    });

    expect(response.status).toEqual(400);
    expect(response.body).toContain('Error');
  });
});
