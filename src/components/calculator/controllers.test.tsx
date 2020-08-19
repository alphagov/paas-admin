import moment from 'moment';
import nock from 'nock';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { createTestContext } from '../app/app.test-helpers';
import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { getCalculator } from '../calculator';

const ctx: IContext = createTestContext();

const defaultPricingPlan = {
  components: [
    {
      currency_code: 'USD',
      formula: 'ceil($time_in_seconds/3600) * 0.01',
      name: 'instance',
      vat_code: 'Standard',
    },
  ],
  memory_in_mb: 0,
  name: 'default-plan-name',
  number_of_nodes: 0,
  plan_guid: 'default-plan-guid',
  storage_in_mb: 0,
  valid_from: '2017-01-01T00:00:00+00:00',
};

describe('calculator test suite', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should get calculator', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            ...defaultPricingPlan,
            name: 'app',
            plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
            storage_in_mb: 524288,
          },
          {
            ...defaultPricingPlan,
            name: 'app',
            plan_guid: 'f4d4b95b-f55e-4593-8d54-3364c25798c4',
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
        ]),
      );

    const response = await getCalculator(ctx, {});

    expect(response.body).toContain('Estimate your monthly cost');
    expect(response.body).toMatch(/\bCompute\b/);
    expect(response.body).toMatch(/\bPostgres\b/);
    expect(response.body).toMatch(/\bMySQL\b/);
    expect(response.body).toMatch(/\bRedis\b/);
    expect(response.body).toMatch(/\bElasticsearch\b/);
    expect(response.body).toMatch(/\bAmazon S3\b/);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should get a zero quote if no items are specified', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(200, '[]');

    const response = await getCalculator(ctx, {
      items: [],
    });

    expect(response.body).toContain('Estimate your monthly cost');
    expect(response.body).toContain('<p class="paas-price">£0.00</p>');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should calculate prices (including exchange rate) when provided fake services', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            ...defaultPricingPlan,
            components: [
              {
                currency_code: 'USD',
                formula: '9.99',
                name: 'instance',
                vat_code: 'Standard',
              },
            ],
            name: 'app',
            plan_guid: '00000000-0000-0000-0000-000000000001',
          },
          {
            ...defaultPricingPlan,
            components: [
              {
                currency_code: 'USD',
                formula: '6.66',
                name: 'instance',
                vat_code: 'Standard',
              },
            ],
            name: 'postgres',
            plan_guid: '00000000-0000-0000-0000-000000000002',
          },
        ]),
      )
      .get(`/currency_rates?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            code: 'USD',
            rate: 2.0,
            valid_from: '1970-01-01T00:00:00.000Z',
          },
        ]),
      );

    const response = await getCalculator(ctx, {
      items: [
        {
          numberOfNodes: '1',
          planGUID: '00000000-0000-0000-0000-000000000001',
        },
        {
          numberOfNodes: '2',
          planGUID: '00000000-0000-0000-0000-000000000001',
        },
        {
          numberOfNodes: '2',
          planGUID: '00000000-0000-0000-0000-000000000002',
        },
      ],
    });

    expect(response.body).toContain('app');
    expect(response.body).toContain('£19.98');
    expect(response.body).toContain('Postgres');
    expect(response.body).toContain('£13.32');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should sort the quote by order added', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    const postgresGuid = 'f4d4b95a-f55e-4593-8d54-3364c25798c4';
    const appGuid = 'f4d4b95b-f55e-4593-8d54-3364c25798c0';
    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
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
        ]),
      )
      .get(`/currency_rates?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            code: 'USD',
            rate: 2.0,
            valid_from: '1970-01-01T00:00:00.000Z',
          },
        ]),
      );

    const response = await getCalculator(ctx, {
      items: [
        { memoryInMB: 512, numberOfNodes: '1', planGUID: appGuid },
        { planGUID: postgresGuid },
      ],
    });

    expect(response.body).toContain('Postgres');
    expect(response.body).toContain('Compute');
    if (response.body && typeof response.body === 'string') {
      const idxPostgres = response.body.indexOf('Postgres');
      const idxCompute = response.body.indexOf('Compute');
      expect(idxPostgres > idxCompute).toBeTruthy(); // expected postgres to appear after app
    }
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should filter out compose plans', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            ...defaultPricingPlan,
            name: 'redis tiny (compose)',
            plan_guid: 'f4d4b95a-f55e-4593-8d54-3364c25798c1',
          },
        ]),
      );

    const response = await getCalculator(ctx, {});
    expect(response.body).not.toContain('compose');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show postgres plan and sort the versions', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
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
        ]),
      );

    const response = await getCalculator(ctx, {});
    expect(response.body).toMatch(/Postgres/);

    const planIndices = ['xlarge-9.6', 'medium-9.6', 'tiny-9.6']
      .map(plan => response.body!.toString().indexOf(plan))
    ;

    const sortedPlanIndices = planIndices.slice().sort();

    expect(planIndices).toEqual(sortedPlanIndices);

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should use calculator and ignore empty application', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            components: [
              {
                currency_code: 'GBP',
                formula: '$number_of_nodes * 0.001 * $time_in_seconds',
                name: 'cpu-usage',
                vat_code: 'Standard',
              },
              {
                currency_code: 'GBP',
                formula: '$storage_in_mb * 0.0001 * $time_in_seconds',
                name: 'storage-usage',
                vat_code: 'Standard',
              },
            ],
            memory_in_mb: 345,
            name: 'mysql mysql-medium-5.7',
            number_of_nodes: 1,
            plan_guid: '_SERVICE_PLAN_GUID_',
            storage_in_mb: 543,
            valid_from: '2002-01-01',
          },
        ]),
      )
      .get(`/currency_rates?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            code: 'USD',
            rate: 2.0,
            valid_from: '1970-01-01T00:00:00.000Z',
          },
        ]),
      );

    const response = await getCalculator(ctx, {
      items: [
        { planGUID: '_SERVICE_PLAN_GUID_' },
        { planGUID: '_NON_EXISTING_PLAN_' },
      ],
    });

    expect(response.body).toContain('Estimate your monthly cost');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should omit printing "default" when there is only a default pricing plan', async () => {
    const rangeStart = moment()
      .startOf('month')
      .format('YYYY-MM-DD');
    const rangeStop = moment()
      .endOf('month')
      .format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get(`/pricing_plans?range_start=${rangeStart}&range_stop=${rangeStop}`)
      .reply(
        200,
        JSON.stringify([
          {
            ...defaultPricingPlan,
            name: 'aws-s3-bucket default',
          },
        ]),
      );

    const response = await getCalculator(ctx, {});
    expect(response.body).toContain('Amazon S3');
    expect(response.body).not.toMatch(/Amazon S3\s+default/);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });
});
