import jwt from 'jsonwebtoken';
import nock, {RequestBodyMatcher} from 'nock';

import pino = require('pino');
import * as uaaData from '../../lib/uaa/uaa.test.data';
import {IContext} from '../app';
import {config} from '../app/app.test.config';
import {Token} from '../auth';
import * as account from './account';

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

  describe('AccountUser', () => {

    describe('name', () => {
      it('name combines user\'s given and family names', () => {
        // We don't have a full implementation of this type
        // because it's used to represent a JSON payload
        const uaaUser: any = {
          name: {
            givenName: 'User',
            familyName: 'Name',
          },
        };

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.name).toEqual('User Name');
      });
    });

    describe('email', () => {
      it('email returns the users username', () => {
        const uaaUser: any = {userName: 'foo@bar.org'};

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.email).toEqual('foo@bar.org');
      });
    });

    describe('isGDSUser', () => {
      it('returns false if the user\'s username isn\'t a GDS one', () => {
        const uaaUser: any = {userName: 'foo@bar.org'};

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.isGDSUser).toBeFalsy();
      });

      it('returns true if the user\'s primary email address is a GDS one', () => {
        const uaaUser: any = {userName: 'fake.address+paas-admin@digital.cabinet-office.gov.uk'};

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.isGDSUser).toBeTruthy();
      });
    });

    describe('authenticationMethod', () => {
      it('returns u&p if the user\'s origin is uaa', () => {
        const uaaUser: any = {origin: 'uaa'};

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.authenticationMethod).toEqual('Username & password');
      });

      it('returns google if the user\'s origin is google', () => {
        const uaaUser: any = {origin: 'google'};

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.authenticationMethod).toEqual('Google');
      });

      it('returns unknown if the user\'s origin is not uaa or google', () => {
        const uaaUser: any = {origin: 'other'};

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.authenticationMethod).toEqual('Unknown');
      });
    });

    describe('origin', () => {
      it('returns the origin of the underlying user', () => {
        const uaaUser: any = {origin: 'foo'};

        const acctUser = new account.AccountUser(uaaUser);
        expect(acctUser.origin).toEqual('foo');
      });
    });
  });
});

function setUpUAA(userData: string): IContext {
  const token = jwt.sign({
    user_id: uaaData.userId,
    scope: [],
    exp: 2535018460,
  }, 'secret');

  const ctx = {
    app: config,
    routePartOf: () => false,
    linkTo: (routeName: string) => routeName,
    log: pino({level: 'silent'}),
    token: new Token(token, ['secret']),
    csrf: ' ',
  };

  nock.cleanAll();
  nock(ctx.app.uaaAPI)
    .get(`/Users/${uaaData.userId}`).reply(200, userData)
    .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`);

  return ctx;
}
