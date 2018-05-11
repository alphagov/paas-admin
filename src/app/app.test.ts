import jwt from 'jsonwebtoken';
import moment from 'moment';
import nock from 'nock';
import request from 'supertest';
import { test } from 'tap';

import { info, organizations } from '../cf/cf.test.data';
import Router, { IParameters } from '../lib/router';

import init from './app';
import { config } from './app.test.config';
import { IContext, initContext } from './context';
import router from './router';

const tokenKey = 'tokensecret';

nock('https://example.com/uaa').persist()
  .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "TOKEN_FROM_ENDPOINT"}`)
  .get('/token_keys').reply(200, {keys: [{value: tokenKey}]});

test('should initContext correctly', async (t: any) => {
  const r = new Router([
    {
      name: 'test',
      action: async (c: IContext, _params: IParameters) => ({
        body: {
          message: c.routePartOf('test') ? 'OK' : 'NOT OK',
        },
      }),
      path: '/',
    },
  ]);
  const ctx = initContext({}, r, r.find('/'), config);

  t.ok(ctx.routePartOf('test'));
  t.ok(ctx.routePartOf('te'));
});

test('should return healthy status', async (t: any) => {
  const app = init(config);
  const response = await request(app).get('/healthcheck');

  t.equal(response.status, 200);
  t.contains(response.text, /"message":"OK"/);
});

test('should store a session in a signed cookie', async (t: any) => {
  const app = init(config);
  const response = await request(app).get('/should-not-exists/404');

  t.contains(response.header['set-cookie'][1], 'pazmin-session.sig');
});

test('should redirect to oauth provider for auth', async (t: any) => {
  const app = init(config);
  const response = await request(app).get(router.findByName('admin.organizations').composeURL());

  t.equal(response.status, 302);
});

test('missing pages should redirect with a 302 if not authenticated', async (t: any) => {
  const app = init(config);
  const response = await request(app).get('/this-should-not-exists');

  t.equal(response.status, 302);
});

test('should be able to access pricing calculator without login', async (ts: any) => {
  const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

  nock(config.billingAPI)
    .filteringPath((path: string) => {
      if (path.includes('/forecast_events')) {
        return '/billing/forecast_events';
      }

      return path;
    })
    .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
    .reply(200, [])
    .get(`/forecast_events`)
    .reply(200, [])
  ;

  const app = init(config);
  const response = await request(app).get('/calculator');

  ts.equal(response.status, 200);
});

test('should be able to handle 500 error when accessing pricing calculator', async (ts: any) => {
  const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

  nock(config.billingAPI)
    .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
    .reply(500);

  const app = init(config);
  const response = await request(app).get('/calculator');

  ts.equal(response.status, 500);
});

test('when authenticated', async (t: any) => {
  const app = init(config);
  const agent = request.agent(app);
  const time = Math.floor(Date.now() / 1000);
  const token = jwt.sign({
    user_id: 'uaa-user-123',
    scope: [],
    exp: (time + (24 * 60 * 60)),
  }, tokenKey);

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

  await t.test('should authenticate successfully', async (ts: any) => {
    const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

    ts.equal(response.status, 302);
    ts.contains(response.header['set-cookie'][0], 'pazmin-session');
  });

  nock('https://example.com/api').persist()
    .get('/v2/info').reply(200, info)
    .get('/v2/organizations').reply(200, organizations);

  await t.test('should return organisations when accessed root', async (ts: any) => {
    const response = await agent.get(router.findByName('admin.home').composeURL());

    ts.equal(response.status, 302);
    ts.equal(response.header.location, router.findByName('admin.organizations').composeURL());
  });

  await t.test('should return organisations', async (ts: any) => {
    const response = await agent.get(router.findByName('admin.organizations').composeURL());

    ts.equal(response.status, 200);
  });

  await t.test('should render as text/html with utf-8 charset', async (ts: any) => {
    const response = await agent.get(router.findByName('admin.organizations').composeURL());

    ts.equal(response.header['content-type'], 'text/html; charset=utf-8');
  });

  await t.test('should have a Content Security Policy set', async (ts: any) => {
    const response = await agent.get(router.findByName('admin.organizations').composeURL());

    ts.equal(response.header['content-security-policy'],
      `default-src 'none'; style-src 'self' 'unsafe-inline'; ` +
      `script-src 'self' www.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=' ` +
      `'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='; img-src 'self' www.google-analytics.com; ` +
      `connect-src 'self' www.google-analytics.com; frame-src 'self'; font-src 'self' data:; ` +
      `object-src 'self'; media-src 'self'`,
    );
  });

  await t.test('should gzip responses', async (ts: any) => {
    const response = await agent.get(router.findByName('admin.organizations').composeURL());

    ts.contains(response.header['content-encoding'], 'gzip');
  });

  await t.test('missing pages should come back with a 404', async (ts: any) => {
    const response = await agent.get('/this-should-not-exists');

    ts.equal(response.status, 404);
  });
});

test('when token expires', async (t: any) => {
  const app = init(config);
  const agent = request.agent(app);
  const time = Math.floor(Date.now() / 1000);
  const token = jwt.sign({
    user_id: 'uaa-user-123',
    scope: [],
    exp: (time - (24 * 60 * 60)),
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

  await t.test('should authenticate successfully', async (ts: any) => {
    const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

    ts.equal(response.status, 302);
    ts.contains(response.header['set-cookie'][0], 'pazmin-session');
  });

  await t.test('should be redirected to login due to expired token', async (ts: any) => {
    const response = await agent.get(router.findByName('admin.organizations').composeURL());

    ts.equal(response.status, 302);
  });
});

test('should store a session in a signed cookie', async (ts: any) => {
  const app = init(config);
  const response = await request(app).get('/test');

  ts.contains(response.header['set-cookie'][1], 'pazmin-session.sig');
});

test('should redirect homepage to organisations', async t => {
  const home = router.find('/');
  const orgs = router.findByName('admin.organizations');
  const response = await home.definition.action({
    routePartOf: () => false,
    linkTo: (name: string, params: IParameters = {}) => router.findByName(name).composeURL(params),
  }, {});

  t.equal(response.redirect, orgs.definition.path);
});
