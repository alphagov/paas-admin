import cookieSession from 'cookie-session';
import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import jwt from 'jsonwebtoken';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import pino from 'pino';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { handleSession, requireAuthentication } from './auth';

describe('auth test suite', () => {
  const app = express();
  const tokenKey = 'secret';
  const logger = pino({ level: 'silent' });

  const handlers = [
    http.get('https://example.com/uaa', () => {
      return new HttpResponse('');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  app.use(pinoMiddleware({ logger }));

  app.use(cookieSession({ keys: ['mysecret'], name: 'auth-test' }));

  const sessionConfig = {
    authorizationURL: 'https://example.com/login/oauth/authorize',
    clientID: 'key',
    clientSecret: 'secret',
    logoutURL: 'https://example.com/login/logout.do',
    tokenURL: 'https://example.com/uaa/oauth/token',
    uaaAPI: 'https://example.com/uaa',
  };
  app.use(handleSession(sessionConfig));
  app.use(requireAuthentication(sessionConfig));

  app.get('/test', (_req, res) => {
    res.status(200);
    res.send('OK');
  });

  describe('when configured correctly', () => {
    it('can not reach an endpoint behind authentication ', async () => {
      const response = await request(app).get('/test');

      expect(response.status).toEqual(302);
      expect(response.header.location).toEqual('/auth/login');
    });

    it('the login page redirects to the authorize endpoint of the IDP', async () => {
      const response = await request(app).get('/auth/login');

      expect(response.status).toEqual(302);
      expect(response.header.location).toEqual(
        'https://example.com/login/oauth/authorize?response_type=code&client_id=key',
      );
    });

    describe('can login with a code', () => {
      const time = Math.floor(Date.now() / 1000);
      const token = jwt.sign(
        {
          exp: time + 24 * 60 * 60,
          origin: 'uaa',
          scope: [],
          user_id: 'uaa-user-123',
        },
        tokenKey,
      );

      const agent = request.agent(app);

      it('can reach an endpoint behind authentication', async () => {
        const response = await agent.get('/test');

        expect(response.status).toEqual(302);
      });

      it('should authenticate successfully', async () => {
        server.use(
          http.post('https://example.com/uaa/oauth/token', () => {
            return HttpResponse.json(
              {
                access_token: token,
                expires_in: 24 * 60 * 60,
                jti: '__jti__',
                refresh_token: '__refresh_token__',
                scope: 'openid oauth.approvals',
                token_type: 'bearer',
              },
            );
          }),
        );

        const response = await agent.get(
          '/auth/login/callback?code=__fakecode&state=__fakestate',
        );

        response.header['set-cookie'][0]
          .split(',')
          .map((item: string) => item.split(';')[0])
          .forEach((cookie: string) => agent.jar.setCookie(cookie));

        expect(response.status).toEqual(302);
        expect(response.header.location).toContain('/');
      });

      it('can reach an endpoint behind authentication', async () => {
        server.use(
          http.get('https://example.com/uaa/token_keys', () => {
            return HttpResponse.json(
              { keys: [{ value: tokenKey }] },
            );
          }),
        );

        const response = await agent.get('/test');

        expect(response.status).toEqual(200);
      });

      it('does logout the user', async () => {
        const response = await agent.get('/auth/logout');

        expect(response.status).toEqual(302);
        expect(response.header.location).toEqual(
          'https://example.com/login/logout.do',
        );
      });

      it('can not reach an endpoint behind authentication', async () => {
        const response = await request(app).get('/test');

        expect(response.status).toEqual(302);
        expect(response.header.location).toEqual('/auth/login');
      });
    });

    describe('when faulty token is returned', () => {
      const agent = request.agent(app);

      it('should authenticate successfully', async () => {
        server.use(
          http.post('https://example.com/uaa/oauth/token', () => {
            return HttpResponse.json(
              {
                access_token: '__access_token__',
                expires_in: 24 * 60 * 60,
                jti: '__jti__',
                refresh_token: '__refresh_token__',
                scope: 'openid oauth.approvals',
                token_type: 'bearer',
              },
            );
          }),
        );

        const response = await agent.get(
          '/auth/login/callback?code=__fakecode__&state=__fakestate__',
        );

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
    const token = jwt.sign(
      {
        exp: time + 24 * 60 * 60,
        origin: 'uaa',
        scope: [],
        user_id: 'uaa-user-123',
      },
      tokenKey,
    );

    it('should authenticate successfully', async () => {
      server.use(
        http.post('https://example.com/uaa/oauth/token', () => {
          return HttpResponse.json(
            {
              access_token: token,
              expires_in: 24 * 60 * 60,
              jti: '__jti__',
              refresh_token: '__refresh_token__',
              scope: 'openid oauth.approvals',
              token_type: 'bearer',
            },
          );
        }),
      );

      const response = await agent.get(
        '/auth/login/callback?code=__fakecode&state=__fakestate',
      );

      response.header['set-cookie'][0]
        .split(',')
        .map((item: string) => item.split(';')[0])
        .forEach((cookie: string) => agent.jar.setCookie(cookie));

      expect(response.status).toEqual(302);
      expect(response.header.location).toContain('/');
    });

    it('should be redirected to login due faulty /token_keys endpoint', async () => {

      server.use(
        http.get('https://example.com/uaa/token_keys', () => {
          return HttpResponse.json(
            null,
            { status: 500 },
          );
        }),
      );

      const response = await agent.get('/test');

      expect(response.status).toEqual(302);
    });
  });
});
