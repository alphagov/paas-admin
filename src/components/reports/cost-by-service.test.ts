import moment from 'moment';
import nock from 'nock';
import {createTestContext} from '../app/app.test-helpers';

import {v3Org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapV3Resources} from '../../lib/cf/test-data/wrap-resources';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import * as reports from '../reports';

describe('html cost report by service test suite', () => {

  // tslint:disable:max-line-length
  nock(config.cloudFoundryAPI)
    .get('/v3/organizations')
    .times(5)
    .reply(200, JSON.stringify(wrapV3Resources(defaultOrg())));

  const ctx: IContext = createTestContext();

  it('should show empty report for zero billables', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const period     = moment(rangeStart).format('MMMM YYYY');

    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, '[]')
    ;

    nock(config.cloudFoundryAPI)
      .get('/v2/spaces')
      .query(true)
      .reply(200, '[]')
    ;

    const response = await reports.viewCostByServiceReport(ctx, {rangeStart});

    expect(response.body)
      .toContain(`Billables by service for ${period}`);

    expect(response.body)
      .toContain(`Billables by organisation and service for ${period}`);
  });

  it('should group billable events by org and service', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');

    const defaultPriceDetails = {
      name: 'instance',
      start: '2018-04-20T14:36:09+00:00',
      stop: '2018-04-20T14:45:46+00:00',
      plan_name: 'default-plan-name',
      ex_vat: 0,
      inc_vat: 0,
      vat_rate: '0.2',
      vat_code: 'default-vat-code',
      currency_code: 'default-currency-code',
    };
    const defaultPrice = {
      ex_vat: 0,
      inc_vat: 0,
      details: [
        defaultPriceDetails,
      ],
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
        {...defaultBillableEvent, price: {...defaultPrice, inc_vat: '1', details: [{...defaultPriceDetails, plan_name: 'task'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, inc_vat: '10', details: [{...defaultPriceDetails, plan_name: 'staging'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, inc_vat: '100', details: [{...defaultPriceDetails, plan_name: 'app'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, inc_vat: '1000', details: [{...defaultPriceDetails, plan_name: 'postgres'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, inc_vat: '10000', details: []}},
        {...defaultBillableEvent, org_guid: 'some-unknown-org', price: {...defaultPrice, inc_vat: '100000', details: []}},
      ]));
    nock(config.cloudFoundryAPI)
      .get('/v2/spaces')
      .reply(200, `{"total_results": 1, "total_pages": 1, "prev_url": null, "next_url": null, "resources": [{"metadata": {"guid": "default-space-guid"}, "entity": {"name": "default-space-name"}}]}`);

    const response = await reports.viewCostByServiceReport(ctx, {rangeStart});
    const reponseBody = (response.body || '').toString();
    expect(reponseBody).toMatch(/compute(.*\n){3}.*£111.00/);
    expect(reponseBody).toMatch(/the-system_domain-org-name(.*\n){3}.*compute(.*\n){3}.*£111.00/);
    expect(reponseBody).toMatch(/the-system_domain-org-name(.*\n){3}.*postgres(.*\n){3}.*£1000.00/);
    expect(reponseBody).toMatch(/the-system_domain-org-name(.*\n){3}.*unknown(.*\n){3}.*£10000.00/);
    expect(reponseBody).toMatch(/unknown(.*\n){3}.*unknown(.*\n){3}.*£100000.00/);
  });

});

describe('cost report grouping functions', () => {
  const defaultPriceDetails: IPriceComponent = {
    name: '',
    planName: '',
    start: new Date(),
    stop: new Date(),
    VATCode: '',
    VATRate: 0,
    currencyCode: '',
    exVAT: 0,
    incVAT: 0,
  };
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

  describe('getBillableEventsByService', () => {
    it('should work with zero events', () => {
      const result = reports.getBillableEventsByService([]);
      expect(result).toHaveLength(0);
    });

    it('should treat an event with no details as an unknown services', () => {
      const result = reports.getBillableEventsByService([{...defaultBillableEvent, price: {...defaultPrice, details: []}}]);
      expect(result).toHaveLength(1);
      expect(result[0].serviceGroup).toBe('unknown');
    });

    it('should sum costs for services of the same group', () => {
      const result = reports.getBillableEventsByService([
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 1, details: [{...defaultPriceDetails, planName: 'postgres tiny'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 10, details: [{...defaultPriceDetails, planName: 'postgres medium'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 100, details: [{...defaultPriceDetails, planName: 'postgres leviathan'}]}},
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].serviceGroup).toBe('postgres');
      expect(result[0].incVAT).toBe(111);
    });

    it('should sum costs for compute services', () => {
      const result = reports.getBillableEventsByService([
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 1, details: [{...defaultPriceDetails, planName: 'app'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 10, details: [{...defaultPriceDetails, planName: 'staging'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 100, details: [{...defaultPriceDetails, planName: 'task'}]}},
      ]);
      expect(result).toHaveLength(1);
      expect(result[0].serviceGroup).toBe('compute');
      expect(result[0].incVAT).toBe(111);
    });

    it('should group and sum costs for different services and sort by highest cost first', () => {
      const result = reports.getBillableEventsByService([
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 1, details: [{...defaultPriceDetails, planName: 'postgres tiny'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 10, details: [{...defaultPriceDetails, planName: 'postgres medium'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 100, details: [{...defaultPriceDetails, planName: 'postgres leviathan'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 1000, details: [{...defaultPriceDetails, planName: 'app'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 10000, details: [{...defaultPriceDetails, planName: 'staging'}]}},
        {...defaultBillableEvent, price: {...defaultPrice, incVAT: 100000, details: [{...defaultPriceDetails, planName: 'task'}]}},
      ]);
      expect(result).toHaveLength(2);
      expect(result[0].serviceGroup).toBe('compute');
      expect(result[0].incVAT).toBe(111000);
      expect(result[1].serviceGroup).toBe('postgres');
      expect(result[1].incVAT).toBe(111);
    });
  });

  describe('getBillableEventsByOrganisationAndService', () => {
    it('should work with zero events', () => {
      const result = reports.getBillableEventsByOrganisationAndService([], {});
      expect(result).toHaveLength(0);
    });

    it('should look up the organisation name by GUID', () => {
      const orgsByGUID = {'some-org-guid': [{name: 'some-org-name'} as any]};
      const result = reports.getBillableEventsByOrganisationAndService(
        [{...defaultBillableEvent, orgGUID: 'some-org-guid'}],
        orgsByGUID,
      );
      expect(result).toHaveLength(1);
      expect(result[0].orgName).toBe('some-org-name');
    });

    it('should group by organisation (sorted alphabetically), then by service (sorted by cost)', () => {
      const orgsByGUID = {
        'org-guid-one': [{name: 'org-name-one'} as any],
        'org-guid-two': [{name: 'org-name-two'} as any],
      };
      const result = reports.getBillableEventsByOrganisationAndService(
        [
          {...defaultBillableEvent, orgGUID: 'org-guid-two', price: {...defaultPrice, incVAT: 1, details: [{...defaultPriceDetails, planName: 'mysql'}]}},
          {...defaultBillableEvent, orgGUID: 'org-guid-two', price: {...defaultPrice, incVAT: 1, details: [{...defaultPriceDetails, planName: 'mysql'}]}},
          {...defaultBillableEvent, orgGUID: 'org-guid-one', price: {...defaultPrice, incVAT: 20, details: [{...defaultPriceDetails, planName: 'mysql'}]}},
          {...defaultBillableEvent, orgGUID: 'org-guid-one', price: {...defaultPrice, incVAT: 100, details: [{...defaultPriceDetails, planName: 'postgres'}]}},
        ],
        orgsByGUID,
      );
      expect(result).toHaveLength(3);
      expect(result[0].orgName).toBe('org-name-one');
      expect(result[0].serviceGroup).toBe('postgres');
      expect(result[0].incVAT).toBe(100);

      expect(result[1].orgName).toBe('org-name-one');
      expect(result[1].serviceGroup).toBe('mysql');
      expect(result[1].incVAT).toBe(20);

      expect(result[2].orgName).toBe('org-name-two');
      expect(result[2].serviceGroup).toBe('mysql');
      expect(result[2].incVAT).toBe(1 + 1);
    });
  });

  describe('getBillableEventsByOrganisationAndSpaceAndService', () => {
    it('should work with zero events', () => {
      const result = reports.getBillableEventsByOrganisationAndSpaceAndService([], {}, {});
      expect(result).toHaveLength(0);
    });

    it('should look up the organisation and space names by GUID', () => {
      const orgsByGUID = {'some-org-guid': [{name: 'some-org-name'} as any]};
      const spacesByGUID = {'some-space-guid': [{entity: {name: 'some-space-name'}} as any]};
      const result = reports.getBillableEventsByOrganisationAndSpaceAndService(
        [
          {...defaultBillableEvent, orgGUID: 'some-org-guid', spaceGUID: 'some-space-guid'},
          {...defaultBillableEvent, orgGUID: 'some-org-guid', spaceGUID: 'some-space-guid-that-doesnt-exist'},
        ],
        orgsByGUID,
        spacesByGUID,
      );
      expect(result).toHaveLength(2);
      expect(result[0].orgName).toBe('some-org-name');
      expect(result[0].spaceName).toBe('some-space-name');
      expect(result[1].orgName).toBe('some-org-name');
      expect(result[1].spaceName).toBe('unknown');
    });

    it('should group by organisation (sorted alphabetically), then by space (sorted alphabetically), then by service (sorted by cost)', () => {
      const orgsByGUID = {
        'org-guid-one': [{name: 'org-name-one'} as any],
        'org-guid-two': [{name: 'org-name-two'} as any],
      };
      const spacesByGUID = {
        'space-guid-one': [{entity: {name: 'space-name-one'}} as any],
        'space-guid-two': [{entity: {name: 'space-name-two'}} as any],
      };
      const result = reports.getBillableEventsByOrganisationAndSpaceAndService(
        [
          {...defaultBillableEvent, orgGUID: 'org-guid-two', spaceGUID: 'space-guid-one', price: {...defaultPrice, incVAT: 7, details: [{...defaultPriceDetails, planName: 'mysql'}]}},
          {...defaultBillableEvent, orgGUID: 'org-guid-two', spaceGUID: 'space-guid-one', price: {...defaultPrice, incVAT: 1, details: [{...defaultPriceDetails, planName: 'mysql'}]}},
          {...defaultBillableEvent, orgGUID: 'org-guid-two', spaceGUID: 'space-guid-two', price: {...defaultPrice, incVAT: 2, details: [{...defaultPriceDetails, planName: 'mysql'}]}},
          {...defaultBillableEvent, orgGUID: 'org-guid-one', spaceGUID: 'space-guid-one', price: {...defaultPrice, incVAT: 20, details: [{...defaultPriceDetails, planName: 'mysql'}]}},
          {...defaultBillableEvent, orgGUID: 'org-guid-one', spaceGUID: 'space-guid-two', price: {...defaultPrice, incVAT: 100, details: [{...defaultPriceDetails, planName: 'postgres'}]}},
        ],
        orgsByGUID,
        spacesByGUID,
      );
      expect(result).toHaveLength(4);

      expect(result[0].orgName).toBe('org-name-one');
      expect(result[0].spaceName).toBe('space-name-one');
      expect(result[0].serviceGroup).toBe('mysql');
      expect(result[0].incVAT).toBe(20);

      expect(result[1].orgName).toBe('org-name-one');
      expect(result[1].spaceName).toBe('space-name-two');
      expect(result[1].serviceGroup).toBe('postgres');
      expect(result[1].incVAT).toBe(100);

      expect(result[2].orgName).toBe('org-name-two');
      expect(result[2].spaceName).toBe('space-name-one');
      expect(result[2].serviceGroup).toBe('mysql');
      expect(result[2].incVAT).toBe(7 + 1);

      expect(result[3].orgName).toBe('org-name-two');
      expect(result[3].spaceName).toBe('space-name-two');
      expect(result[3].serviceGroup).toBe('mysql');
      expect(result[3].incVAT).toBe(2);
    });
  });
});
