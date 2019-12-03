// tslint:disable-next-line:no-submodule-imports
import parse from 'csv-parse/lib/sync';
import moment from 'moment';
import nock from 'nock';
import {createTestContext} from '../app/app.test-helpers';

import {v3Org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapV3Resources} from '../../lib/cf/test-data/wrap-resources';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import * as reports from '../reports';

describe('csv organisation monthly spend report for the pmo team', () => {
  const ctx: IContext = createTestContext();
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();
    nockCF = nock(ctx.app.cloudFoundryAPI);
    nockCF
      .get(`/v2/quota_definitions?q=name:default`)
      .reply(200, `{"resources": [
        {"metadata": {"guid": "default-quota"}, "entity": {"name": "default"}}
      ]}`);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should return a one-line CSV when there are no organisations', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');

    nockCF.get('/v3/organizations')
      .times(5)
      .reply(200, JSON.stringify(wrapV3Resources()));
    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, '[]');

    const response = await reports.viewPmoOrgSpendReportCSV(ctx, {rangeStart});
    expect(response.download).not.toBeUndefined();
    expect(response.download!.data)
      .toEqual(`Billing month,Org,Region,Unique ID,Spend in GBP without VAT\n`);
  });

  it('should name the CSV appropriately', async () => {
    nockCF.get('/v3/organizations')
      .times(5)
      .reply(200, JSON.stringify(wrapV3Resources(defaultOrg())));
    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, '[]');

    const response = await reports.viewPmoOrgSpendReportCSV(ctx, {rangeStart: '2018-01-01'});
    expect(response.download).not.toBeUndefined();
    expect(response.download!.name)
      .toEqual('paas-pmo-org-spend-ireland-2018-01.csv');
  });

  it('should apply the 10% admin fee', async () => {
    const rangeStart = moment().startOf('month');

    const defaultPriceDetails = {
      name: 'instance',
      start: '2018-04-20T14:36:09+00:00',
      stop: '2018-04-20T14:45:46+00:00',
      plan_name: 'default-plan-name',
      ex_vat: 0,
      inc_vat: 0,
      vat_rate: 10,
    };
    const defaultPrice = {
      ex_vat: 0,
      inc_vat: 0,
      details: [defaultPriceDetails],
    };
    const defaultBillableEvent = {
      event_guid: 'default-event-guid',
      event_start: '2018-04-20T14:36:09+00:00',
      event_stop: '2018-04-20T14:45:46+00:00',
      resource_guid: 'default-resource-guid',
      resource_name: 'default-resource-name',
      resource_type: 'app',
      org_guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      space_guid: 'default-space-guid',
      plan_guid: 'default-plan-guid',
      quota_definition_guid: 'default-quota-definition-guid',
      number_of_nodes: 1,
      memory_in_mb: 64,
      storage_in_mb: 0,
      price: defaultPrice,
    };
    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .times(2)
      .reply(200, JSON.stringify([
        {...defaultBillableEvent, org_guid: 'org-one', price: {...defaultPrice, ex_vat: '1'}},
      ]));
    nockCF
      .get('/v3/organizations')
      .reply(200, wrapV3Resources(
        {...defaultOrg(), guid: 'org-one', name: 'Org One'},
      ));

    const response = await reports.viewPmoOrgSpendReportCSV(ctx, {rangeStart: rangeStart.format('YYYY-MM-DD')});
    expect(response.download).not.toBeUndefined();
    const records = parse(response.download!.data, {columns: true});
    expect(records.length).toEqual(1);
    expect(records).toContainEqual({
      'Billing month': rangeStart.format('MMMM YYYY'),
      'Org': 'Org One',
      'Region': 'Ireland',
      'Unique ID': 'org-one',
      'Spend in GBP without VAT': '1.10',
    });
  });

  it('should group billable events by org', async () => {
    const rangeStart = moment().startOf('month');

    const defaultPriceDetails = {
      name: 'instance',
      start: '2018-04-20T14:36:09+00:00',
      stop: '2018-04-20T14:45:46+00:00',
      plan_name: 'default-plan-name',
      ex_vat: 0,
      inc_vat: 0,
      vat_rate: 10,
    };
    const defaultPrice = {
      ex_vat: 0,
      inc_vat: 0,
      details: [defaultPriceDetails],
    };
    const defaultBillableEvent = {
      event_guid: 'default-event-guid',
      event_start: '2018-04-20T14:36:09+00:00',
      event_stop: '2018-04-20T14:45:46+00:00',
      resource_guid: 'default-resource-guid',
      resource_name: 'default-resource-name',
      resource_type: 'app',
      org_guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      space_guid: 'default-space-guid',
      plan_guid: 'default-plan-guid',
      quota_definition_guid: 'default-quota-definition-guid',
      number_of_nodes: 1,
      memory_in_mb: 64,
      storage_in_mb: 0,
      price: defaultPrice,
    };
    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .times(2)
      .reply(200, JSON.stringify([
        {...defaultBillableEvent, org_guid: 'org-one', price: {...defaultPrice, ex_vat: '1'}},
        {...defaultBillableEvent, org_guid: 'org-two', price: {...defaultPrice, ex_vat: '10'}},
        {...defaultBillableEvent, org_guid: 'org-one', price: {...defaultPrice, ex_vat: '100'}},
        {...defaultBillableEvent, org_guid: 'org-one', price: {...defaultPrice, ex_vat: '1000'}},
        {...defaultBillableEvent, org_guid: 'org-two', price: {...defaultPrice, ex_vat: '10000'}},
      ]));
    nockCF
      .get('/v3/organizations')
      .reply(200, wrapV3Resources(
        {...defaultOrg(), guid: 'org-one', name: 'Org One'},
        {...defaultOrg(), guid: 'org-two', name: 'Org Two'},
      ));

    const response = await reports.viewPmoOrgSpendReportCSV(ctx, {rangeStart: rangeStart.format('YYYY-MM-DD')});
    expect(response.download).not.toBeUndefined();
    const records = parse(response.download!.data, {columns: true});
    expect(records.length).toEqual(2);
    expect(records).toContainEqual({
      'Billing month': rangeStart.format('MMMM YYYY'),
      'Org': 'Org One',
      'Region': 'Ireland',
      'Unique ID': 'org-one',
      'Spend in GBP without VAT': '1211.10',
    });
    expect(records).toContainEqual({
      'Billing month': rangeStart.format('MMMM YYYY'),
      'Org': 'Org Two',
      'Region': 'Ireland',
      'Unique ID': 'org-two',
      'Spend in GBP without VAT': '11011.00',
    });
  });

  it('should list billable orgs which have no billable events', async () => {
    const rangeStart = moment().startOf('month');

    nockCF.get('/v3/organizations')
      .times(5)
      .reply(200, JSON.stringify(wrapV3Resources(
        {...defaultOrg(), guid: 'org-with-nothing-billed', name: 'Org With Nothing Billed'},
       )));
    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, '[]');

    const response = await reports.viewPmoOrgSpendReportCSV(ctx, {
      rangeStart: rangeStart.format('YYYY-MM-DD'),
    });
    expect(response.download).not.toBeUndefined();
    const records = parse(response.download!.data, {columns: true});
    expect(records.length).toEqual(1);
    expect(records[0]).toEqual({
      'Billing month': rangeStart.format('MMMM YYYY'),
      'Org': 'Org With Nothing Billed',
      'Region': 'Ireland',
      'Unique ID': 'org-with-nothing-billed',
      'Spend in GBP without VAT': '0.00',
    });
  });
});

