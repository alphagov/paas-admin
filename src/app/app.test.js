import {test} from 'tap';
import request from 'supertest';
import pino from 'pino';
import nock from 'nock';
import cookies from 'expect-cookies';
import init from '.';

const logger = pino({}, Buffer.from([]));

const sessionSecret = 'mysecret';

const app = init({
  logger,
  sessionSecret,
  allowInsecure: true,
  oauthAuthorizationURL: 'https://example.com/authorise',
  oauthTokenURL: 'https://example.com/token',
  oauthClientID: 'key',
  oauthClientSecret: 'secret',
  serverRootURL: 'http://localhost:3000'
});

test('should store a session in a signed cookie', async t => {
  app.get('/something', (req, _res) => {
    req.session.test = 1;
  });

  return request(app)
    .get('/test')
    .expect(cookies.set({
      name: 'pazmin-session'
    }))
    .expect(cookies.set({
      name: 'pazmin-session.sig'
    }));
});

test('should render as text/html with utf-8 charset', async t => {
  return request(app)
    .get('/')
    .expect('Content-Type', 'text/html; charset=utf-8');
});

test('should have a Content Security Policy set', async t => {
  return request(app)
    .get('/')
    .expect('Content-Security-Policy', `default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' www.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=' 'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='; img-src 'self' www.google-analytics.com; connect-src 'self' www.google-analytics.com; frame-src 'self'; font-src 'self' data:; object-src 'self'; media-src 'self'`);
});

test('should gzip responses', async t => {
  return request(app)
    .get('/')
    .expect('Content-Encoding', /gzip/);
});

test('should redirect to oauth provider for auth', async t => {
  return request(app)
    .get('/orgs')
    .expect(302);
});

test('missing pages should redirect with a 302 if not authenticated', async t => {
  return request(app)
    .get('/this-should-not-exists')
    .expect(302);
});

test('when authenticated', async t => {
  const agent = request.agent(app);

  // Requeried for passport to retrieve a token
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

  await t.resolves(
    agent
    .get('/auth/login/callback?code=__fakecode__&state=__fakestate__')
    .expect(302)
    .expect(cookies(sessionSecret).set({
      name: 'pazmin-session'
    }))
  );

  await t.test('should return orgs', async t => {
    return agent
      .get('/orgs')
      .expect(200);
  });

  await t.test('missing pages should redirect with a 404', async t => {
    return agent
      .get('/this-should-not-exists')
      .expect(404);
  });
});

