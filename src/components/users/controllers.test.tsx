import jwt from 'jsonwebtoken';
import { merge } from 'lodash';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { space as defaultSpace } from '../../lib/cf/cf.test.data';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { orgRole, spaceRole } from '../../lib/cf/test-data/roles';
import { wrapV3Resources } from '../../lib/cf/test-data/wrap-resources';
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
  const handlers = [
    http.get(`${ctx.app.cloudFoundryAPI}/v3/*`, () => {
      return new HttpResponse('');
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/*`, () => {
      return new HttpResponse('');
    }),
    http.post(`${ctx.app.uaaAPI}/oauth/token`, ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get('grant_type');
      if (q === 'client_credentials') {
        return new HttpResponse('{"access_token": "FAKE_ACCESS_TOKEN"}');
      }
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should show the users pages for a valid email', async () => {
    const orgGUID1 = 'org-guid-1';
    const orgGUID2 = 'org-guid-2';
    const spaceGUID = 'space-guid';
    const userGUID = 'user-guid';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('email');
        if (q === 'one@user.in.database') {
          return new HttpResponse(
            `{
            "users": [{
              "user_uuid": "${userGUID}",
              "user_email": "one@user.in.database",
              "username": "one@user.in.database"
            }]
            }`,
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/roles`, () => {
        return new HttpResponse(
          JSON.stringify(wrapV3Resources(
            orgRole('organization_manager', orgGUID1, userGUID),
            spaceRole('space_developer', orgGUID2, spaceGUID, userGUID),
          )),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${orgGUID1}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            defaultOrg(),
            { metadata: { guid: orgGUID1 }, entity: { name: 'org-1' } },
          )),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${orgGUID2}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            defaultOrg(),
            { metadata: { guid: orgGUID2 }, entity: { name: 'org-2' } },
          )),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            JSON.parse(defaultSpace),
            { metadata: { guid: spaceGUID }, entity: { organization_guid: orgGUID2 } },
          )),
        );
      }),
      http.get(`${ctx.app.uaaAPI}/Users/${userGUID}`, () => {
        return new HttpResponse(uaaData.user);
      }),
    );
    const response = await users.getUser(ctx, {
      emailOrUserGUID: 'one@user.in.database',
    });

    expect(response.body).toContain('User');
    expect(response.body).toContain('one@user.in.database');
    expect(response.body).toContain(userGUID);
    expect(response.body).toContain('uaa');

    expect(response.body).toContain('org-1');
    expect(response.body).toContain('org-2');

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

    server.use(
      http.get(`${ctx.app.accountsAPI}/users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('email');
        if (q === 'no@user.in.database') {
          return new HttpResponse('{"users": []}');
        }
      }),
    );

    await expect(
      users.getUser(ctx, {
        emailOrUserGUID: 'no@user.in.database',
      }),
    ).rejects.toThrowError('Could not find user');
  });

  it('should show the users pages a valid guid', async () => {
    const orgGUID1 = 'org-guid-1';
    const userGUID = 'user-guid';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users/${userGUID}`, () => {
        return new HttpResponse(
          `{
            "user_uuid": "${userGUID}",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }`,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/roles`, () => {
        return new HttpResponse(
          JSON.stringify(wrapV3Resources(
            orgRole('organization_manager', orgGUID1, userGUID),
          )),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${orgGUID1}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            defaultOrg(),
            { metadata: { guid: orgGUID1 }, entity: { name: 'org-1' } },
          )),
        );
      }),
      http.get(`${ctx.app.uaaAPI}/Users/${userGUID}`, () => {
        return new HttpResponse(uaaData.user);
      }),
    );

    const response = await users.getUser(ctx, {
      emailOrUserGUID: userGUID,
    });

    expect(response.body).toContain('User');
    expect(response.body).toContain('one@user.in.database');
    expect(response.body).toContain(userGUID);
    expect(response.body).toContain('uaa');

    expect(response.body).toContain('org-1');

    expect(response.body).toContain('2018');
    expect(response.body).toContain('cloud_controller.read');
  });

  it('should return an error when the user is not in UAA', async () => {
    const orgGUID1 = 'org-guid-1';
    const orgGUID2 = 'org-guid-2';
    const spaceGUID = 'space-guid';
    const userGUID = 'user-guid';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users/${userGUID}`, () => {
        return new HttpResponse(
          `{
          "users": [{
            "user_uuid": "${userGUID}",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }]
          }`,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/roles`, () => {
        return new HttpResponse(
          JSON.stringify(wrapV3Resources(
            orgRole('organization_manager', orgGUID1, userGUID),
            spaceRole('space_developer', orgGUID2, spaceGUID, userGUID),
          )),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${orgGUID1}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            defaultOrg(),
            { metadata: { guid: orgGUID1 }, entity: { name: 'org-1' } },
          )),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${orgGUID2}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            defaultOrg(),
            { metadata: { guid: orgGUID2 }, entity: { name: 'org-2' } },
          )),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            JSON.parse(defaultSpace),
            { metadata: { guid: spaceGUID }, entity: { organization_guid: orgGUID2 } },
          )),
        );
      }),
      http.get(`${ctx.app.uaaAPI}/Users/*`, () => {
        return new HttpResponse(
          null,
          { status: 404 },
        );
      }),
    );

    await expect(
      users.getUser(ctx, {
        emailOrUserGUID: userGUID,
      }),
    ).rejects.toThrowError('not found');

  });

  it('should show return an error for an invalid guid', async () => {

    server.use(
      http.get(`${ctx.app.accountsAPI}/users/aaaaaaaa-404b-cccc-dddd-eeeeeeeeeeee`, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

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

    server.use(
      http.get(`${ctx.app.accountsAPI}/users/${''}`, () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );

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

  const handlers = [
    http.get(`${ctx.app.cloudFoundryAPI}`, () => {
      return new HttpResponse('');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should 404 when the user is not found in paas-accounts', async () => {
    const userEmail = 'jeff@example.com';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('email');
        if (q === `${userEmail}`) {
          return new HttpResponse(
            '{"users": []}',
          );
        }
      }),
    );
    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

    expect(response.status).toBe(404);
    expect(response.body).toContain('Error');
    expect(response.body).toContain('User not found');
  });

  it('should 404 when the user is not found in UAA', async () => {
    const userEmail = 'jeff@example.com';
    const userGuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('email');
        if (q === `${userEmail}`) {
          return new HttpResponse(
            JSON.stringify({
              users: [{
                user_uuid: userGuid,
                user_email: userEmail,
              }],
            }),
          );
        }
      }),
      http.post(`${ctx.app.uaaAPI}/oauth/token`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('grant_type');
        if (q === 'client_credentials') {
          return new HttpResponse('{"access_token": "FAKE_ACCESS_TOKEN"}');
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users/${userGuid}`, () => {
        return HttpResponse.json(null, { status: 404 });
      }),
    );

    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

    expect(response.status).toBe(404);
    expect(response.body).toContain('Error');
    expect(response.body).toContain('User not found');
  });

  it('should stop action when user is using SSO', async () => {
    const userEmail = 'jeff@example.com';
    const userGuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('email');
        if (q === `${userEmail}`) {
          return new HttpResponse(
            JSON.stringify({
              users: [{
                user_uuid: userGuid,
                user_email: userEmail,
              }],
            }),
          );
        }
      }),
      http.post(`${ctx.app.uaaAPI}/oauth/token`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('grant_type');
        if (q === 'client_credentials') {
          return new HttpResponse('{"access_token": "FAKE_ACCESS_TOKEN"}');
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users/${userGuid}`, () => {
        return new HttpResponse(
          `{
            origin: 'google',
            userName: ${userEmail},
          }`, { status: undefined },
        );
      }),
    );

    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Error');
    expect(response.body).toContain('You have enabled single sign-on, please sign in using');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should display spacing correctly', async () => {
    const userEmail = 'jeff@example.com';
    const userGuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

     server.use(
      http.get('api.notifications.service.gov.uk/v2/notifications/email', () => {
        return new HttpResponse(null, { status: 200 });
      }),
      http.get(`${ctx.app.accountsAPI}/users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('email');
        if (q === `${userEmail}`) {
          return new HttpResponse(
            JSON.stringify({
              users: [{
                user_uuid: userGuid,
                user_email: userEmail,
              }],
            }),
          );
        }
      }),
      http.post(`${ctx.app.uaaAPI}/oauth/token`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('grant_type');
        if (q === 'client_credentials') {
          return new HttpResponse('{"access_token": "FAKE_ACCESS_TOKEN"}');
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users/${userGuid}`, () => {
        return HttpResponse.json(
          JSON.stringify({
            users: [{
              user_uuid: userGuid,
              user_email: userEmail,
            }],
          }),
        );
      }),
      http.post(`${ctx.app.uaaAPI}/password_resets`, () => {
        return new HttpResponse(
          '{code: 1234567890}',
          { status: 201 },
        );
      }),
    );

    const response = await users.resetPasswordObtainToken(ctx, {}, {
      email: userEmail,
    });

    expect(response.status).toBeUndefined();
    // expect(response.body).not.toContain('Error');
    // expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
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
  const handlers = [
    http.post(`${ctx.app.uaaAPI}/oauth/token`, ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get('grant_type');
      if (q === 'client_credentials') {
        return new HttpResponse('{"access_token": "FAKE_ACCESS_TOKEN"}');
      }
    }),
    http.get(`${ctx.app.uaaAPI}/Users/*`, () => {
      return new HttpResponse('');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should display spacing correctly', async () => {

    server.use(
      http.post(`${ctx.app.uaaAPI}/password_change`, () => {
        return new HttpResponse('', { status: 200 });
      }),
    );

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

  it('should throw an error if the new password is the same as old password', async () => {

    server.use(
      http.post(`${ctx.app.uaaAPI}/password_change`, () => {
        return HttpResponse.json({
          error_description :'Your new password cannot be the same as the old password.',
          error:'invalid_password',
          message:'Your new password cannot be the same as the old password.',
          }, { status: 422 });
      }),
    );

    const response = await users.resetPassword(ctx, {}, {
      code: '1234567890',
      password: 'password-STR0NG-like-j3nk1n$',
      passwordConfirmation: 'password-STR0NG-like-j3nk1n$',
    });

    expect(response.status).toEqual(422);
    expect(response.body).toContain('Your new password cannot be the same as the old password');
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
        const { valid } = users.checkPasswordAgainstPolicy(pw);
        expect(valid).toEqual(true);
      });
    });
  });

  it('should reject a password without a lowercase character', () => {
    const { valid, message } = users.checkPasswordAgainstPolicy('AAAAAAAAAAAA$_14');
    expect(valid).toEqual(false);
    expect(message).toMatch(/lowercase/);
  });

  it('should reject a password without an uppercase character', () => {
    const { valid, message } = users.checkPasswordAgainstPolicy('aaaaaaaaaaaa$_14');
    expect(valid).toEqual(false);
    expect(message).toMatch(/uppercase/);
  });

  it('should reject a password without a number', () => {
    const { valid, message } = users.checkPasswordAgainstPolicy('aaAAAaaaaaaa$_aa');
    expect(valid).toEqual(false);
    expect(message).toMatch(/number/);
  });

  it('should reject a password without a special character', () => {
    const { valid, message } = users.checkPasswordAgainstPolicy('aaAAAaaaaaaa14');
    expect(valid).toEqual(false);
    expect(message).toMatch(/special/);
  });

  it('should reject a password that is too short', () => {
    const { valid, message } = users.checkPasswordAgainstPolicy('aB1$');
    expect(valid).toEqual(false);
    expect(message).toMatch(/12 characters or more/);
  });
});
