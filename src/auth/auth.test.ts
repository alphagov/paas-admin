import cookieSession from 'cookie-session';
import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';
import request from 'supertest';
import { test } from 'tap';

import UAAClient from '../uaa';

import auth from '.';

const app = express();

const tokenKey = 'secret';

nock('https://example.com/uaa').persist()
  .get('/token_keys').reply(200, {keys: [{value: tokenKey}]});

const logger = pino({level: 'silent'});

app.use(pinoMiddleware({logger}));

app.use(cookieSession({name: 'auth-test', keys: ['mysecret']}));

app.use((req: any, _res, next) => {
  req.uaa = new UAAClient({
    apiEndpoint: 'https://example.com/uaa',
    clientCredentials: {
      clientID: 'client',
      clientSecret: 'secret',
    },
  });

  next();
});

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

test('can not reach an endpoint behind authentication ', async t => {
  const response = await request(app).get('/test');

  t.equal(response.status, 302);
  t.equal(response.header.location, '/auth/login');
});

test('the login page redirects to the authorize endpoint of the IDP', async t => {
  const response = await request(app).get('/auth/login');

  t.equal(response.status, 302);
  t.equal(response.header.location, 'https://example.com/login/oauth/authorize?response_type=code&client_id=key');
});

test('can login with a code', async t => {
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
      access_token: token, // eslint-disable-line camelcase
      token_type: 'bearer', // eslint-disable-line camelcase
      refresh_token: '__refresh_token__', // eslint-disable-line camelcase
      expires_in: (24 * 60 * 60), // eslint-disable-line camelcase
      scope: 'openid oauth.approvals',
      jti: '__jti__',
    });

  const agent = request.agent(app);

  await t.test('can reach an endpoint behind authentication', async ts => {
    const response = await agent.get('/test');

    ts.equal(response.status, 302);
  });

  await t.test('should authenticate successfully', async ts => {
    const response = await agent.get('/auth/login/callback?code=__fakecode&state=__fakestate');

    ts.equal(response.status, 302);
    ts.contains(response.header.location, '/');
  });

  await t.test('can reach an endpoint behind authentication', async ts => {
    const response = await agent.get('/test');

    ts.equal(response.status, 200);
  });

  await t.test('does logout the user', async ts => {
    const response = await agent.get('/auth/logout');

    ts.equal(response.status, 302);
    ts.equal(response.header.location, 'https://example.com/login/logout.do');
  });

  await t.test('can not reach an endpoint behind authentication', async ts => {
    const response = await request(app).get('/test');

    ts.equal(response.status, 302);
    ts.equal(response.header.location, '/auth/login');
  });
});

test('when faulty token is returned', async t => {
  const agent = request.agent(app);

  // Capture the request to the given URL and prepare a response.
  nock('https://example.com/uaa')
    .post('/oauth/token')
    .times(1)
    .reply(200, {
      access_token: '__access_token__', // eslint-disable-line camelcase
      token_type: 'bearer', // eslint-disable-line camelcase
      refresh_token: '__refresh_token__', // eslint-disable-line camelcase
      expires_in: (24 * 60 * 60), // eslint-disable-line camelcase
      scope: 'openid oauth.approvals',
      jti: '__jti__',
    });

  await t.test('should authenticate successfully', async ts => {
    const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

    ts.equal(response.status, 302);
  });

  await t.test('should be redirected to login due to faulty token', async ts => {
    const response = await agent.get('/test');

    ts.equal(response.status, 302);
  });
});
