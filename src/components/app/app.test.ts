// JSDOM requires request-promise-native, which doesn't load in the presence of Jest
// This results in errors like the following:
//   Unable to expose method "then" at Object.plumbing.exposePromiseMethod ...
// Mocking request-promise-native is a workaround. See https://github.com/request/request-promise/issues/247.
jest.mock('request-promise-native');

import { endOfMonth, format, startOfMonth } from 'date-fns';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import request, { SuperTest, Test } from 'supertest';

import { org as defaultOrg } from '../../lib/cf/test-data/org';
import {
  billableOrgQuota,
  billableOrgQuotaGUID,
} from '../../lib/cf/test-data/org-quota';
import { wrapResources } from '../../lib/cf/test-data/wrap-resources';
import Router, { IParameters } from '../../lib/router';
import { CLOUD_CONTROLLER_ADMIN } from '../auth';

import init from './app';
import { csp } from './app.csp';
import { config } from './app.test.config';
import { IContext, initContext } from './context';
import { router } from './router';

const tokenKey = 'tokensecret';

describe('app test suite', () => {
  let nockAccounts: nock.Scope;
  let nockBilling: nock.Scope;
  let nockCF: nock.Scope;
  let nockUAA: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(config.accountsAPI);
    nockBilling = nock(config.billingAPI);
    nockCF = nock(config.cloudFoundryAPI);
    nockUAA = nock(config.uaaAPI);
  });

  afterEach(() => {
    nockAccounts.done();
    nockBilling.done();
    nockCF.on('response', () => {
      nockCF.done();
    });
    nockUAA.done();

    nock.cleanAll();
  });

  it('should initContext correctly', () => {
    const r = new Router([
      {
        action: async (c: IContext, _params: IParameters) => await Promise.resolve({
          body: {
            message: c.routePartOf('test') ? 'OK' : 'NOT OK',
          },
        }),
        name: 'test',
        path: '/',
      },
    ]);
    const ctx = initContext({ csrfToken: () => '' }, r, r.find('/'), config);

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

    expect(response.header['set-cookie'].join('|')).toContain(
      'pazmin-session.sig',
    );
  });

  it('should redirect to oauth provider for auth', async () => {
    const app = init(config);
    const response = await request(app).get(
      router.findByName('admin.organizations').composeURL(),
    );

    expect(response.status).toEqual(302);
  });

  it('missing pages should redirect with a 302 if not authenticated', async () => {
    const app = init(config);
    const response = await request(app).get('/this-should-not-exists');

    expect(response.status).toEqual(302);
  });

  it('should be able to access pricing calculator without login', async () => {
    nockBilling
      .filteringPath((path: string) => {
        if (path.includes('/forecast_events')) {
          return '/billing/forecast_events';
        }
        if (path.includes('/pricing_plans')) {
          return '/billing/pricing_plans';
        }

        return path;
      })

      .get('/pricing_plans')
      .reply(200, []);

    const app = init(config);
    const response = await request(app).get('/calculator');

    expect(response.status).toEqual(200);
  });

  it('should be able to handle 500 error when accessing pricing calculator', async () => {
    const rangeStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const rangeStop = format(endOfMonth(new Date()), 'yyyy-MM-dd');

    nockBilling
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(500);

    const app = init(config);
    const response = await request(app).get('/calculator');

    expect(response.status).toEqual(500);
  });

  it('should be able to access performance dashboard without login', async () => {
    const sampleMetric = { date: new Date(), value: 1 };
    const performanceMetrics = {
      applications: [{ label: 'applications', metrics: [sampleMetric, sampleMetric] }],
      organizations: [
        { label: 'billable', metrics: [sampleMetric, sampleMetric] },
        { label: 'trial', metrics: [sampleMetric, sampleMetric] },
      ],
      services: [{ label: 'services', metrics: [sampleMetric, sampleMetric] }],
    };

    nock('https://example.com/performance')
      .get('/metrics.json')
      .reply(200, performanceMetrics);

    const app = init(config);
    const response = await request(app).get('/performance');

    expect(response.status).toEqual(200);
  });

  it('should fail to access performance dashboard due to prometheus error', async () => {
    nock('https://example.com/performance')
      .get('/metrics.json')
      .reply(500);

    const app = init(config);
    const response = await request(app).get('/performance');

    expect(response.status).toEqual(500);
  });

  it('should be able to download performance dashboard without login', async () => {
    const sampleMetric = { date: new Date(), value: 1 };
    const performanceMetrics = {
      applications: [{ label: 'applications', metrics: [sampleMetric, sampleMetric] }],
      organizations: [
        { label: 'billable', metrics: [sampleMetric, sampleMetric] },
        { label: 'trial', metrics: [sampleMetric, sampleMetric] },
      ],
      services: [{ label: 'services', metrics: [sampleMetric, sampleMetric] }],
    };

    nock('https://example.com/performance')
      .get('/metrics.json')
      .reply(200, performanceMetrics);

    const app = init(config);
    const response = await request(app).get('/performance/mOrganizations');

    expect(response.status).toEqual(200);
  });

  it('should fail to download performance dashboard due to prometheus error', async () => {
    nock('https://example.com/performance')
      .get('/metrics.json')
      .reply(500);

    const app = init(config);
    const response = await request(app).get('/performance/mOrganizations');

    expect(response.status).toEqual(500);
  });

  it('should be able to access marketplace without login', async () => {
    const service = { broker_catalog: { metadata: {} }, guid: 'SERVICE_GUID', name: 'postgres', tags: [] };
    nockCF
      .get('/v3/service_offerings').reply(200, { pagination: { next: null }, resources: [ service ] });

    const app = init(config);
    const response = await request(app).get('/marketplace');

    expect(response.status).toEqual(200);
  });

  it('should throw error when accessing marketplace without services', async () => {
    nockCF
      .get('/v3/service_offerings').reply(404);

    const app = init(config);
    const response = await request(app).get('/marketplace');

    expect(response.status).toEqual(500);
  });

  it('should be able to access marketplace service without login', async () => {
    const service = { broker_catalog: { metadata: {} }, guid: 'SERVICE_GUID', name: 'postgres', tags: [] };
    const plan = { broker_catalog: { metadata: {} }, name: 'tiny' };
    nockCF
      .get('/v3/service_offerings/SERVICE_GUID')
      .reply(200, service)

      .get('/v3/service_plans?service_offering_guids=SERVICE_GUID')
      .reply(200, { pagination: { next: null }, resources: [ plan ] })
    ;

    const app = init(config);
    const response = await request(app).get('/marketplace/SERVICE_GUID');

    expect(response.status).toEqual(200);
  });

  it('should throw error when accessing marketplace service', async () => {
    nockCF
      .get('/v3/service_offerings/SERVICE_GUID').reply(404)
      .get('/v3/service_plans?service_offering_guids=SERVICE_GUID').reply(404)
    ;

    const app = init(config);
    const response = await request(app).get('/marketplace/SERVICE_GUID');

    expect(response.status).toEqual(500);
  });

  it('should be able to access password reset request page without login', async () => {
    const app = init(config);
    const response = await request(app).get('/password/request-reset');

    expect(response.status).toEqual(200);
  });

  it('should be able to access password reset page without login', async () => {
    const app = init(config);
    const response = await request(app).get('/password/confirm-reset?code=1234567890');

    expect(response.status).toEqual(200);
  });

  it('should return a 403 when accessing /forbidden', async () => {
    // In practice this endpoint is only used for testing the 403 middleware

    const app = init(config);
    const response = await request(app).get('/forbidden');

    expect(response.status).toEqual(403);
  });

  describe('when authenticated as a normal user', () => {
    let response: request.Response;
    let agent: SuperTest<Test>;

    const app = init(config);
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

    beforeEach(async () => {
      nockUAA.post('/oauth/token').reply(200, {
        access_token: token,
        expires_in: 24 * 60 * 60,
        jti: '__jti__',
        refresh_token: '__refresh_token__',
        scope: 'openid oauth.approvals',
        token_type: 'bearer',
      });

      agent = request.agent(app);
      response = await agent.get(
        '/auth/login/callback?code=__fakecode__&state=__fakestate__',
      );

      response.header['set-cookie'][0]
        .split(',')
        .map((item: string) => item.split(';')[0])
        .forEach((cookie: string) => agent.jar.setCookie(cookie));
    });

    it('should authenticate successfully', () => {
      expect(response.status).toEqual(302);
      expect(response.header['set-cookie'][0]).toContain('pazmin-session');
    });

    it('should redirect to organisations when accessed root', async () => {
      nockAccounts.get('/users/uaa-user-123/documents').reply(200, '[]');

      nockUAA.get('/token_keys').reply(200, { keys: [{ value: tokenKey }] });

      response = await agent.get(router.findByName('admin.home').composeURL());

      expect(response.status).toEqual(302);
      expect(response.header.location).toEqual(
        router.findByName('admin.organizations').composeURL(),
      );
    });

    describe('visiting the organisations page', () => {
      beforeEach(async () => {
        nockAccounts.get('/users/uaa-user-123/documents').reply(200, '[]');

        nockCF
          .get('/v2/organizations')
          .reply(200, JSON.stringify(wrapResources(defaultOrg())))

          .get(`/v2/quota_definitions/${billableOrgQuotaGUID}`)
          .reply(200, JSON.stringify(billableOrgQuota()));

        nockUAA.get('/token_keys').reply(200, { keys: [{ value: tokenKey }] });

        response = await agent.get(
          router.findByName('admin.organizations').composeURL(),
        );
      });

      it('should return organisations', () => {
        expect(response.status).toEqual(200);
      });

      it('should render as text/html with utf-8 charset', () => {
        expect(response.header['content-type']).toEqual(
          'text/html; charset=utf-8',
        );
      });

      it('should have a Content Security Policy set', () => {
        expect(response.header['content-security-policy']).toContain(
          `default-src ${csp.directives.defaultSrc.join(' ')}`,
        );
        expect(response.header['content-security-policy']).toContain(
          `style-src ${csp.directives.styleSrc.join(' ')}`,
        );

        expect(response.header['content-security-policy']).toContain(
          `script-src ${csp.directives.scriptSrc.join(' ')}`,
        );

        expect(response.header['content-security-policy']).toContain(
          `img-src ${csp.directives.imgSrc.join(' ')}`,
        );

        expect(response.header['content-security-policy']).toContain(
          `connect-src ${csp.directives.connectSrc.join(' ')}`,
        );

        expect(response.header['content-security-policy']).toContain(
          `frame-src ${csp.directives.frameSrc.join(' ')}`,
        );

        expect(response.header['content-security-policy']).toContain(
          `font-src ${csp.directives.fontSrc.join(' ')}`,
        );

        expect(response.header['content-security-policy']).toContain(
          `object-src ${csp.directives.objectSrc.join(' ')}`,
        );

        expect(response.header['content-security-policy']).toContain(
          `media-src ${csp.directives.mediaSrc.join(' ')}`,
        );
      });

      it('should gzip responses', () => {
        expect(response.header['content-encoding']).toContain('gzip');
      });

      it('should not show a link to the platform admin page', () => {
        expect(response.status).toEqual(200);
        expect(response.text).not.toMatch(/Admin/);
      });
    });

    it('missing pages should come back with a 404', async () => {
      nockAccounts.get('/users/uaa-user-123/documents').reply(200, '[]');

      nockUAA.get('/token_keys').reply(200, { keys: [{ value: tokenKey }] });

      response = await agent.get('/this-should-not-exists');

      expect(response.status).toEqual(404);
    });

    it('should store a session in a signed cookie', async () => {
      response = await request(app).get('/test');

      expect(
        response.header['set-cookie'].some((x: string) =>
          x.includes('pazmin-session.sig'),
        ),
      ).toBe(true);
    });

    it('should redirect homepage to organisations', async () => {
      const home = router.find('/');
      const orgs = router.findByName('admin.organizations');
      const redirectResponse = await home.definition.action(
        {
          linkTo: (name: string, params: IParameters = {}) => router.findByName(name).composeURL(params),
          routePartOf: () => false,
        },
        {},
      );

      expect(redirectResponse.redirect).toEqual(orgs.definition.path);
    });

    it('should add a meta tag for origin', async () => {
      nockAccounts.get('/users/uaa-user-123/documents').reply(200, '[]');

      nockCF
        .get('/v2/organizations')
        .reply(200, JSON.stringify(wrapResources(defaultOrg())))

        .get(`/v2/quota_definitions/${billableOrgQuotaGUID}`)
        .reply(200, JSON.stringify(billableOrgQuota()));

      nockUAA.get('/token_keys').reply(200, { keys: [{ value: tokenKey }] });

      const orgs = router.findByName('admin.organizations');
      response = await agent.get(orgs.definition.path);

      expect(response.status).toEqual(200);
      expect(response.text).toMatch('<meta name="x-user-identity-origin" content="uaa" />');
    });
  });

  describe('when authenticated as a platform admin', () => {
    let response: request.Response;
    let agent: SuperTest<Test>;

    const app = init(config);
    const time = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        exp: time + 24 * 60 * 60,
        origin: 'uaa',
        scope: [CLOUD_CONTROLLER_ADMIN],
        user_id: 'uaa-user-123',
      },
      tokenKey,
    );

    beforeEach(async () => {
      nockUAA.post('/oauth/token').reply(200, {
        access_token: token,
        expires_in: 24 * 60 * 60,
        jti: '__jti__',
        refresh_token: '__refresh_token__',
        scope: `openid oauth.approvals ${CLOUD_CONTROLLER_ADMIN}`,
        token_type: 'bearer',
      });

      agent = request.agent(app);
      response = await agent.get(
        '/auth/login/callback?code=__fakecode__&state=__fakestate__',
      );

      response.header['set-cookie'][0]
        .split(',')
        .map((item: string) => item.split(';')[0])
        .forEach((cookie: string) => agent.jar.setCookie(cookie));
    });

    it('should authenticate successfully', () => {
      expect(response.status).toEqual(302);
      expect(response.header['set-cookie'][0]).toContain('pazmin-session');
    });

    describe('visiting the organisations page', () => {
      beforeEach(async () => {
        nockAccounts.get('/users/uaa-user-123/documents').reply(200, '[]');

        nockCF
          .get('/v2/organizations')
          .reply(200, JSON.stringify(wrapResources(defaultOrg())))

          .get(`/v2/quota_definitions/${billableOrgQuotaGUID}`)
          .reply(200, JSON.stringify(billableOrgQuota()));

        nockUAA.get('/token_keys').reply(200, { keys: [{ value: tokenKey }] });

        response = await agent.get(
          router.findByName('admin.organizations').composeURL(),
        );
      });

      it('should show a link to the platform admin page', () => {
        expect(response.status).toEqual(200);
        expect(response.text).toMatch(/Admin/);
      });
    });
  });

  describe('when token expires', () => {
    const app = init(config);
    const agent = request.agent(app);
    const time = Math.floor(Date.now() / 1000);
    const token = jwt.sign(
      {
        exp: time - 24 * 60 * 60,
        scope: [],
        user_id: 'uaa-user-123',
      },
      tokenKey,
    );

    it('should authenticate successfully', async () => {
      nockUAA.post('/oauth/token').reply(200, {
        access_token: token, // eslint-disable-line camelcase
        expires_in: 24 * 60 * 60, // eslint-disable-line camelcase
        jti: '__jti__',
        refresh_token: '__refresh_token__', // eslint-disable-line camelcase
        scope: 'openid oauth.approvals',
        token_type: 'bearer', // eslint-disable-line camelcase
      });

      const response = await agent.get(
        '/auth/login/callback?code=__fakecode__&state=__fakestate__',
      );

      expect(response.status).toEqual(302);
      expect(response.header['set-cookie'][0]).toContain('pazmin-session');
    });

    it('should be redirected to login due to expired token', async () => {
      const response = await agent.get(
        router.findByName('admin.organizations').composeURL(),
      );

      expect(response.status).toEqual(302);
    });
  });

  describe('support pages', () => {
    it('should be able to access support page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/find-out-more page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/find-out-more');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/contact-us page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/contact-us');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/something-wrong-with-service page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/something-wrong-with-service');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/help-using-paas page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/help-using-paas');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/sign-up page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/sign-up');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/request-an-account page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/request-an-account');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/existing-organisation page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/existing-organisation');
      expect(response.status).toEqual(200);
    });

    it('should be able to access /support/existing-organisation page without login', async () => {
      const app = init(config);
      const response = await request(app).get('/support/existing-organisation');
      expect(response.status).toEqual(200);
    });
  });
});
