import jwt from 'jsonwebtoken';
import nock from 'nock';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import { IContext } from '../app';
import { createTestContext } from '../app/app.test-helpers';
import { Token } from '../auth';

import * as account from './account';
import OIDC from './oidc';

jest.mock('./oidc');

function setUpUAA(userData: string): IContext {
  const token = jwt.sign(
    {
      exp: 2535018460,
      origin: 'uaa',
      scope: [],
      user_id: uaaData.userId,
    },
    'secret',
  );

  const ctx = createTestContext({
    linkTo: (routeName: string) => routeName,
    token: new Token(token, ['secret']),
  });

  nock.cleanAll();
  nock(ctx.app.uaaAPI)
    .get(`/Users/${uaaData.userId}`)
    .reply(200, userData)
    .post('/oauth/token?grant_type=client_credentials')
    .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}');

  return ctx;
}

describe('account test suite', () => {
  let ctx: IContext;

  beforeEach(() => {
    // @ts-ignore
    OIDC.mockClear();
  });

  describe('account.use-google-sso.view', () => {
    it('should contain an explanation of the process for opting out', async () => {
      ctx = setUpUAA(uaaData.ssoUser);
      const response = await account.getUseGoogleSSO(ctx, {});
      expect(response.body).toContain('id="opt-out-process-explanation"');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });

    it('throws an error view when Google SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      await expect(account.getUseGoogleSSO(ctx, {})).rejects.toThrowError();
    });

    it('returns a confirmation page', async () => {
      ctx = setUpUAA(uaaData.user);
      const response = await account.getUseGoogleSSO(ctx, {});
      expect(response.body).toContain('Activate');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });

  describe('account.use-google-sso.post', () => {
    it('throws an error view when Google SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      await expect(account.postUseGoogleSSO(ctx, {})).rejects.toThrowError();
    });

    it('redirects to the OIDC authority\'s authorization endpoint', async () => {
      ctx = setUpUAA(uaaData.user);

      const redirectURL = 'https://foo.bar';

      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          getAuthorizationOIDCURL: () => {
            return redirectURL;
          },
        };
      });

      const response = await account.postUseGoogleSSO(ctx, {});
      expect(response.redirect).toEqual(redirectURL);
    });
  });

  describe('account.use-google-sso-callback.get', () => {
    it('throws an error view when Google SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      await expect(
        account.getGoogleOIDCCallback(ctx, {}),
      ).rejects.toThrowError();
    });

    describe('when the OIDC provider returns an error', () => {
      it('if the error is "access_denied", returns an access denied message', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params = {
          error: 'access_denied',
          error_description: 'Access denied',
          error_uri: '',
          state,
        };

        const response = await account.getGoogleOIDCCallback(ctx, params);
        expect(response.body).toContain('Access Denied');
        expect(
          spacesMissingAroundInlineElements(response.body as string),
        ).toHaveLength(0);
      });

      it('if the error is "temporarily_unavailable", returns a try again error', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params = {
          error: 'temporarily_unavailable',
          error_description: 'Temporarily unavailable',
          error_uri: '',
          state,
        };

        const response = await account.getGoogleOIDCCallback(ctx, params);
        expect(response.body).toContain('try again later');
        expect(
          spacesMissingAroundInlineElements(response.body as string),
        ).toHaveLength(0);
      });

      it('if the error is not "access_denied" or "temporarily_unavailable", returns a generic error', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params = {
          error: 'server_error',
          error_description: 'Server error',
          error_uri: '',
          state,
        };

        await expect(
          account.getGoogleOIDCCallback(ctx, params),
        ).rejects.toThrowError();
      });

      it('logs any error received', async () => {
        ctx = createTestContext();
        (ctx as any).app.logger.error = jest.fn();
        const state = 'foobar';

        const params = {
          error: 'server_error',
          error_description: 'Server error',
          error_uri: '',
          state,
        };

        await expect(
          account.getGoogleOIDCCallback(ctx, params),
        ).rejects.toThrowError();
        expect(ctx.app.logger.error).toHaveBeenCalled();
      });
    });

    it('when the callback is successful, returns a success template', async () => {
      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          oidcCallback: async () => await Promise.resolve(true),
        };
      });

      ctx = createTestContext();

      const response = await account.getGoogleOIDCCallback(ctx, {});
      expect((response.body as string).toLowerCase()).toContain('successful');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });

    it('when the callback is unsuccessful, returns a failure template', async () => {
      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          oidcCallback: async () => await Promise.resolve(false),
        };
      });

      ctx = createTestContext();

      const response = await account.getGoogleOIDCCallback(ctx, {});
      expect((response.body as string).toLowerCase()).toContain(
        'unable to activate',
      );
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });

  describe('account.use-microsoft-sso-view', () => {
    it('throws an error view when MS SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      await expect(account.getUseMicrosoftSSO(ctx, {})).rejects.toThrowError();
    });

    it('returns a confirmation page', async () => {
      ctx = setUpUAA(uaaData.user);
      const response = await account.getUseMicrosoftSSO(ctx, {});
      expect(response.body).toContain('Activate');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });

  describe('account.use-microsoft-sso.post', () => {
    it('throws an error view when MS SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      await expect(account.postUseMicrosoftSSO(ctx, {})).rejects.toThrowError();
    });

    it('redirects to the OIDC authority\'s authorization endpoint', async () => {
      ctx = setUpUAA(uaaData.user);

      const redirectURL = 'https://foo.bar';

      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          getAuthorizationOIDCURL: () => {
            return redirectURL;
          },
        };
      });

      const response = await account.postUseMicrosoftSSO(ctx, {});
      expect(response.redirect).toEqual(redirectURL);
    });
  });

  describe('account.use-microsoft-sso-callback.get', () => {
    it('throws an error view when MS SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      await expect(
        account.getMicrosoftOIDCCallback(ctx, {}),
      ).rejects.toThrowError();
    });

    describe('when the OIDC provider returns an error', () => {
      it('if the error is "access_denied", returns an access denied message', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params = {
          error: 'access_denied',
          error_description: 'Access denied',
          error_uri: '',
          state,
        };

        const response = await account.getMicrosoftOIDCCallback(ctx, params);
        expect(response.body).toContain('Access Denied');
        expect(
          spacesMissingAroundInlineElements(response.body as string),
        ).toHaveLength(0);
      });

      it('if the error is "temporarily_unavailable", returns a try again error', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params = {
          error: 'temporarily_unavailable',
          error_description: 'Temporarily unavailable',
          error_uri: '',
          state,
        };

        const response = await account.getMicrosoftOIDCCallback(ctx, params);
        expect(response.body).toContain('try again later');
        expect(
          spacesMissingAroundInlineElements(response.body as string),
        ).toHaveLength(0);
      });

      it('if the error is not "access_denied" or "temporarily_unavailable", returns a generic error', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params = {
          error: 'server_error',
          error_description: 'Server error',
          error_uri: '',
          state,
        };

        await expect(
          account.getMicrosoftOIDCCallback(ctx, params),
        ).rejects.toThrowError();
      });

      it('logs any error received', async () => {
        ctx = createTestContext();
        (ctx as any).app.logger.error = jest.fn();
        const state = 'foobar';

        const params = {
          error: 'server_error',
          error_description: 'Server error',
          error_uri: '',
          state,
        };

        await expect(
          account.getMicrosoftOIDCCallback(ctx, params),
        ).rejects.toThrowError();
        expect(ctx.app.logger.error).toHaveBeenCalled();
      });
    });

    it('when the callback is successful, returns a success template', async () => {
      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          oidcCallback: async () => await Promise.resolve(true),
        };
      });

      ctx = createTestContext();

      const response = await account.getMicrosoftOIDCCallback(ctx, {});
      expect((response.body as string).toLowerCase()).toContain('successful');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });

    it('when the callback is unsuccessful, returns a failure template', async () => {
      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          oidcCallback: async () => await Promise.resolve(false),
        };
      });

      ctx = createTestContext();

      const response = await account.getMicrosoftOIDCCallback(ctx, {});
      expect((response.body as string).toLowerCase()).toContain(
        'unable to activate',
      );
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });
});
