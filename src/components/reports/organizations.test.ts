import jwt from 'jsonwebtoken';
import lodash from 'lodash';
import moment from 'moment';
import nock from 'nock';

import * as cf from '../../lib/cf/cf.test.data';
import {v3Org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapV3Resources} from '../../lib/cf/test-data/wrap-resources';
import {testable as t, viewOrganizationsReport} from './organizations';

import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';
import {Token} from '../auth';

const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {user_id: 'uaa-id-253', scope: [], origin: 'uaa', exp: (time + (24 * 60 * 60))};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = createTestContext({
  token: new Token(accessToken, [tokenKey]),
});

describe('organisations report helpers', () => {
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock(ctx.app.cloudFoundryAPI);
  });

  afterEach(() => {
    nockCF.done();

    nock.cleanAll();
  });

  it('trialExpiryDate should compute trial expiry correctly', () => {
    const creationDate = new Date('2019-08-01T16:25:59.254Z');
    const beforeExpiredDate = new Date('2019-10-29T17:25:59.254Z');
    const afterExpiredDate = new Date('2019-10-31T17:25:59.254Z');

    expect(
      t.trialExpiryDate(creationDate).getTime(),
    ).toBeGreaterThan(beforeExpiredDate.getTime());

    expect(
      t.trialExpiryDate(creationDate).getTime(),
    ).toBeLessThan(afterExpiredDate.getTime());
  });

  it('filterRealOrgs should filter out tests and admin', () => {
    const orgs = [
      lodash.merge(defaultOrg(), {name: 'govuk-doggos' }),
      lodash.merge(defaultOrg(), {name: 'admin' }),
      lodash.merge(defaultOrg(), {name: 'ACC-123' }),
      lodash.merge(defaultOrg(), {name: 'BACC-123' }),
      lodash.merge(defaultOrg(), {name: 'CATS-123' }),
      lodash.merge(defaultOrg(), {name: 'department-for-coffee' }),
      lodash.merge(defaultOrg(), {name: 'SMOKE-' }),
    ];

    const filteredOrgs = t.filterRealOrgs(orgs);

    expect(filteredOrgs.length).toEqual(2);
    expect(filteredOrgs[0].name).toEqual('govuk-doggos');
    expect(filteredOrgs[1].name).toEqual('department-for-coffee');
  });

  it('filterTrialOrgs should filter out billable orgs and sort asc', () => {
    const trialGUID = 'trial-guid';
    const paidGUID = 'expensive-guid';

    const orgs = [
      lodash.merge(defaultOrg(), {
        created_at: moment().toDate(),
        name: '1-trial-org',
        relationships: {quota: {data: { guid: trialGUID }}},
      }),
      lodash.merge(defaultOrg(), {
        created_at: moment().toDate(),
        name: '1-paid-org',
        relationships: {quota: {data: { guid: paidGUID }}},
      }),
      lodash.merge(defaultOrg(), {
        created_at: moment().subtract(1, 'days').toDate(),
        name: '2-trial-org',
        relationships: {quota: {data: { guid: trialGUID }}},
      }),
      lodash.merge(defaultOrg(), {
        created_at: moment().subtract(1, 'days').toDate(),
        name: '2-paid-org',
        relationships: {quota: {data: { guid: paidGUID }}},
      }),
    ];

    const trialOrgs = t.filterTrialOrgs(trialGUID, orgs);

    expect(trialOrgs.length).toEqual(2);
    expect(trialOrgs[0].name).toEqual('2-trial-org');
    expect(trialOrgs[1].name).toEqual('1-trial-org');
  });

  it('filterBillableOrgs should filter out trial orgs and sort desc', () => {
    const trialGUID = 'trial-guid';
    const paidGUID = 'expensive-guid';

    const orgs = [
      lodash.merge(defaultOrg(), {
        created_at: moment().toDate(),
        relationships: {quota: {data: { guid: trialGUID }}},
        name: '1-trial-org',
      }),
      lodash.merge(defaultOrg(), {
        created_at: moment().toDate(),
        relationships: {quota: {data: { guid: paidGUID }}},
        name: '1-paid-org',
      }),
      lodash.merge(defaultOrg(), {
        created_at: moment().subtract(1, 'days').toDate(),
        relationships: {quota: {data: { guid: trialGUID }}},
        name: '2-trial-org',
      }),
      lodash.merge(defaultOrg(), {
        created_at: moment().subtract(1, 'days').toDate(),
        relationships: {quota: {data: { guid: paidGUID }}},
        name: '2-paid-org',
      }),
    ];

    const billableOrgs = t.filterBillableOrgs(trialGUID, orgs);

    expect(billableOrgs.length).toEqual(2);
    expect(billableOrgs[0].name).toEqual('1-paid-org');
    expect(billableOrgs[1].name).toEqual('2-paid-org');
  });

  it('should render the page correctly', async () => {
    const baseQuota = cf.organizationQuota;
    const aQuota = (name: string, quotaGUID: string) => lodash.merge(
      JSON.parse(baseQuota), {
        entity: { name },
        metadata: { guid: quotaGUID },
      },
    );

    const trialGUID = 'default';
    const cheapGUID = 'cheap-guid';
    const expensiveGUID = 'expensive-guid';

    const orgs = [
      lodash.merge(defaultOrg(), {
        guid: 'current-trial-org', created_at: moment().toDate(),
        relationships: {quota: {data: { guid: trialGUID }}},
        name: 'current-trial-org',
      }),
      lodash.merge(defaultOrg(), {
        guid: 'expiring-trial-org',
        created_at: moment().subtract(100, 'days').toDate(),
        relationships: {quota: {data: { guid: trialGUID }}},
        name: 'expiring-trial-org',
      }),
      lodash.merge(defaultOrg(), {
        guid: 'cheap-org',
        created_at: moment().subtract(365, 'days').toDate(),
        relationships: {quota: {data: { guid: cheapGUID }}},
        name: 'cheap-org',
      }),
      lodash.merge(defaultOrg(), {
        guid: 'expensive-org',
        created_at: moment().subtract(730, 'days').toDate(),
        relationships: {quota: {data: { guid: expensiveGUID }}},
        name: 'expensive-org',
      }),
    ];

    nockCF
      .get(`/v2/quota_definitions?q=name:${trialGUID}`)
      .reply(200, JSON.stringify(lodash.merge(
        JSON.parse(cf.organizationQuotas),
        {resources: [aQuota('Trial', trialGUID)]},
      )))

      .get(`/v2/quota_definitions/${trialGUID}`)
      .reply(200, JSON.stringify(aQuota('Trial', trialGUID)))

      .get(`/v2/quota_definitions/${cheapGUID}`)
      .reply(200, JSON.stringify(aQuota('Cheap', cheapGUID)))

      .get(`/v2/quota_definitions/${expensiveGUID}`)
      .reply(200, JSON.stringify(aQuota('Expensive', expensiveGUID)))

      .get('/v3/organizations')
      .reply(200, JSON.stringify(wrapV3Resources(...orgs)))
    ;

    const response = await viewOrganizationsReport(ctx, {});

    // When trial accounts are expiring
    expect(response.body).toContain('Expired 10 days ago');
    expect(response.body).toContain('Expires in 3 months');

    // When billabe accounts were created approximately
    expect(response.body).toContain('Created a year ago');
    expect(response.body).toContain('Created 2 years ago');

    // Should show the quota names
    expect(response.body).toContain('Trial');
    expect(response.body).toContain('Cheap');
    expect(response.body).toContain('Expensive');

    // Should show the org names
    expect(response.body).toContain('current-trial-org');
    expect(response.body).toContain('expiring-trial-org');
    expect(response.body).toContain('cheap-org');
    expect(response.body).toContain('expensive-org');
  });

  it('should return an error when the default quota is not found', async () => {
    const quotaDefinitionsResponse = JSON.parse(cf.organizationQuotas);
    quotaDefinitionsResponse.resources = [];

    nockCF
      .get(`/v2/quota_definitions?q=name:default`)
      .reply(200, JSON.stringify(quotaDefinitionsResponse))
    ;

    try {
      await viewOrganizationsReport(ctx, {});
    } catch (e) {
      expect(e.message).toContain('Could not find default quota');
    }
  });
});
