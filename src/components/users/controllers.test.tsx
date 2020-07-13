import jwt from 'jsonwebtoken';
import nock from 'nock';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { userSummary } from '../../lib/cf/cf.test.data';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';
import {
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  Token,
} from '../auth';

import * as users from './controllers';


const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {
  exp: time + 24 * 60 * 60,
  origin: 'uaa',
  scope: [CLOUD_CONTROLLER_GLOBAL_AUDITOR],
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

  it('should return not found for the users pages when not authorised', async () => {
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

  it('should return an error when the user is not in UAA', async () => {
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
      .reply(404);

    await expect(
      users.getUser(ctx, {
        emailOrUserGUID: 'one@user.in.database',
      }),
    ).rejects.toThrowError('not found');
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
  let nockAccounts: nock.Scope;
  let nockUAA: nock.Scope;
  let nockNotify: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockNotify = nock(/api.notifications.service.gov.uk/);
    nockUAA = nock(ctx.app.uaaAPI);
  });

  afterEach(() => {
    nockAccounts.done();
    nockNotify.done();
    nockUAA.done();

    nock.cleanAll();
  });

  it('should 404 when the user is not found in paas-accounts', async () => {
    const userEmail = 'jeff@example.com';

    nockAccounts
      .get(`/users?email=${userEmail}`).reply(200, '{"users": []}')
    ;

    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

    expect(response.status).toBe(404);
    expect(response.body).toContain('Error');
    expect(response.body).toContain('User not found');
  });

  it('should 404 when the user is not found in UAA', async () => {
    const userEmail = 'jeff@example.com'
    const userGuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

    nockAccounts
      .get(`/users?email=${userEmail}`).reply(
        200,
        JSON.stringify({
          users: [{
            user_uuid: userGuid,
            user_email: userEmail,
          }],
        }),
      )
    ;

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get(`/Users/${userGuid}`)
      .reply(404, {})
    ;

    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

    expect(response.status).toBe(404);
    expect(response.body).toContain('Error');
    expect(response.body).toContain('User not found');
  });

  it('should stop action when user is using SSO', async () => {
    const userEmail = 'jeff@example.com'
    const userGuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

    nockAccounts
      .get(`/users?email=${userEmail}`).reply(
        200,
        JSON.stringify({
          users: [{
            user_uuid: userGuid,
            user_email: userEmail,
          }],
        }),
      )
    ;

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get(`/Users/${userGuid}`)
      .reply(200, {
        origin: 'google',
        userName: userEmail,
      })
    ;

    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Error');
    expect(response.body).toContain('You have enabled Google single sign-on');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should display spacing correctly', async () => {
    const userEmail = 'jeff@example.com'
    const userGuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

    nockAccounts
      .get(`/users?email=${userEmail}`).reply(
        200,
        JSON.stringify({
          users: [{
            user_uuid: userGuid,
            user_email: userEmail,
          }],
        }),
      );

    nockNotify
      .post('/v2/notifications/email')
      .reply(200);

    nockUAA
      .post('/oauth/token?grant_type=client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get(`/Users/${userGuid}`)
      .reply(200, {
        origin: 'uaa',
        userName: userEmail,
      })

      .post('/password_resets')
      .reply(201, { code: '1234567890' });

    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

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
      password: 'password-STR0NG-like-j3nk1n$',
      passwordConfirmation: 'password-STR0NG-like-j3nk1n$',
    });

    expect(response.body).not.toContain('Error');
    expect(response.status).toBeUndefined();
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should throw an error if code is not provided', async () => {
    await expect(users.resetPassword(ctx, {}, {
      code: '',
      password: '',
      passwordConfirmation: '',
    })).rejects.toThrowError(/Invalid password reset token/);
  });

  it('should throw an error if passwords mismatch', async () => {
    const response = await users.resetPassword(ctx, {}, {
      code: '1234567890',
      password: 'poiuytrewq',
      passwordConfirmation: 'qwertyuiop',
    });

    expect(response.status).toEqual(400);
    expect(response.body).toContain('Error');
  });

  it('should throw an error if the password does not meet the policy', async () => {
    const response = await users.resetPassword(ctx, {}, {
      code: '1234567890',
      password: 'weakP4SSWORD',
      passwordConfirmation: 'weakP4SSWORD',
    });

    expect(response.status).toEqual(400);
    expect(response.body).toContain('should contain a special character');
  });
});

describe(users.checkPasswordAgainstPolicy, () => {
  describe('validating good passwords', () => {
    const good = [
      'ieZ]ae6uit,ugaqu,eiYeiv2Ue?th_oo',
      'lahgh]ie,xi-z7eed5asaivooH|ohrai',
      'eGhuWi%o1wai^woo!shohpeiF=ahci',
      't[ei3ajeeGh1Mit(ieBohLaica1Oo',
      'aeQuoofielai2oodu&s+isae@Gae',
      'ph2iexei0hoonue9ohM]ai6Aic',
      'ei.nue4aiyeephai7Aeb/ooN8o',
      'eloh\r&aiM_ak~o0Eer4Tid*',
      'ipheephaa1Ziebie@geuSaij',
      'Jeek0chohngah8iphohw<i',
      'mei5Iox1kuo2Foh;vie6th',
      'aLai4Ooghahth#o.c8ai',
      'o+quaePhaeth6eivoo',
      'o+aaaaPhaeth6eivo$',
    ];

    good.forEach(pw => {
      it(`should validate that ${pw} is a good password`, ()  => {
        const {valid} = users.checkPasswordAgainstPolicy(pw);
        expect(valid).toEqual(true);
      });
    });
  });

  it('should reject a password without a lowercase character', () => {
    const {valid, message} = users.checkPasswordAgainstPolicy('AAAAAAAAAAAA$_14');
    expect(valid).toEqual(false);
    expect(message).toMatch(/lowercase/);
  });

  it('should reject a password without an uppercase character', () => {
    const {valid, message} = users.checkPasswordAgainstPolicy('aaaaaaaaaaaa$_14');
    expect(valid).toEqual(false);
    expect(message).toMatch(/uppercase/);
  });

  it('should reject a password without a number', () => {
    const {valid, message} = users.checkPasswordAgainstPolicy('aaAAAaaaaaaa$_aa');
    expect(valid).toEqual(false);
    expect(message).toMatch(/number/);
  });

  it('should reject a password without a special character', () => {
    const {valid, message} = users.checkPasswordAgainstPolicy('aaAAAaaaaaaa14');
    expect(valid).toEqual(false);
    expect(message).toMatch(/special/);
  });

  it('should reject a password that is too short', () => {
    const {valid, message} = users.checkPasswordAgainstPolicy('aB1$');
    expect(valid).toEqual(false);
    expect(message).toMatch(/12 characters or more/);
  });
});
