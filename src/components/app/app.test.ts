import jwt from 'jsonwebtoken';
import moment from 'moment';
import nock from 'nock';
import request from 'supertest';

import { info, organizations } from '../../lib/cf/cf.test.data';
import Router, { IParameters } from '../../lib/router';

import init from './app';
import { config } from './app.test.config';
import { IContext, initContext } from './context';
import router from './router';

const tokenKey = 'tokensecret';

nock(config.uaaAPI).persist()
  .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "TOKEN_FROM_ENDPOINT"}`)
  .get('/token_keys').reply(200, {keys: [{value: tokenKey}]})
;

nock(config.accountsAPI).persist()
  .get('/users/uaa-user-123/documents').reply(200, `[]`)
;

describe('app test suite', () => {
  it('should initContext correctly', async () => {
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
    const ctx = initContext({csrfToken: () => ''}, r, r.find('/'), config);

    expect(ctx.routePartOf('test')).toBeTruthy();
    expect(ctx.routePartOf('te')).toBeTruthy();
  });

  it('should return healthy status', async () => {
    const app = init(config);
    const response = await request(app).get('/healthcheck');

    expect(response.status).toEqual(200);
    expect(response.body).toMatchObject({ message: 'OK' });
  });

  it('should store a session in a signed cookie', async () => {
    const app = init(config);
    const response = await request(app).get('/should-not-exists/404');

    expect(response.header['set-cookie'].join('|')).toContain('pazmin-session.sig');
  });

  it('should redirect to oauth provider for auth', async () => {
    const app = init(config);
    const response = await request(app).get(router.findByName('admin.organizations').composeURL());

    expect(response.status).toEqual(302);
  });

  it('missing pages should redirect with a 302 if not authenticated', async () => {
    const app = init(config);
    const response = await request(app).get('/this-should-not-exists');

    expect(response.status).toEqual(302);
  });

  it('should be able to access pricing calculator without login', async () => {
    nock(config.billingAPI)
      .filteringPath((path: string) => {
        if (path.includes('/forecast_events')) {
          return '/billing/forecast_events';
        }
        if (path.includes('/pricing_plans')) {
          return '/billing/pricing_plans';
        }
        return path;
      })
      .get(`/pricing_plans`).reply(200, [])
      .get(`/forecast_events`).reply(200, [])
    ;

    const app = init(config);
    const response = await request(app).get('/calculator');

    expect(response.status).toEqual(200);
  });

  it('should be able to handle 500 error when accessing pricing calculator', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(500);

    const app = init(config);
    const response = await request(app).get('/calculator');

    expect(response.status).toEqual(500);
  });

  describe('when authenticated', async () => {
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

    nock('https://example.com/api').persist()
      .get('/v2/info').reply(200, info)
      .get('/v2/organizations').reply(200, organizations);

    it('should authenticate successfully', async () => {
      const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

      response.header['set-cookie'][0]
        .split(',')
        .map((item: string) => item.split(';')[0])
        .forEach((cookie: string) => agent.jar.setCookie(cookie));

      expect(response.status).toEqual(302);
      expect(response.header['set-cookie'][0]).toContain('pazmin-session');
    });

    it('should return organisations when accessed root', async () => {
      const response = await agent.get(router.findByName('admin.home').composeURL());

      expect(response.status).toEqual(302);
      expect(response.header.location).toEqual(router.findByName('admin.organizations').composeURL());
    });

    describe('visiting the organisations page', () => {
      let response: request.Response;

      beforeEach(async () => {
        response = await agent.get(router.findByName('admin.organizations').composeURL());
      });

      it('should return organisations', () => {
        expect(response.status).toEqual(200);
      });

      it('should render as text/html with utf-8 charset', () => {
        expect(response.header['content-type']).toEqual('text/html; charset=utf-8');
      });

      it('should have a Content Security Policy set', () => {
        expect(response.header['content-security-policy']).toContain(
          `default-src 'none'; style-src 'self' 'unsafe-inline'; ` +
          `script-src 'self' www.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=' ` +
          `'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='; img-src 'self' www.google-analytics.com; ` +
          `connect-src 'self' www.google-analytics.com; frame-src 'self'; font-src 'self' data:; ` +
          `object-src 'self'; media-src 'self'`,
        );
      });

      it('should gzip responses', () => {
        expect(response.header['content-encoding']).toContain('gzip');
      });
    });

    it('missing pages should come back with a 404', async () => {
      const response = await agent.get('/this-should-not-exists');

      expect(response.status).toEqual(404);
    });

    it('should store a session in a signed cookie', async () => {
      const response = await request(app).get('/test');

      expect(response.header['set-cookie'].some(
        (x: string) => x.includes('pazmin-session.sig')))
        .toBe(true);
    });

    it('should redirect homepage to organisations', async () => {
      const home = router.find('/');
      const orgs = router.findByName('admin.organizations');
      const response = await home.definition.action({
        routePartOf: () => false,
        linkTo: (name: string, params: IParameters = {}) => router.findByName(name).composeURL(params),
      }, {});

      expect(response.redirect).toEqual(orgs.definition.path);
    });
  });

  describe('when token expires', async () => {
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

    it('should authenticate successfully', async () => {
      const response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

      expect(response.status).toEqual(302);
      expect(response.header['set-cookie'][0]).toContain('pazmin-session');
    });

    it('should be redirected to login due to expired token', async () => {
      const response = await agent.get(router.findByName('admin.organizations').composeURL());

      expect(response.status).toEqual(302);
    });
  });
});
