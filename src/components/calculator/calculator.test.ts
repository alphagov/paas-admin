import moment from 'moment';
import nock from 'nock';
import {createTestContext} from '../app/app.test-helpers';

import {config} from '../app/app.test.config';
import {IContext} from '../app/context';
import {getCalculator} from '../calculator';

const ctx: IContext = createTestContext();

const defaultPricingPlan = {
  name: 'default-plan-name',
  plan_guid: 'default-plan-guid',
  valid_from: '2017-01-01T00:00:00+00:00',
  components: [],
  memory_in_mb: 0,
  storage_in_mb: 0,
  number_of_nodes: 0,
};

const defaultForecastEvent = {
  event_guid: 'default-event-guid',
  event_start: '2001-01-01T00:00:00+00:00',
  event_stop: '2001-01-01T01:00:00+00:00',
  resource_guid: 'default-resource-guid',
  resource_name: 'default-resource-name',
  resource_type: 'default-resource-type',
  org_guid: 'default-org-guid',
  space_guid: 'default-space-guid',
  plan_guid: 'default-plan-guid',
  number_of_nodes: 1,
  memory_in_mb: 1024,
  storage_in_mb: 0,
  price: {
    inc_vat: '0.012',
    ex_vat: '0.01',
    details: [
      {
        name: 'default-price-detail-name',
        plan_name: 'default-price-detail-plan-name',
        start: '2001-01-01T00:00:00+00:00',
        stop: '2001-01-01T01:00:00+00:00',
        vat_rate: '0.2',
        vat_code: 'default-vat-code',
        currency_code: 'default-currency-code',
        inc_vat: '0.00',
        ex_vat: '0.00',
      },
    ],
  },
};

