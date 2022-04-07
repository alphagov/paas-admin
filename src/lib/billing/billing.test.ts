import nock from 'nock';
import pino from 'pino';

import { config } from '../../components/app/app.test.config';

import { IUsageEvent } from './types';

import { BillingClient } from '.';

describe('lib/billing test suite', () => {
  it('should return billable events', async () => {
    nock(config.billingAPI)
      .get(
        '/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      )
      .reply(
        200,
        `[{
        "event_guid": "fecc9eb5-b027-42fe-ba1f-d90a0474b620",
        "event_start": "2018-04-20T14:36:09+00:00",
        "event_stop": "2018-04-20T14:45:46+00:00",
        "resource_guid": "a585feac-32a1-44f6-92e2-cdb1377e42f4",
        "resource_name": "api-availability-test-app",
        "resource_type": "app",
        "org_guid": "7f9c0e11-e7f1-41d7-9d3f-cb9d05110f9e",
        "space_guid": "2e030634-2640-4535-88ed-e67235b52ceb",
        "plan_guid": "f4d4b95a-f55e-4593-8d54-3364c25798c4",
        "quota_definition_guid": "3f2dd80c-7dfb-4e7f-b8a9-406b0b8abfa3",
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
              "currency_code": "GBP"
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
              "currency_code": "GBP"
            }
          ]
        }
      }]`,
      );

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });
    const response = await bc.getBillableEvents({
      orgGUIDs: ['3deb9f04-b449-4f94-b3dd-c73cefe5b275'],
      rangeStart: new Date('2018-01-01'),
      rangeStop: new Date('2018-01-02'),
    });

    expect(response.length).toEqual(1);
    expect(response[0].price.exVAT).toEqual(0.02);
  });

  it('should return forecast events', async () => {
    const fakeEvents: ReadonlyArray<IUsageEvent> = [
      {
        eventGUID: '00000000-0000-0000-0000-000000000001',
        eventStart: new Date('2018-01-01'),
        eventStop: new Date('2018-01-02'),
        memoryInMB: 2048,
        numberOfNodes: 2,
        orgGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        planGUID: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
        resourceGUID: '00000000-0000-0000-0001-000000000001',
        resourceName: 'fake-app-1',
        resourceType: 'app',
        spaceGUID: '00000001-0001-0000-0000-000000000000',
        spaceName: 'spaceName',
        storageInMB: 1024,
      },
    ];

    nock(config.billingAPI)
      .filteringPath(/forecast_events.+/g, 'forecast_events')
      .get('/forecast_events')
      .reply(
        200,
        `[
          {
            "event_guid": "aa30fa3c-725d-4272-9052-c7186d4968a6",
            "event_start": "2001-01-01T00:00:00+00:00",
            "event_stop": "2001-01-01T01:00:00+00:00",
            "resource_guid": "c85e98f0-6d1b-4f45-9368-ea58263165a0",
            "resource_name": "APP1",
            "resource_type": "app",
            "org_guid": "51ba75ef-edc0-47ad-a633-a8f6e8770944",
            "space_guid": "276f4886-ac40-492d-a8cd-b2646637ba76",
            "plan_guid": "f4d4b95a-f55e-4593-8d54-3364c25798c4",
            "number_of_nodes": 1,
            "memory_in_mb": 1024,
            "storage_in_mb": 0,
            "price": {
              "inc_vat": "0.012",
              "ex_vat": "0.01",
              "details": [
                {
                  "name": "compute",
                  "plan_name": "PLAN1",
                  "start": "2001-01-01T00:00:00+00:00",
                  "stop": "2001-01-01T01:00:00+00:00",
                  "vat_rate": "0.2",
                  "vat_code": "Standard",
                  "currency_code": "GBP",
                  "inc_vat": "0.012",
                  "ex_vat": "0.01"
                }
              ]
            }
          }
        ]`,
      );

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });
    const response = await bc.getForecastEvents({
      events: fakeEvents,
      orgGUIDs: ['3deb9f04-b449-4f94-b3dd-c73cefe5b275'],
      rangeStart: new Date('2018-01-01'),
      rangeStop: new Date('2018-01-02'),
    });

    expect(response.length).toEqual(1);
    expect(response[0].price.exVAT).toEqual(0.01);
  });

  it('should return pricing plans', async () => {
    nock(config.billingAPI)
      .get('/pricing_plans?range_start=2018-01-01&range_stop=2018-01-02')
      .reply(
        200,
        `[
        {
          "name": "PLAN2",
          "plan_guid": "f4d4b95a-f55e-4593-8d54-3364c25798c4",
          "valid_from": "2002-01-01",
          "components": [
            {
              "name": "cpu-usage",
              "formula": "$number_of_nodes * 0.001 * $time_in_seconds",
              "vat_code": "Standard",
              "currency_code": "GBP"
            },
            {
              "name": "storage-usage",
              "formula": "$storage_in_mb * 0.0001 * $time_in_seconds",
              "vat_code": "Standard",
              "currency_code": "GBP"
            }
          ],
          "memory_in_mb": 264,
          "storage_in_mb": 265,
          "number_of_nodes": 2
        }
      ]`,
      );

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });
    const response = await bc.getPricingPlans({
      rangeStart: new Date('2018-01-01'),
      rangeStop: new Date('2018-01-02'),
    });

    expect(response.length).toEqual(1);
    expect(response[0].components[0].currencyCode).toEqual('GBP');
    expect(response[0].validFrom.toString()).toContain('Jan 01 2002');
  });

  it('should return currency rates', async () => {
    nock(config.billingAPI)
      .get('/currency_rates?range_start=2018-01-01&range_stop=2019-01-01')
      .reply(
        200,
        `[
        {
          "code": "GBP",
          "rate": 1.0,
          "valid_from": "2017-01-01"
        },
        {
          "code": "USD",
          "rate": 0.8,
          "valid_from": "2017-01-01"
        },
        {
          "code": "USD",
          "rate": 0.9,
          "valid_from": "2018-06-01"
        }
      ]`,
      );

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });
    const response = await bc.getCurrencyRates({
      rangeStart: new Date('2018-01-01'),
      rangeStop: new Date('2019-01-01'),
    });

    expect(response.length).toEqual(3);
    expect(response[0].code).toEqual('GBP');
    expect(response[0].rate).toEqual(1.0);
    expect(response[0].validFrom.toString()).toContain('Jan 01 2017');
    expect(response[1].code).toEqual('USD');
    expect(response[1].rate).toEqual(0.8);
    expect(response[1].validFrom.toString()).toContain('Jan 01 2017');
    expect(response[2].code).toEqual('USD');
    expect(response[2].rate).toEqual(0.9);
    expect(response[2].validFrom.toString()).toContain('Jun 01 2018');
  });

  it('should return VAT rates', async () => {
    nock(config.billingAPI)
      .get('/vat_rates?range_start=2018-01-01&range_stop=2019-01-01')
      .reply(
        200,
        `[
        {
          "code": "Standard",
          "rate": 0.2,
          "valid_from": "2017-01-01"
        },
        {
          "code": "Reduced",
          "rate": 0.05,
          "valid_from": "2017-01-01"
        },
        {
          "code": "Zero",
          "rate": 0.0,
          "valid_from": "2018-06-01"
        }
      ]`,
      );

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });
    const response = await bc.getVATRates({
      rangeStart: new Date('2018-01-01'),
      rangeStop: new Date('2019-01-01'),
    });

    expect(response.length).toEqual(3);
    expect(response[0].code).toEqual('Standard');
    expect(response[0].rate).toEqual(0.2);
    expect(response[0].validFrom.toString()).toContain('Jan 01 2017');
    expect(response[1].code).toEqual('Reduced');
    expect(response[1].rate).toEqual(0.05);
    expect(response[1].validFrom.toString()).toContain('Jan 01 2017');
    expect(response[2].code).toEqual('Zero');
    expect(response[2].rate).toEqual(0.0);
    expect(response[2].validFrom.toString()).toContain('Jun 01 2018');
  });

  it('should throw an error when API response with 500', async () => {
    nock(config.billingAPI)
      .get(
        '/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-500',
      )
      .reply(500, '{"message":"NOT OK"}');

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });

    await expect(
      bc.getBillableEvents({
        orgGUIDs: ['org-guid-500'],
        rangeStart: new Date('2018-01-01'),
        rangeStop: new Date('2018-01-02'),
      }),
    ).rejects.toThrow(/failed with status 500/);
  });

  it('should throw an error when API response with 500 and no data', async () => {
    nock(config.billingAPI)
      .get(
        '/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-500-no-data',
      )
      .reply(500);

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });

    await expect(
      bc.getBillableEvents({
        orgGUIDs: ['org-guid-500-no-data'],
        rangeStart: new Date('2018-01-01'),
        rangeStop: new Date('2018-01-02'),
      }),
    ).rejects.toThrow(/failed with status 500/);
  });

  it('should throw an error when API response contains invalid price', async () => {
    nock(config.billingAPI)
      .get(
        '/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-bad-price',
      )
      .reply(
        200,
        `[{
        "event_start": "2018-04-20T14:36:09+00:00",
        "event_stop": "2018-04-20T14:45:46+00:00",
        "price": {
          "ex_vat": "not-a-number",
          "inc_vat": "1.0",
          "details": []
        }
      }]`,
      );

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });

    await expect(
      bc.getBillableEvents({
        orgGUIDs: ['org-guid-bad-price'],
        rangeStart: new Date('2018-01-01'),
        rangeStop: new Date('2018-01-02'),
      }),
    ).rejects.toThrow(/failed to parse 'not-a-number' as a number/);
  });

  it('should throw an error when API response contains invalid start_date', async () => {
    nock(config.billingAPI)
      .get(
        '/billable_events?range_start=2018-01-01&range_stop=2018-01-02&org_guid=org-guid-invalid-date',
      )
      .reply(
        200,
        `[{
        "event_start": "14:36 20-04-2018",
        "event_stop": "2018-04-20T14:45:46+00:00",
        "price": {
          "ex_vat": "0.02",
          "inc_vat": "0.024",
          "details": []
        }
      }]`,
      );

    const bc = new BillingClient({
      accessToken: '__ACCESS_TOKEN__',
      apiEndpoint: config.billingAPI,
      logger: pino({ level: 'silent' }),
    });

    await expect(
      bc.getBillableEvents({
        orgGUIDs: ['org-guid-invalid-date'],
        rangeStart: new Date('2018-01-01'),
        rangeStop: new Date('2018-01-02'),
      }),
    ).rejects.toThrow(/invalid date format: 14:36 20-04-2018/);
  });
});