describe('cost report grouping functions', () => {
  const defaultPrice = { incVAT: 0, exVAT: 0, details: [] };
  const defaultBillableEvent = {
    price: defaultPrice,
    eventGUID: '',
    eventStart: new Date(),
    eventStop: new Date(),
    resourceGUID: '',
    resourceName: '',
    resourceType: '',
    orgGUID: '',
    spaceGUID: '',
    spaceName: '',
    planGUID: '',
    numberOfNodes: 0,
    memoryInMB: 0,
    storageInMB: 0,
  };

  describe('getBillablesByOrganisation', () => {
    it('should work with zero orgs and events', () => {
      const results = reports.getBillablesByOrganisation([], []);
      expect(results).toHaveLength(0);
    });

    it('should work with zero events', () => {
      const results = reports.getBillablesByOrganisation([defaultOrg()], []);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        org:   defaultOrg(),
        exVAT: 0,
      });
    });

    it('should sum costs for services of the same organisation', () => {
      const results = reports.getBillablesByOrganisation([
        {...defaultOrg(), guid: 'org-one', name: 'Org One'},
      ], [
        {...defaultBillableEvent, orgGUID: 'org-one', price: {...defaultPrice, exVAT: 1}},
        {...defaultBillableEvent, orgGUID: 'org-one', price: {...defaultPrice, exVAT: 10}},
      ]);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        org:   {...defaultOrg(), guid: 'org-one', name: 'Org One'},
        exVAT: 11,
      });
    });

    it('should not sum costs for different organisations', () => {
      const results = reports.getBillablesByOrganisation([
        {...defaultOrg(), guid: 'org-one', name: 'Org One'},
        {...defaultOrg(), guid: 'org-two', name: 'Org Two'},
      ], [
        {...defaultBillableEvent, orgGUID: 'org-one', price: {...defaultPrice, exVAT: 5}},
        {...defaultBillableEvent, orgGUID: 'org-two', price: {...defaultPrice, exVAT: 7}},
      ]);
      expect(results).toHaveLength(2);
      expect(results).toContainEqual({
        org:   {...defaultOrg(), guid: 'org-one', name: 'Org One'},
        exVAT: 5,
      });
      expect(results).toContainEqual({
        org:   {...defaultOrg(), guid: 'org-two', name: 'Org Two'},
        exVAT: 7,
      });
    });
  });

  it('filterRealOrgs should filter out tests and admin', () => {
    const orgs = [
      {...defaultOrg(), name: 'govuk-doggos' },
      {...defaultOrg(), name: 'admin' },
      {...defaultOrg(), name: 'ACC-123' },
      {...defaultOrg(), name: 'BACC-123' },
      {...defaultOrg(), name: 'CATS-123' },
      {...defaultOrg(), name: 'department-for-coffee' },
      {...defaultOrg(), name: 'SMOKE-' },
    ];

    const filteredOrgs = reports.filterRealOrgs(orgs);

    expect(filteredOrgs.length).toEqual(2);
    expect(filteredOrgs[0].name).toEqual('govuk-doggos');
    expect(filteredOrgs[1].name).toEqual('department-for-coffee');
  });

  it('filterBillableOrgs should filter out trial orgs', () => {
    const trialGUID = 'trial-guid';
    const paidGUID = 'expensive-guid';

    const orgs = [
      {
        ...defaultOrg(),
        relationships: {quota: {data: { guid: trialGUID }}},
        name:          '1-trial-org',
      },
      {
        ...defaultOrg(),
        relationships: {quota: {data: { guid: paidGUID }}},
        name:          '1-paid-org',
      },
      {
        ...defaultOrg(),
        relationships: {quota: {data: { guid: trialGUID }}},
        name:          '2-trial-org',
      },
      {
        ...defaultOrg(),
        relationships: {quota: {data: { guid: paidGUID }}},
        name:          '2-paid-org',
      },
    ];

    const billableOrgs = reports.filterBillableOrgs(trialGUID, orgs);

    expect(billableOrgs.length).toEqual(2);
    expect(billableOrgs).toContainEqual(orgs[1]);
    expect(billableOrgs).toContainEqual(orgs[3]);
  });
});
