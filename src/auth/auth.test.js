import {test} from 'tap';
import express from 'express';
import jwt from 'jsonwebtoken';
import cookieSession from 'cookie-session';
import request from 'supertest';
import pino from 'pino';
import pinoMiddleware from 'express-pino-logger';
import nock from 'nock';
import auth from '.';

const app = express();

const logger = pino({}, Buffer.from([]));

app.use(pinoMiddleware(logger));

app.use(cookieSession({keys: ['mysecret']}));

app.use(auth({
  oauthAuthorizationURL: 'https://example.com/authorise',
  oauthTokenURL: 'https://example.com/token',
  oauthClientID: 'key',
  oauthClientSecret: 'secret',
  serverRootURL: 'http://localhost:3000'
}));

app.use('/test', (req, res, _next) => {
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
  t.equal(response.header.location, 'https://example.com/authorise?response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Flogin%2Fcallback&client_id=key');
});

test('can login with a code', async t => {
  const time = Math.floor(Date.now() / 1000);
  const token = jwt.sign({foo: 'bar', exp: (time + (24 * 60 * 60))}, 'shhhhh');

  // Capture the request to the given URL and prepare a response.
  nock('https://example.com')
    .post('/token')
    .times(1)
    .reply(200, {
      access_token: token, // eslint-disable-line camelcase
      token_type: 'bearer', // eslint-disable-line camelcase
      refresh_token: '__refresh_token__', // eslint-disable-line camelcase
      expires_in: (24 * 60 * 60), // eslint-disable-line camelcase
      scope: 'openid oauth.approvals',
      jti: '__jti__'
    });

  const agent = request.agent(app);

  await t.test('can reach an endpoint behind authentication', async t => {
    const response = await agent.get('/test');

    t.equal(response.status, 302);
  });

  await t.test('should authenticate successfully', async t => {
    const response = await agent.get('/auth/login/callback?code=__fakecode&state=__fakestate');

    t.equal(response.status, 302);
    t.contains(response.header.location, '/test');
  });

  await t.test('can reach an endpoint behind authentication', async t => {
    const response = await agent.get('/test');

    t.equal(response.status, 200);
  });

  await t.test('does logout the user', async t => {
    const response = await agent.get('/auth/logout');

    t.equal(response.status, 302);
    t.equal(response.header.location, '/');
  });

  await t.test('can not reach an endpoint behind authentication', async t => {
    const response = await request(app).get('/test');

    t.equal(response.status, 302);
    t.equal(response.header.location, '/auth/login');
  });
});

test('when faulty token is returned', async t => {
  const agent = request.agent(app);

  // Capture the request to the given URL and prepare a response.
  nock('https://example.com')
    .post('/token')
    .times(1)
    .reply(200, {
      access_token: '__access_token__', // eslint-disable-line camelcase
      token_type: 'bearer', // eslint-disable-line camelcase
      refresh_token: '__refresh_token__', // eslint-disable-line camelcase
      expires_in: (24 * 60 * 60), // eslint-disable-line camelcase
      scope: 'openid oauth.approvals',
      jti: '__jti__'
    });

  await t.test('should authenticate successfully', async t => {
    const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

    t.equal(response.status, 302);
  });

  await t.test('should be redirected to login due to faulty token', async t => {
    const response = await agent.get('/test');

    t.equal(response.status, 302);
  });
});
