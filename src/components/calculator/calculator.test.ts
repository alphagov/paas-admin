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
  components: [
    {
      name: 'instance',
      formula: 'ceil($time_in_seconds/3600) * 0.01',
      vat_code: 'Standard',
      currency_code: 'USD',
    },
  ],
  memory_in_mb: 0,
  storage_in_mb: 0,
  number_of_nodes: 0,
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
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'app',
          plan_guid: '00000000-0000-0000-0000-000000000001',
          components: [
            {
              name: 'instance',
              formula: '9.99',
              vat_code: 'Standard',
              currency_code: 'USD',
            },
          ],
        },
        {
          ...defaultPricingPlan,
          name: 'postgres',
          plan_guid: '00000000-0000-0000-0000-000000000002',
          components: [
            {
              name: 'instance',
              formula: '6.66',
              vat_code: 'Standard',
              currency_code: 'USD',
            },
          ],
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

    expect(response.body).toContain('app');
    expect(response.body).toContain('&pound;9.99');
    expect(response.body).toContain('postgres');
    expect(response.body).toContain('&pound;6.66');
  });

  it('should sort the quote by order added', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

    const postgresGuid = 'f4d4b95a-f55e-4593-8d54-3364c25798c4';
    const appGuid = 'f4d4b95b-f55e-4593-8d54-3364c25798c0';
    // tslint:disable:max-line-length
    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'postgres',
          plan_guid: postgresGuid,
        },
        {
          ...defaultPricingPlan,
          name: 'app',
          plan_guid: appGuid,
        },
      ]))
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {
      items: [
        {planGUID: appGuid, numberOfNodes: '1'},
        {planGUID: postgresGuid},
      ],
    });

    expect(response.body).toContain('postgres');
    expect(response.body).toContain('app');
    if (response.body && typeof response.body === 'string') {
      const idxPostgres = response.body.indexOf('postgres');
      const idxApp = response.body.indexOf('app');
      expect(idxPostgres > idxApp).toBeTruthy(); // expected postgres to appear after app
    }
  });

  it('should blacklist compose plan', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');
    const rangeStop = moment().endOf('month').format('YYYY-MM-DD');

    // tslint:disable:max-line-length
    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'redis tiny (compose)',
          plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c1',
        },
      ]))
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
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(200, JSON.stringify([
        {
          ...defaultPricingPlan,
          name: 'aws-s3-bucket default',
        },
      ]))
    ;
    // tslint:enable:max-line-length

    const response = await getCalculator(ctx, {});
    expect(response.body).toContain('aws-s3-bucket');
    expect(response.body).not.toMatch(/aws-s3-bucket\s+default/);
  });
});
