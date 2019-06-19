import jwt from 'jsonwebtoken';
import nock, {RequestBodyMatcher} from 'nock';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import {IContext} from '../app';
import {createTestContext} from '../app/app.test-helpers';
import {Token} from '../auth';
import * as account from './account';
import OIDC, {IAuthorizationErrorResponse} from './oidc';

jest.mock('./oidc');

describe('account test suite', () => {
  let ctx: IContext;

  describe('account.use-google-sso.view', () => {

    describe('non-GDS users', () => {
      beforeEach(() => {
        ctx = setUpUAA(uaaData.user);
      });

      it('should redirect back to home', async () => {
        const response = await account.getUseGoogleSSO(ctx, {});
        expect(response.redirect).toEqual('admin.home');
        expect(response.body).toBeFalsy();
      });
    });

    describe('GDS users', () => {
      beforeEach(() => {
        ctx = setUpUAA(uaaData.gdsUser);
      });

      it('should contain an explanation of the process, and a link to the docs', async () => {
        const response = await account.getUseGoogleSSO(ctx, {});
        expect(response.body)
          .toContain('https://docs.cloud.service.gov.uk/get_started.html#use-the-single-sign-on-function');
        expect(response.body).toContain('id="sso-process-explanation"');
      });
    });

    describe('SSO users', () => {
      beforeEach(() => {
        ctx = setUpUAA(uaaData.ssoUser);
      });

      it('should contain an explanation of the process for opting out', async () => {
        const response = await account.getUseGoogleSSO(ctx, {});
        expect(response.body).toContain('id="opt-out-process-explanation"');
      });
    });
  });

  describe('account.use-google-sso.post', () => {
    beforeEach(() => {
      ctx = setUpUAA(uaaData.user);
    });

    it('should set the logged in user\'s origin to google', async () => {
      const isOriginGoogle: RequestBodyMatcher = (body) => body.origin === 'google';
      nock(ctx.app.uaaAPI).persist()
        .put(`/Users/${uaaData.userId}`, isOriginGoogle).reply(200, uaaData.userId);

      await account.postUseGoogleSSO(ctx, {});
      expect(nock.isDone()).toBeTruthy();
    });

    it('should render a success page', async () => {
      nock(ctx.app.uaaAPI).persist()
        .put(`/Users/${uaaData.userId}`).reply(200, uaaData.userId);

      const response = await account.postUseGoogleSSO(ctx, {});
      expect(response.body).toContain('Successful');
    });
  });

  describe('account.use-microsoft-sso-view', () => {
    beforeEach(() => {
      // @ts-ignore
      OIDC.mockClear();
    });

    it('returns an error view when MS SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      const response = await account.getUseMicrosoftSSO(ctx, {});
      expect(response.body).toContain('error');
    });

    it('returns a confirmation page', async () => {
      ctx = setUpUAA(uaaData.user);
      const response = await account.getUseMicrosoftSSO(ctx, {});
      expect(response.body).toContain('Activate');
    });
  });

  describe('account.use-microsoft-sso.post', () => {
    beforeEach(() => {
      // @ts-ignore
      OIDC.mockClear();
    });

    it('returns an error view when MS SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      const response = await account.postUseMicrosoftSSO(ctx, {});
      expect(response.body).toContain('error');
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
    beforeEach(() => {
      // @ts-ignore
      OIDC.mockClear();
    });

    it('returns an error view when MS SSO is not configured', async () => {
      ctx = createTestContext();

      (ctx as any).app.oidcProviders.clear();

      const response = await account.getMicrosoftOIDCCallback(ctx, {});
      expect(response.body).toContain('error');
    });

    describe('when the OIDC provider returns an error', () => {
      it('if the error is "access_denied", returns an access denied message', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params: IAuthorizationErrorResponse = {
          error: 'access_denied',
          error_description: 'Access denied',
          error_uri: '',
          state,
        };

        const response = await account.getMicrosoftOIDCCallback(ctx, params);
        expect(response.body).toContain('Access Denied');
      });

      it('if the error is "temporarily_unavailable", returns a try again error', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params: IAuthorizationErrorResponse = {
          error: 'temporarily_unavailable',
          error_description: 'Temporarily unavailable',
          error_uri: '',
          state,
        };

        const response = await account.getMicrosoftOIDCCallback(ctx, params);
        expect(response.body).toContain('try again later');
      });

      it('if the error is not "access_denied" or "temporarily_unavailable", returns a generic error', async () => {
        ctx = createTestContext();
        const state = 'foobar';

        const params: IAuthorizationErrorResponse = {
          error: 'server_error',
          error_description: 'Server error',
          error_uri: '',
          state,
        };

        const response = await account.getMicrosoftOIDCCallback(ctx, params);
        expect(response.body).toContain('error');
      });

      it('logs any error received', async () => {
        ctx = createTestContext();
        (ctx as any).app.logger.error = jest.fn();
        const state = 'foobar';

        const params: IAuthorizationErrorResponse = {
          error: 'server_error',
          error_description: 'Server error',
          error_uri: '',
          state,
        };

        await account.getMicrosoftOIDCCallback(ctx, params);
        expect(ctx.app.logger.error).toHaveBeenCalled();
      });
    });

    it('when the callback is successful, returns a success template', async () => {
      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          oidcCallback: async () => {
            return true;
          },
        };
      });

      ctx = createTestContext();

      const response = await account.getMicrosoftOIDCCallback(ctx, {});
      expect((response.body as string).toLowerCase()).toContain('successful');
    });

    it('when the callback is unsuccessful, returns a failure template', async () => {
      // @ts-ignore
      OIDC.mockImplementation(() => {
        return {
          oidcCallback: async () => {
            return false;
          },
        };
      });

      ctx = createTestContext();

      const response = await account.getMicrosoftOIDCCallback(ctx, {});
      expect((response.body as string).toLowerCase()).toContain('unable to activate');
    });
  });
});

function setUpUAA(userData: string): IContext {
  const token = jwt.sign({
    user_id: uaaData.userId,
    scope: [],
    exp: 2535018460,
  }, 'secret');

  const ctx = createTestContext({
    linkTo: (routeName: string) => routeName,
    token: new Token(token, ['secret']),
  });

  nock.cleanAll();
  nock(ctx.app.uaaAPI)
    .get(`/Users/${uaaData.userId}`).reply(200, userData)
    .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`);

  return ctx;
}
