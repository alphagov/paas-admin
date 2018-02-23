import {test} from 'tap';
import express from 'express';
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
  return request(app)
    .get('/test')
    .expect(302)
    .expect(res => {
      return res.header.location === '/auth/login';
    });
});

test('the login page redirects to the authorize endpoint of the IDP', async t => {
  return request(app)
    .get('/auth/login')
    .expect(302)
    .expect(res => {
      return res.header.location === 'https://example.com/authorise';
    });
});

test('can login with a code', async t => {
  // Required for passport to retrieve a token when calling callback

  nock('https://example.com')
    .post('/token')
    .times(1)
    .reply(200, {
      access_token: '__access_token__', // eslint-disable-line camelcase
      token_type: 'bearer', // eslint-disable-line camelcase
      refresh_token: '__refresh_token__', // eslint-disable-line camelcase
      expires_in: 43199, // eslint-disable-line camelcase
      scope: 'openid oauth.approvals',
      jti: '__jti__'
    });

  const agent = request.agent(app);

  await t.test('can reach an endpoint behind authentication', async t => {
    return agent
      .get('/test')
      .expect(302);
  });

  await t.resolves(
    agent
      .get('/auth/login/callback?code=__fakecode&state=__fakestate')
      .expect(302)
      .expect(res => {
        t.ok(res.header.location.indexOf('/test') > -1);
      })
  );

  await t.test('can reach an endpoint behind authentication', async t => {
    return agent
      .get('/test')
      .expect(200);
  });

  await t.test('does logout the user', async t => {
    return agent
      .get('/auth/logout')
      .expect(302)
      .expect(res => {
        return res.header.location === '/';
      });
  });

  await t.test('can not reach an endpoint behind authentication', async t => {
    return request(app)
      .get('/test')
      .expect(302)
      .expect(res => {
        return res.header.location === '/auth/login';
      });
  });
});
