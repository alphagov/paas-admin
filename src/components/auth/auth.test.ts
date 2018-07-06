import cookieSession from 'cookie-session';
import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';
import request from 'supertest';

import auth from '.';

describe('auth test suite', () => {
  const app = express();
  const tokenKey = 'secret';
  const logger = pino({level: 'silent'});

  app.use(pinoMiddleware({logger}));

  app.use(cookieSession({name: 'auth-test', keys: ['mysecret']}));

  app.use(auth({
    authorizationURL: 'https://example.com/login/oauth/authorize',
    clientID: 'key',
    clientSecret: 'secret',
    logoutURL: 'https://example.com/login/logout.do',
    tokenURL: 'https://example.com/uaa/oauth/token',
    uaaAPI: 'https://example.com/uaa',
  }));

  app.get('/test', (_req, res) => {
    res.status(200);
    res.send('OK');
  });

  describe('when configured correctly', () => {
    nock('https://example.com/uaa').persist()
      .get('/token_keys').reply(200, {keys: [{value: tokenKey}]});

    it('can not reach an endpoint behind authentication ', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toEqual(302);
      expect(response.header.location).toEqual('/auth/login');
    });

    it('the login page redirects to the authorize endpoint of the IDP', async () => {
      const response = await request(app).get('/auth/login');

      expect(response.status).toEqual(302);
      expect(response.header.location)
        .toEqual('https://example.com/login/oauth/authorize?response_type=code&client_id=key');
    });

    describe('can login with a code', () => {
      const time = Math.floor(Date.now() / 1000);
      const token = jwt.sign({
        user_id: 'uaa-user-123',
        scope: [],
        exp: (time + (24 * 60 * 60)),
      }, tokenKey);

      // Capture the request to the given URL and prepare a response.
      nock('https://example.com/uaa')
        .post('/oauth/token')
        .times(1)
        .reply(200, {
          access_token: token,
          token_type: 'bearer',
          refresh_token: '__refresh_token__',
          expires_in: (24 * 60 * 60),
          scope: 'openid oauth.approvals',
          jti: '__jti__',
        });

      const agent = request.agent(app);

      it('can reach an endpoint behind authentication', async () => {
        const response = await agent.get('/test');

        expect(response.status).toEqual(302);
      });

      it('should authenticate successfully', async () => {
        const response = await agent.get('/auth/login/callback?code=__fakecode&state=__fakestate');

        response.header['set-cookie'][0]
          .split(',')
          .map((item: string) => item.split(';')[0])
          .forEach((cookie: string) => agent.jar.setCookie(cookie));

        expect(response.status).toEqual(302);
        expect(response.header.location).toContain('/');
      });

      it('can reach an endpoint behind authentication', async () => {
        const response = await agent.get('/test');

        expect(response.status).toEqual(200);
      });

      it('does logout the user', async () => {
        const response = await agent.get('/auth/logout');

        expect(response.status).toEqual(302);
        expect(response.header.location).toEqual('https://example.com/login/logout.do');
      });

      it('can not reach an endpoint behind authentication', async () => {
        const response = await request(app).get('/test');

        expect(response.status).toEqual(302);
        expect(response.header.location).toEqual('/auth/login');
      });
    });

    describe('when faulty token is returned', () => {
      const agent = request.agent(app);

      nock('https://example.com/uaa')
        .post('/oauth/token')
        .times(1)
        .reply(200, {
          access_token: '__access_token__',
          token_type: 'bearer',
          refresh_token: '__refresh_token__',
          expires_in: (24 * 60 * 60),
          scope: 'openid oauth.approvals',
          jti: '__jti__',
        });

      it('should authenticate successfully', async () => {
        const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

        expect(response.status).toEqual(302);
      });

      it('should be redirected to login due to faulty token', async () => {
        const response = await agent.get('/test');

        expect(response.status).toEqual(302);
      });
    });
  });

  describe('when misconfigured', () => {
    const agent = request.agent(app);
    const time = Math.floor(Date.now() / 1000);
    const token = jwt.sign({
      user_id: 'uaa-user-123',
      scope: [],
      exp: (time + (24 * 60 * 60)),
    }, tokenKey);

    beforeAll(() => {
      nock.cleanAll();

      nock('https://example.com/uaa').persist()
        .get('/token_keys').reply(500);

      nock('https://example.com/uaa')
        .post('/oauth/token')
        .times(1)
        .reply(200, {
          access_token: token,
          token_type: 'bearer',
          refresh_token: '__refresh_token__',
          expires_in: (24 * 60 * 60),
          scope: 'openid oauth.approvals',
          jti: '__jti__',
        });
    });

    it('should authenticate successfully', async () => {
      const response = await agent.get('/auth/login/callback?code=__fakecode&state=__fakestate');

      response.header['set-cookie'][0]
        .split(',')
        .map((item: string) => item.split(';')[0])
        .forEach((cookie: string) => agent.jar.setCookie(cookie));

      expect(response.status).toEqual(302);
      expect(response.header.location).toContain('/');
    });

    it('should be redirected to login due faulty /token_keys endpoint', async () => {
      const response = await agent.get('/test');

      expect(response.status).toEqual(302);
    });
  });
});
