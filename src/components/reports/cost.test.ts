import jwt from 'jsonwebtoken';
import moment from 'moment';
import nock from 'nock';
import pino from 'pino';

import * as data from '../../lib/cf/cf.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';
import * as reports from '../reports';

// tslint:disable:max-line-length
nock(config.cloudFoundryAPI)
  .get('/v2/organizations')
  .times(3)
  .reply(200, data.organizations)

  .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6')
  .times(3)
  .reply(200, data.organizationQuota)
;

const tokenKey = 'secret';
const token = jwt.sign({
  user_id: 'uaa-user-123',
  scope: [],
  exp: 2535018460,
}, tokenKey);
const ctx: IContext = {
  app: config,
  routePartOf: () => false,
  linkTo: () => '__LINKED_TO__',
  log: pino({level: 'silent'}),
  token: new Token(token, [tokenKey]),
};

describe('cost report test suite', () => {
  it('should report zero for zero billables', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const period     = moment(rangeStart).format('MMMM YYYY');

    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, '[]')
    ;

    const response = await reports.viewCostReport(ctx, {rangeStart});

    expect(response.body)
      .toContain(`Billables for ${period}`);

    expect(response.body)
      .toContain(`Billables by organisation for ${period}`);

    expect(response.body)
      .toContain(`Billables by quota for ${period}`);

    expect(response.body)
      .toContain('the-system_domain-org-name'); // the org name

    expect(response.body)
      .toContain('name-1996'); // the quota

    expect((response.body || '').toString().match(/£0[.]00/g))
      .toHaveLength(6);
  });

  it('should report some billables but not attribute to org', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');

    // this test has billable events but no billable events attributable to an
    // org. expected response is to:
    // 1 billable event
    // 0 billable events for any org or quota
    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, `[{
        "event_guid": "fecc9eb5-b027-42fe-ba1f-d90a0474b620",
        "event_start": "2018-04-20T14:36:09+00:00",
        "event_stop": "2018-04-20T14:45:46+00:00",
        "resource_guid": "a585feac-32a1-44f6-92e2-cdb1377e42f4",
        "resource_name": "api-availability-test-app",
        "resource_type": "app",
        "org_guid": "7f9c0e11-e7f1-41d7-9d3f-cb9d05110f9e",
        "space_guid": "2e030634-2640-4535-88ed-e67235b52ceb",
        "plan_guid": "f4d4b95a-f55e-4593-8d54-3364c25798c4",
        "number_of_nodes": 1,
        "memory_in_mb": 64,
        "storage_in_mb": 0,
        "price": {
          "ex_vat": "0.02",
          "inc_vat": "0.024",
          "details": [
            {
              "name": "instance",
              "start": "2018-04-20T14:36:09+00:00",
              "stop": "2018-04-20T14:45:46+00:00",
              "plan_name": "app",
              "ex_vat": "0.01",
              "inc_vat": "0.012",
              "vat_rate": "0.2",
              "vat_code": "Standard",
              "currency_code": "USD",
              "currency_rate": "0.8"
            },
            {
              "name": "platform",
              "start": "2018-04-20T14:36:09+00:00",
              "stop": "2018-04-20T14:45:46+00:00",
              "plan_name": "app",
              "ex_vat": "0.01",
              "inc_vat": "0.012",
              "vat_rate": "0.2",
              "vat_code": "Standard",
              "currency_code": "USD",
              "currency_rate": "0.8"
            }
          ]
        }
      }]`)
    ;

    const response = await reports.viewCostReport(ctx, {rangeStart});

    expect((response.body || '').toString().match(/£0[.]02/g))
      .toHaveLength(2);

    expect((response.body || '').toString().match(/£0[.]00/g))
      .toHaveLength(4);
  });

  it('should report some billables and attribute to org', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');

    // this test has billable events but no billable events attributable to an
    // org. expected response is to:
    // 1 billable event
    // 1 billable events for the org and the quota
    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, `[{
        "event_guid": "fecc9eb5-b027-42fe-ba1f-d90a0474b620",
        "event_start": "2018-04-20T14:36:09+00:00",
        "event_stop": "2018-04-20T14:45:46+00:00",
        "resource_guid": "a585feac-32a1-44f6-92e2-cdb1377e42f4",
        "resource_name": "api-availability-test-app",
        "resource_type": "app",
        "org_guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20",
        "space_guid": "2e030634-2640-4535-88ed-e67235b52ceb",
        "plan_guid": "f4d4b95a-f55e-4593-8d54-3364c25798c4",
        "number_of_nodes": 1,
        "memory_in_mb": 64,
        "storage_in_mb": 0,
        "price": {
          "ex_vat": "0.02",
          "inc_vat": "0.024",
          "details": [
            {
              "name": "instance",
              "start": "2018-04-20T14:36:09+00:00",
              "stop": "2018-04-20T14:45:46+00:00",
              "plan_name": "app",
              "ex_vat": "0.01",
              "inc_vat": "0.012",
              "vat_rate": "0.2",
              "vat_code": "Standard",
              "currency_code": "USD",
              "currency_rate": "0.8"
            },
            {
              "name": "platform",
              "start": "2018-04-20T14:36:09+00:00",
              "stop": "2018-04-20T14:45:46+00:00",
              "plan_name": "app",
              "ex_vat": "0.01",
              "inc_vat": "0.012",
              "vat_rate": "0.2",
              "vat_code": "Standard",
              "currency_code": "USD",
              "currency_rate": "0.8"
            }
          ]
        }
      }]`)
    ;

    const response = await reports.viewCostReport(ctx, {rangeStart});

    expect((response.body || '').toString().match(/£0[.]02/g))
      .toHaveLength(6);
  });

  it('empty sumRecords', async () => {
    const summed = reports.sumRecords([]);
    expect(summed.incVAT).toEqual(0);
    expect(summed.exVAT).toEqual(0);
  });

  it('n sumRecords', async () => {
    const summed = reports.sumRecords([
      {
        eventGUID: '', eventStart: new Date(), eventStop: new Date(),
        resourceGUID: '', resourceName: '', resourceType: '', orgGUID: '',
        spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
        storageInMB: 0,
        price: {
          incVAT:  10,
          exVAT:   11,
          details: [],
        },
      },
      {
          eventGUID: '', eventStart: new Date(), eventStop: new Date(),
          resourceGUID: '', resourceName: '', resourceType: '', orgGUID: '',
          spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
          storageInMB: 0,
          price: {
            incVAT:  5.5,
            exVAT:   5.5,
            details: [],
          },
      },
    ]);
    expect(summed.incVAT).toEqual(15.5);
    expect(summed.exVAT).toEqual(16.5);
  });

  it('empty createOrgCostRecord', async () => {
    const records = reports.createQuotaCostRecords([]);
    expect(records).toHaveLength(0);
  });

  it('n createOrgCostRecord', async () => {
    const quotaRecords = reports.createQuotaCostRecords([
      {
        orgGUID: 'oa',
        orgName: 'oa',

        quotaGUID: 'qa',
        quotaName: 'qa',

        incVAT: 10,
        exVAT:  10,
      },
      {
        orgGUID: 'ob',
        orgName: 'ob',

        quotaGUID: 'qa',
        quotaName: 'qa',

        incVAT: 2.5,
        exVAT:  3.5,
      },
      {
        orgGUID: 'oc',
        orgName: 'oc',

        quotaGUID: 'qb',
        quotaName: 'qb',

        incVAT: 2.5,
        exVAT:  3.5,
      },
    ]);

    expect(quotaRecords).toContainEqual({
      quotaGUID: 'qa',
      quotaName: 'qa',

      incVAT: 12.5,
      exVAT:  13.5,
    });

    expect(quotaRecords).toContainEqual({
      quotaGUID: 'qb',
      quotaName: 'qb',

      incVAT: 2.5,
      exVAT:  3.5,
    });
  });

  it('zero aggregateBillingEvents', async () => {
    const events = reports.aggregateBillingEvents([]);
    expect(events).toEqual({});
  });

  it('n aggregateBillingEvents', async () => {
    const a1 = {
      eventGUID: '', eventStart: new Date(), eventStop: new Date(),
      resourceGUID: '', resourceName: '', resourceType: '', orgGUID: 'a',
      spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
      storageInMB: 0,
      price: {
        incVAT:  1,
        exVAT:   2,
        details: [],
      },
    };
    const a2 = {
      eventGUID: '', eventStart: new Date(), eventStop: new Date(),
      resourceGUID: '', resourceName: '', resourceType: '', orgGUID: 'a',
      spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
      storageInMB: 0,
      price: {
        incVAT:  1,
        exVAT:   2,
        details: [],
      },
    };
    const b1 = {
      eventGUID: '', eventStart: new Date(), eventStop: new Date(),
      resourceGUID: '', resourceName: '', resourceType: '', orgGUID: 'b',
      spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
      storageInMB: 0,
      price: {
        incVAT:  1,
        exVAT:   2,
        details: [],
      },
    };

    const events = reports.aggregateBillingEvents([a1, a2, b1]);
    expect(Object.keys(events)).toContain('a');
    expect(Object.keys(events)).toContain('b');

    expect(events.a).toHaveLength(2);
    expect(events.b).toHaveLength(1);
  });

  it('zero createOrgCostRecords', async () => {
    const records = reports.createOrgCostRecords([], {}, {});
    expect(records).toEqual([]);
  });

  it('orgs but no billable events createOrgCostRecords', async () => {
    const records = reports.createOrgCostRecords(
      [
        {
          entity: {
            app_events_url: '', auditors_url: '', billing_enabled: true,
            billing_managers_url: '', domains_url: '', managers_url: '',
            private_domains_url: '', quota_definition_url: '', users_url: '',
            space_quota_definitions_url: '', spaces_url: '', status: '',
            quota_definition_guid: 'quota-a',
            name: 'Org a',
          },
          metadata: {
            url: '', created_at: '', updated_at: '',
            guid: 'org-a',
          },
        },
      ],
      {
        'org-a': {
          entity: {
            app_instance_limit: 0, app_task_limit: 0, instance_memory_limit: 0,
            memory_limit: 0, name: 'Quota a', non_basic_services_allowed: true,
            total_private_domains: 0, total_reserved_route_ports: 0,
            total_routes: 0, total_service_keys: 0, total_services: 0,
            trial_db_allowed: true,
          },
          metadata: {
            url: '', created_at: '', updated_at: '',
            guid: 'quota-a',
          },
        },
      },
      {
        'quota-a': [],
      },
    );

    expect(records).toContainEqual({
      orgGUID: 'org-a',
      orgName: 'Org a',

      quotaGUID: 'quota-a',
      quotaName: 'Quota a',

      incVAT: 0,
      exVAT:  0,
    });
  });

  it('orgs and some billable events createOrgCostRecords', async () => {
    const records = reports.createOrgCostRecords(
      [
        {
          entity: {
            app_events_url: '', auditors_url: '', billing_enabled: true,
            billing_managers_url: '', domains_url: '', managers_url: '',
            private_domains_url: '', quota_definition_url: '', users_url: '',
            space_quota_definitions_url: '', spaces_url: '', status: '',
            quota_definition_guid: 'quota-a',
            name: 'Org a',
          },
          metadata: {
            url: '', created_at: '', updated_at: '',
            guid: 'org-a',
          },
        },
        {
          entity: {
            app_events_url: '', auditors_url: '', billing_enabled: true,
            billing_managers_url: '', domains_url: '', managers_url: '',
            private_domains_url: '', quota_definition_url: '', users_url: '',
            space_quota_definitions_url: '', spaces_url: '', status: '',
            quota_definition_guid: 'quota-a',
            name: 'Org b',
          },
          metadata: {
            url: '', created_at: '', updated_at: '',
            guid: 'org-b',
          },
        },
      ],
      {
        'org-a': {
          entity: {
            app_instance_limit: 0, app_task_limit: 0, instance_memory_limit: 0,
            memory_limit: 0, name: 'Quota a', non_basic_services_allowed: true,
            total_private_domains: 0, total_reserved_route_ports: 0,
            total_routes: 0, total_service_keys: 0, total_services: 0,
            trial_db_allowed: true,
          },
          metadata: {
            url: '', created_at: '', updated_at: '',
            guid: 'quota-a',
          },
        },
        'org-b': {
          entity: {
            app_instance_limit: 0, app_task_limit: 0, instance_memory_limit: 0,
            memory_limit: 0, name: 'Quota a', non_basic_services_allowed: true,
            total_private_domains: 0, total_reserved_route_ports: 0,
            total_routes: 0, total_service_keys: 0, total_services: 0,
            trial_db_allowed: true,
          },
          metadata: {
            url: '', created_at: '', updated_at: '',
            guid: 'quota-a',
          },
        },
      },
      {
        'org-a': [
          {
            eventGUID: '', eventStart: new Date(), eventStop: new Date(),
            resourceGUID: '', resourceName: '', resourceType: '', orgGUID: 'b',
            spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
            storageInMB: 0,
            price: {
              incVAT:  1,
              exVAT:   2,
              details: [],
            },
          },
          {
            eventGUID: '', eventStart: new Date(), eventStop: new Date(),
            resourceGUID: '', resourceName: '', resourceType: '', orgGUID: 'b',
            spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
            storageInMB: 0,
            price: {
              incVAT:  1.5,
              exVAT:   2.5,
              details: [],
            },
          },
        ],
        'org-b': [
          {
            eventGUID: '', eventStart: new Date(), eventStop: new Date(),
            resourceGUID: '', resourceName: '', resourceType: '', orgGUID: 'b',
            spaceGUID: '', spaceName: '', planGUID: '', numberOfNodes: 0, memoryInMB: 0,
            storageInMB: 0,
            price: {
              incVAT:  1,
              exVAT:   2.5,
              details: [],
            },
          },
        ],
      },
    );

    expect(records).toContainEqual({
      orgGUID: 'org-a',
      orgName: 'Org a',

      quotaGUID: 'quota-a',
      quotaName: 'Quota a',

      incVAT: 2.5,
      exVAT:  4.5,
    });

    expect(records).toContainEqual({
      orgGUID: 'org-b',
      orgName: 'Org b',

      quotaGUID: 'quota-a',
      quotaName: 'Quota a',

      incVAT: 1,
      exVAT:  2.5,
    });
  });
});
