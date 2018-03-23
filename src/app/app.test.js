import {test} from 'tap';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import pino from 'pino';
import nock from 'nock';
import {organizations} from '../cf/cf.test.data';
import init from '.';

const logger = pino({}, Buffer.from([]));

const sessionSecret = 'mysecret';

const config = {
  logger,
  sessionSecret,
  allowInsecure: true,
  oauthAuthorizationURL: 'https://example.com/authorise',
  oauthTokenURL: 'https://example.com/token',
  oauthClientID: 'key',
  oauthClientSecret: 'secret',
  cloudFoundryAPI: 'https://example.com/api',
  uaaAPI: 'https://example.com/uaa',
  notifyAPIKey: 'test-123456-qwerty',
  notifyWelcomeTemplateID: 'qwerty-123456',
  tokenKey: 'secret'
};

nock('https://example.com/uaa').persist()
  .get('/token_keys').reply(200, {keys: [{value: config.tokenKey}]});

test('should store a session in a signed cookie', async t => {
  const app = init(config);
  const response = await request(app).get('/should-not-exists/404');

  t.contains(response.header['set-cookie'][1], 'pazmin-session.sig');
});

test('should render as text/html with utf-8 charset', async t => {
  const app = init(config);
  const response = await request(app).get('/');

  t.equal(response.header['content-type'], 'text/html; charset=utf-8');
});

test('should have a Content Security Policy set', async t => {
  const app = init(config);
  const response = await request(app).get('/');

  t.equal(response.header['content-security-policy'], `default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' www.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=' 'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='; img-src 'self' www.google-analytics.com; connect-src 'self' www.google-analytics.com; frame-src 'self'; font-src 'self' data:; object-src 'self'; media-src 'self'`);
});

test('should gzip responses', async t => {
  const app = init(config);
  const response = await request(app).get('/');

  t.contains(response.header['content-encoding'], 'gzip');
});

test('should redirect to oauth provider for auth', async t => {
  const app = init(config);
  const response = await request(app).get('/organisations');

  t.equal(response.status, 302);
});

test('missing pages should redirect with a 302 if not authenticated', async t => {
  const app = init(config);
  const response = await request(app).get('/this-should-not-exists');

  t.equal(response.status, 302);
});

test('when authenticated', async t => {
  const app = init(config);
  const agent = request.agent(app);
  const time = Math.floor(Date.now() / 1000);
  const token = jwt.sign({user_id: 'uaa-user-123', scope: [], exp: (time + (24 * 60 * 60))}, config.tokenKey); // eslint-disable-line camelcase

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

  await t.test('should authenticate successfully', async t => {
    const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

    t.equal(response.status, 302);
    t.contains(response.header['set-cookie'][0], 'pazmin-session');
  });

  nock('https://example.com').get('/api/v2/organizations').times(1).reply(200, organizations);

  await t.test('should return organisations', async t => {
    const response = await agent.get('/organisations');

    t.equal(response.status, 200);
  });

  await t.test('missing pages should redirect with a 404', async t => {
    const response = await agent.get('/this-should-not-exists');

    t.equal(response.status, 404);
  });
});

test('when token expires', async t => {
  const app = init(config);
  const agent = request.agent(app);
  const time = Math.floor(Date.now() / 1000);
  const token = jwt.sign({user_id: 'uaa-user-123', scope: [], exp: (time - (24 * 60 * 60))}, config.tokenKey); // eslint-disable-line camelcase

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

  await t.test('should authenticate successfully', async t => {
    const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

    t.equal(response.status, 302);
    t.contains(response.header['set-cookie'][0], 'pazmin-session');
  });

  await t.test('should be redirected to login due to expired token', async t => {
    const response = await agent.get('/organisations');

    t.equal(response.status, 302);
  });
});

test('should store a session in a signed cookie', async t => {
  const app = init(config);
  const response = await request(app).get('/test');

  t.contains(response.header['set-cookie'][1], 'pazmin-session.sig');
});
