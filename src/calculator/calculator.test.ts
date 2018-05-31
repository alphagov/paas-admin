import jwt from 'jsonwebtoken';
import moment from 'moment';
import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { getCalculator } from '../calculator';

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

test('should get calculator', async t => {
  const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

  // tslint:disable:max-line-length
  nock(config.billingAPI)
    .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
    .reply(200, `[
      {
        "name": "service PLAN2",
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
      },
      {
        "name": "prometheus",
        "valid_from": "2002-01-01",
        "components": []
      }
    ]`)
    .get(`/forecast_events?range_start=${rangeStart}&range_stop=${rangeStop}&org_guid=00000001-0000-0000-0000-000000000000&events=%5B%5D`)
    .reply(200, [])
  ;
  // tslint:enable:max-line-length

  const response = await getCalculator(ctx, {});

  t.contains(response.body, 'Pricing calculator');
});

test('should use calculator when provided fake services', async t => {
  const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

  // tslint:disable:max-line-length
  nock(config.billingAPI)
    .filteringPath((path: string) => {
      if (path.includes('/forecast_events')) {
        return '/billing/forecast_events';
      }

      return path;
    })
    .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
    .reply(200, [])
    .get(`/forecast_events`)
    .reply(200, `[
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
              "currency_rate": "1",
              "inc_vat": "0.012",
              "ex_vat": "0.01"
            }
          ]
        }
      }
    ]`)
  ;
  // tslint:enable:max-line-length

  const response = await getCalculator(ctx, {
    app: {
      description: '_TESTING_APPLICATION_',
      memory: 1,
      instances: 1,
    },
  });

  t.contains(response.body, '_TESTING_APPLICATION_');
});

test('should use calculator and ignore empty application', async t => {
  const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

  // tslint:disable:max-line-length
  nock(config.billingAPI)
    .filteringPath((path: string) => {
      if (path.includes('/forecast_events')) {
        return '/billing/forecast_events';
      }

      return path;
    })
    .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
    .reply(200, `[
      {
        "name": "mysql mysql-medium-5.7",
        "plan_guid": "_SERVICE_PLAN_GUID_",
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
        "memory_in_mb": 345,
        "storage_in_mb": 543,
        "number_of_nodes": 1
      }
    ]`)
    .get(`/forecast_events`)
    .reply(200, [])
  ;
  // tslint:enable:max-line-length

  const response = await getCalculator(ctx, {
    app: {},
    mysql: {
      plan: '_SERVICE_PLAN_GUID_',
    },
    redis: {
      plan: '_NON_EXISTING_PLAN_',
    },
  });

  t.contains(response.body, 'Pricing calculator');
});

test('should use calculator while removing unwanted instance', async t => {
  const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

  // tslint:disable:max-line-length
  nock(config.billingAPI)
    .filteringPath((path: string) => {
      if (path.includes('/forecast_events')) {
        return '/billing/forecast_events';
      }

      return path;
    })
    .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
    .reply(200, [])
    .get(`/forecast_events`)
    .reply(200, [])
  ;
  // tslint:enable:max-line-length

  const response = await getCalculator(ctx, {
    estimate: JSON.stringify([
      {
        kind: 'mysql',
        id: '_FAKE_MYSQL_GUID_',
      },
      {
        kind: 'app',
        id: '_FAKE_APP_GUID_',
      },
      {
        description: '_NO_ID_APP_',
      },
    ]),
    remove: ['_FAKE_MYSQL_GUID_'],
  });

  t.contains(response.body, '_FAKE_APP_GUID_');
  t.notMatch(response.body, '_FAKE_MYSQL_GUID_');
});
