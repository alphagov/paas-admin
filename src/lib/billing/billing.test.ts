import nock from 'nock';
import { test } from 'tap';

import { config } from '../../app/app.test';

import { BillingClient } from '.';

test('should return billable events', async t => {
  nock(config.billingAPI)
    .get('/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=3deb9f04-b449-4f94-b3dd-c73cefe5b275')
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
    }]`);

  const bc = new BillingClient({
    apiEndpoint: config.billingAPI,
    accessToken: '__ACCESS_TOKEN__',
  });
  const response = await bc.getBillableEvents({
    rangeStart: '2018-01-01',
    rangeStop: '2018-01-02',
    orgGUIDs: ['3deb9f04-b449-4f94-b3dd-c73cefe5b275'],
  });

  t.equal(response.length, 1);
  t.equal(response[0].price.exVAT, 0.02);
});

test('should throw an error when API response with 500', async t => {
  nock(config.billingAPI)
    .get('/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-500')
    .reply(500, `{"message":"NOT OK"}`);

  const bc = new BillingClient({
    apiEndpoint: config.billingAPI,
    accessToken: '__ACCESS_TOKEN__',
  });

  return t.rejects(bc.getBillableEvents({
    rangeStart: '2018-01-01',
    rangeStop: '2018-01-02',
    orgGUIDs: ['org-guid-500'],
  }), /failed with status 500/);
});

test('should throw an error when API response with 500 and no data', async t => {
  nock(config.billingAPI)
    .get('/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-500-no-data').reply(500);

  const bc = new BillingClient({
    apiEndpoint: config.billingAPI,
    accessToken: '__ACCESS_TOKEN__',
  });

  return t.rejects(bc.getBillableEvents({
    rangeStart: '2018-01-01',
    rangeStop: '2018-01-02',
    orgGUIDs: ['org-guid-500-no-data'],
  }), /failed with status 500/);
});

test('should throw an error when API response contains invalid price', async t => {
  nock(config.billingAPI)
    .get('/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-bad-price')
    .reply(200, `[{
      "event_start": "2018-04-20T14:36:09+00:00",
      "event_stop": "2018-04-20T14:45:46+00:00",
      "price": {
        "ex_vat": "not-a-number",
        "inc_vat": "1.0",
        "details": []
      }
    }]`);

  const bc = new BillingClient({
    apiEndpoint: config.billingAPI,
    accessToken: '__ACCESS_TOKEN__',
  });

  return t.rejects(bc.getBillableEvents({
    rangeStart: '2018-01-01',
    rangeStop: '2018-01-02',
    orgGUIDs: ['org-guid-bad-price'],
  }), /failed to parse 'not-a-number' as a number/);
});

test('should throw an error when API response contains start_date', async t => {
  nock(config.billingAPI)
    .get('/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-invalid-date')
    .reply(200, `[{
      "event_start": "14:36 20-04-2018",
      "event_stop": "2018-04-20T14:45:46+00:00",
      "price": {
        "ex_vat": "0.02",
        "inc_vat": "0.024",
        "details": []
      }
    }]`);

  const bc = new BillingClient({
    apiEndpoint: config.billingAPI,
    accessToken: '__ACCESS_TOKEN__',
  });

  return t.rejects(bc.getBillableEvents({
    rangeStart: '2018-01-01',
    rangeStop: '2018-01-02',
    orgGUIDs: ['org-guid-invalid-date'],
  }), /invalid date format: 14:36 20-04-2018/);
});
