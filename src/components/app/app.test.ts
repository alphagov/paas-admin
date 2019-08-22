import jwt from 'jsonwebtoken';
import moment from 'moment';
import nock from 'nock';
import request, {SuperTest, Test} from 'supertest';

import {anOrg, someOrgs} from '../../lib/cf/test-data/org';
import Router, { IParameters } from '../../lib/router';
import * as uaaData from '../../lib/uaa/uaa.test.data';

import init from './app';
import csp from './app.csp';
import { config } from './app.test.config';
import { IContext, initContext } from './context';
import router from './router';

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
    nockCF.done();
    nockUAA.done();

    nock.cleanAll();
  });

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

      .get(`/pricing_plans`)
      .reply(200, [])
    ;

    const app = init(config);
    const response = await request(app).get('/calculator');

    expect(response.status).toEqual(200);
  });

  it('should be able to handle 500 error when accessing pricing calculator', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

    nockBilling
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(500);

    const app = init(config);
    const response = await request(app).get('/calculator');

    expect(response.status).toEqual(500);
  });

  describe('when authenticated', () => {
    let response: request.Response;
    let agent: SuperTest<Test>;

    const app = init(config);
    const time = Math.floor(Date.now() / 1000);
    const token = jwt.sign({
      user_id: 'uaa-user-123',
      scope: [],
      exp: (time + (24 * 60 * 60)),
      origin: 'uaa',
    }, tokenKey);

    beforeEach(async () => {
      nockUAA
        .post('/oauth/token')
        .reply(200, {
          access_token: token,
          token_type: 'bearer',
          refresh_token: '__refresh_token__',
          expires_in: (24 * 60 * 60),
          scope: 'openid oauth.approvals',
          jti: '__jti__',
        })
      ;

      agent = request.agent(app);
      response = await agent.get('/auth/login/callback?code=__fakecode__&state=__fakestate__');

      response.header['set-cookie'][0]
        .split(',')
        .map((item: string) => item.split(';')[0])
        .forEach((cookie: string) => agent.jar.setCookie(cookie));
    });

    it('should authenticate successfully', async () => {
      expect(response.status).toEqual(302);
      expect(response.header['set-cookie'][0]).toContain('pazmin-session');
    });

    it('should redirect to organisations when accessed root', async () => {
      nockAccounts
        .get('/users/uaa-user-123/documents')
        .reply(200, `[]`)
      ;

      nockUAA
        .get('/token_keys')
        .reply(200, {keys: [{value: tokenKey}]})
      ;

      response = await agent.get(router.findByName('admin.home').composeURL());

      expect(response.status).toEqual(302);
      expect(response.header.location).toEqual(router.findByName('admin.organizations').composeURL());
    });

    describe('visiting the organisations page', () => {
      beforeEach(async () => {
        nockAccounts
          .get('/users/uaa-user-123/documents')
          .reply(200, `[]`)
        ;

        nockCF
          .get('/v2/organizations')
          .reply(200, someOrgs(anOrg().with({})))
        ;

        nockUAA
          .get('/token_keys')
          .reply(200, {keys: [{value: tokenKey}]})

          .get(`/Users/uaa-user-123`)
          .reply(200, uaaData.gdsUser)

          .post('/oauth/token?grant_type=client_credentials')
          .reply(200, `{"access_token": "TOKEN_FROM_ENDPOINT"}`)
        ;

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
    });

    it('missing pages should come back with a 404', async () => {
      nockAccounts
        .get('/users/uaa-user-123/documents')
        .reply(200, `[]`)
      ;

      nockUAA
        .get('/token_keys')
        .reply(200, {keys: [{value: tokenKey}]})
      ;

      response = await agent.get('/this-should-not-exists');

      expect(response.status).toEqual(404);
    });

    it('should store a session in a signed cookie', async () => {
      response = await request(app).get('/test');

      expect(response.header['set-cookie'].some(
        (x: string) => x.includes('pazmin-session.sig')))
        .toBe(true);
    });

    it('should redirect homepage to organisations', async () => {
      const home = router.find('/');
      const orgs = router.findByName('admin.organizations');
      const redirectResponse = await home.definition.action({
        routePartOf: () => false,
        linkTo: (name: string, params: IParameters = {}) => router.findByName(name).composeURL(params),
      }, {});

      expect(redirectResponse.redirect).toEqual(orgs.definition.path);
    });

    it('should add a meta tag for origin', async () => {
      nockAccounts
        .get('/users/uaa-user-123/documents')
        .reply(200, `[]`)
      ;

      nockCF
        .get('/v2/organizations')
        .reply(200, someOrgs(anOrg().with({})))
      ;

      nockUAA
        .get('/token_keys')
        .reply(200, {keys: [{value: tokenKey}]})

        .get(`/Users/uaa-user-123`)
        .reply(200, uaaData.gdsUser)

        .post('/oauth/token?grant_type=client_credentials')
        .reply(200, `{"access_token": "TOKEN_FROM_ENDPOINT"}`)
      ;

      const orgs = router.findByName('admin.organizations');
      response = await agent.get(orgs.definition.path);

      expect(response.status).toEqual(200);
      expect(response.text).toMatch('<meta name="x-user-identity-origin" content="uaa" />');
    });
  });

  describe('when token expires', () => {
    const app = init(config);
    const agent = request.agent(app);
    const time = Math.floor(Date.now() / 1000);
    const token = jwt.sign({
      user_id: 'uaa-user-123',
      scope: [],
      exp: (time - (24 * 60 * 60)),
    }, tokenKey);

    it('should authenticate successfully', async () => {
      nockUAA
        .post('/oauth/token')
        .reply(200, {
          access_token: token, // eslint-disable-line camelcase
          token_type: 'bearer', // eslint-disable-line camelcase
          refresh_token: '__refresh_token__', // eslint-disable-line camelcase
          expires_in: (24 * 60 * 60), // eslint-disable-line camelcase
          scope: 'openid oauth.approvals',
          jti: '__jti__',
        })
      ;

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
