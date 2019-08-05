import jwt from 'jsonwebtoken';
import lodash from 'lodash';
import moment from 'moment';
import nock from 'nock';

import * as cf from '../../lib/cf/cf.test.data';
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
    const baseOrg = cf.organization;

    const anOrg = (name: string) => lodash.merge(
      JSON.parse(baseOrg), { entity: { name } },
    );

    const orgs = [
        anOrg('govuk-doggos'), anOrg('admin'), anOrg('ACC-123'),
        anOrg('BACC-123'), anOrg('CATS-123'), anOrg('department-for-coffee'),
        anOrg('SMOKE-'),
    ];

    const filteredOrgs = t.filterRealOrgs(orgs);

    expect(filteredOrgs.length).toEqual(2);
    expect(filteredOrgs[0].entity.name).toEqual('govuk-doggos');
    expect(filteredOrgs[1].entity.name).toEqual('department-for-coffee');
  });

  it('filterTrialOrgs should filter out billable orgs and sort asc', () => {
    const baseOrg = cf.organization;

    const anOrg = (name: string, quotaGUID: string, d: Date) => lodash.merge(
      JSON.parse(baseOrg), {
        entity: { name , quota_definition_guid: quotaGUID },
        metadata: { created_at: d },
      },
    );

    const trialGUID = 'trial-guid';
    const paidGUID = 'expensive-guid';

    const orgs = [
        anOrg('1-trial-org', trialGUID, moment().toDate()),
        anOrg('1-paid-org', paidGUID, moment().toDate()),
        anOrg('2-trial-org', trialGUID, moment().subtract(1, 'days').toDate()),
        anOrg('2-paid-org', paidGUID, moment().subtract(1, 'days').toDate()),
    ];

    const trialOrgs = t.filterTrialOrgs(trialGUID, orgs);

    expect(trialOrgs.length).toEqual(2);
    expect(trialOrgs[0].entity.name).toEqual('2-trial-org');
    expect(trialOrgs[1].entity.name).toEqual('1-trial-org');
  });

  it('filterBillabeOrgs should filter out trial orgs and sort desc', () => {
    const baseOrg = cf.organization;

    const anOrg = (name: string, quotaGUID: string, d: Date) => lodash.merge(
      JSON.parse(baseOrg), {
        entity: { name , quota_definition_guid: quotaGUID },
        metadata: { created_at: d },
      },
    );

    const trialGUID = 'trial-guid';
    const paidGUID = 'expensive-guid';

    const orgs = [
        anOrg('1-trial-org', trialGUID, moment().toDate()),
        anOrg('1-paid-org', paidGUID, moment().toDate()),
        anOrg('2-trial-org', trialGUID, moment().subtract(1, 'days').toDate()),
        anOrg('2-paid-org', paidGUID, moment().subtract(1, 'days').toDate()),
    ];

    const billableOrgs = t.filterBillableOrgs(trialGUID, orgs);

    expect(billableOrgs.length).toEqual(2);
    expect(billableOrgs[0].entity.name).toEqual('1-paid-org');
    expect(billableOrgs[1].entity.name).toEqual('2-paid-org');
  });

  it('should render the page correctly', async () => {
    const baseOrg = cf.organization;
    const baseQuota = cf.organizationQuota;

    const anOrg = (name: string, quotaGUID: string, d: Date) => lodash.merge(
      JSON.parse(baseOrg), {
        entity: { name , quota_definition_guid: quotaGUID },
        metadata: { created_at: d, guid: name },
      },
    );

    const aQuota = (name: string, quotaGUID: string) => lodash.merge(
      JSON.parse(baseQuota), {
        entity: { name },
        metadata: { guid: quotaGUID },
      },
    );

    const trialGUID = 'default';
    const cheapGUID = 'cheap-guid';
    const expensiveGUID = 'expensive-guid';

    const orgs = lodash.merge(JSON.parse(cf.organizations), { resources: [
      anOrg('current-trial-org', trialGUID, moment().toDate()),
      anOrg('expiring-trial-org', trialGUID, moment().subtract(100, 'days').toDate()),
      anOrg('cheap-org', cheapGUID, moment().subtract(365, 'days').toDate()),
      anOrg('expensive-org', expensiveGUID, moment().subtract(730, 'days').toDate()),
    ]});

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

      .get('/v2/organizations')
      .reply(200, JSON.stringify(orgs))
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