describe('calculator test suite', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should get calculator', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

    // tslint:disable:max-line-length
    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'app',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
          storage_in_mb: 524288,
        },
        {
          ...defaultPricingPlan,
          name: 'postgres tiny-9.6',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c5',
        },
        {
          ...defaultPricingPlan,
          name: 'mysql large-ha-5.7',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c6',
        },
        {
          ...defaultPricingPlan,
          name: 'redis tiny-clustered-3.2',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c7',
        },
        {
          ...defaultPricingPlan,
          name: 'elasticsearch small-ha-6.x',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c8',
        },
        {
          ...defaultPricingPlan,
          name: 'prometheus',
        },
        {
          ...defaultPricingPlan,
          name: 'aws-s3-bucket default',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c9',
        },
      ]))
      .get(`/forecast_events?range_start=${rangeStart}&range_stop=${rangeStop}&org_guid=00000001-0000-0000-0000-000000000000&events=%5B%5D`)
      .reply(200, [])
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {});

    expect(response.body).toContain('Pricing calculator');
    expect(response.body).toMatch(/\bapp\b/);
    expect(response.body).toMatch(/\bpostgres\b/);
    expect(response.body).toMatch(/\bmysql\b/);
    expect(response.body).toMatch(/\bredis\b/);
    expect(response.body).toMatch(/\belasticsearch\b/);
    expect(response.body).toMatch(/\baws-s3-bucket\b/);
  });

  it('should get a zero quote if no items are specified', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(200, `[]`);

    const response = await getCalculator(ctx, {
      items: [],
    });

    expect(response.body).toContain('Pricing calculator');
    expect(response.body).toContain('<p class="paas-price">&pound; 0.00</p>');

  });

  it('should use calculator when provided fake services', async () => {
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
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'app',
          plan_guid: '00000000-0000-0000-0000-000000000001',
        },
        {
          ...defaultPricingPlan,
          name: 'postgres',
          plan_guid: '00000000-0000-0000-0000-000000000002',
        },
      ]))
      .get(`/forecast_events`)
      .reply(200, JSON.stringify([
        {
          ...defaultForecastEvent,
          resource_name: 'APP1',
          resource_type: '_TESTING_APPLICATION_',
          plan_guid: '00000000-0000-0000-0000-000000000001',
        },
        {
          ...defaultForecastEvent,
          resource_name: 'SERVICE1',
          resource_type: '_TESTING_SERVICE_',
          plan_guid: '00000000-0000-0000-0000-000000000002',
        },
      ]))
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {
      items: [
        {planGUID: '00000000-0000-0000-0000-000000000001', numberOfNodes: '1'},
        {planGUID: '00000000-0000-0000-0000-000000000002', numberOfNodes: '2'},
      ],
    });

    expect(response.body).toContain('_TESTING_APPLICATION_');
    expect(response.body).toContain('_TESTING_SERVICE_');
  });

  it('should sort the quote by order added', async () => {
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
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'app',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
        },
      ]))
      .get(`/forecast_events`)
      .reply(200, JSON.stringify([
        {
          ...defaultForecastEvent,
          event_guid: 'aa30fa3c-725d-4272-9052-c7186d4968a3',
          resource_type: '_TESTING_APPLICATION_3_',
        },
        {
          ...defaultForecastEvent,
          event_guid: 'aa30fa3c-725d-4272-9052-c7186d4968a1',
          resource_type: '_TESTING_APPLICATION_1_',
        },
        {
          ...defaultForecastEvent,
          event_guid: 'aa30fa3c-725d-4272-9052-c7186d4968a2',
          resource_type: '_TESTING_APPLICATION_2_',
        },
      ]))
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {
      items: [
        {planGUID: 'f4d4b95a-f55e-4593-8d54-3364c25798c4', numberOfNodes: '1'},
        {planGUID: 'f4d4b95b-f55e-4593-8d54-3364c25798c0'},
      ],
    });

    expect(response.body).toContain('_TESTING_APPLICATION_1_');
    expect(response.body).toContain('_TESTING_APPLICATION_3_');
    if (response.body && typeof response.body === 'string') {
      const idx1 = response.body.indexOf('_TESTING_APPLICATION_1_');
      const idx3 = response.body.indexOf('_TESTING_APPLICATION_3_');
      expect(idx3 > idx1).toBeTruthy(); // expected item3 to appear after item1
    }
  });

  it('should blacklist compose plan', async () => {
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
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'redis tiny (compose)',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c1',
        },
      ]))
      .get(`/forecast_events`)
      .reply(200, `[]`)
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {});
    expect(response.body).not.toContain('compose');
  });

  it('should show postgres plan wih version', async () => {
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
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'postgres tiny-9.6',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c2',
        },
        {
          ...defaultPricingPlan,
          name: 'postgres micro-9.6',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c1',
        },
        {
          ...defaultPricingPlan,
          name: 'postgres small-9.6',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c3',
        },
        {
          ...defaultPricingPlan,
          name: 'postgres medium-9.6',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
        },
        {
          ...defaultPricingPlan,
          name: 'postgres large-9.6',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c5',
        },
        {
          ...defaultPricingPlan,
          name: 'postgres xlarge-9.6',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c6',
        },
      ]))
      .get(`/forecast_events`)
      .reply(200, `[]`)
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {});
    expect(response.body).toMatch(/postgres\s+9.6/);
  });

  it('should use calculator and ignore empty application', async () => {
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
      .reply(200, JSON.stringify([
        {
          name: 'mysql mysql-medium-5.7',
          plan_guid: '_SERVICE_PLAN_GUID_',
          valid_from: '2002-01-01',
          components: [
            {
              name: 'cpu-usage',
              formula: '$number_of_nodes * 0.001 * $time_in_seconds',
              vat_code: 'Standard',
              currency_code: 'GBP',
            },
            {
              name: 'storage-usage',
              formula: '$storage_in_mb * 0.0001 * $time_in_seconds',
              vat_code: 'Standard',
              currency_code: 'GBP',
            },
          ],
          memory_in_mb: 345,
          storage_in_mb: 543,
          number_of_nodes: 1,
        },
      ]))
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

    expect(response.body).toContain('Pricing calculator');
  });

  it('should omit printing "default" when there is only a default pricing plan', async () => {
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
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'aws-s3-bucket default',
        },
      ]))
      .get(`/forecast_events`)
      .reply(200, `[]`)
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {});
    expect(response.body).toContain('aws-s3-bucket');
    expect(response.body).not.toMatch(/aws-s3-bucket\s+default/);
  });
});
