import querystring from 'querystring';

import moment from 'moment';
import nock from 'nock';


import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { getStubCloudwatchMetricsData } from '../../lib/aws/aws-cloudwatch.test.data';
import { getStubResourcesByTag } from '../../lib/aws/aws-tags.test.data';
import * as data from '../../lib/cf/cf.test.data';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import {
  cloudfrontMetricNames,
  elasticacheMetricNames,
  elasticsearchMetricNames,
  rdsMetricNames,
} from '../../lib/metric-data-getters';
import { getStubPrometheusMetricsSeriesData } from '../../lib/prom/prom.test.data';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import {
  composeValue,
  downloadServiceMetrics,
  isNumeric,
  parseRange,
  resolveServiceMetrics,
  sanitiseMomentInput,
  viewServiceMetrics,
} from '.';

const linker = (route: string) => `https://example.com/${route}`;
const ctx: IContext = { ...createTestContext(), linkTo: linker };

describe('service metrics test suite', () => {
  let oldEnv: any;
  beforeEach(() => {
    nock.cleanAll();
    oldEnv = { ...process.env };

    process.env.AWS_ACCESS_KEY_ID = 'some-key-id';
    process.env.AWS_SECRET_ACCESS_KEY = 'some-secret-key';

    nock('https://example.com/api')
      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9/user_roles')
      .times(5)
      .reply(200, data.userRolesForOrg)
      .get('/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92')
      .times(1)
      .reply(200, data.serviceInstance)
      .get('/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1')
      .times(1)
      .reply(200, data.servicePlan)
      .get('/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139')
      .times(1)
      .reply(200, data.space)
      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9')
      .times(1)
      .reply(200, defaultOrg())
      .get(
        '/v2/user_provided_service_instances?q=space_guid:38511660-89d9-4a6e-a889-c32c7e94f139',
      )
      .times(1)
      .reply(200, data.userServices)
      .get(
        '/v2/user_provided_service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      )
      .times(1)
      .reply(200, data.userServiceInstance)
      .get('/v2/services/a00cacc0-0ca6-422e-91d3-6b22bcd33450')
      .times(1)
      .reply(200, data.serviceString);
  });

  function mockService(service: object) {
    nock('https://example.com/api')
      .get('/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422')
      .times(1)
      .reply(200, JSON.stringify(service));
  }

  afterEach(() => {
    process.env = { ...oldEnv };
  });

  it('should show the service metrics page', async () => {
    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(1)
      .reply(
        200,
        getStubCloudwatchMetricsData(
          rdsMetricNames.map(m => ({ id: m, label: m })),
        ),
      );

    mockService(data.serviceObj);

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
        .subtract(1, 'hour')
        .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Service name-1508 Metrics');

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the service metrics page when asking JUST for over one year of metrics', async () => {
    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(1)
      .reply(
        200,
        getStubCloudwatchMetricsData(
          rdsMetricNames.map(m => ({ id: m, label: m })),
        ),
      );

    mockService(data.serviceObj);

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
        .subtract(1, 'year')
        .subtract(2, 'days')
        .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Service name-1508 Metrics');

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should return cloudwatch metrics for a postgres backing service', async () => {
    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(1)
      .reply(
        200,
        getStubCloudwatchMetricsData(
          rdsMetricNames.map(m => ({ id: m, label: m })),
        ),
      );

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'postgres',
      },
    });
    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
        .subtract(1, 'hour')
        .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Database Connections');

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should return cloudwatch metrics for a redis backing service', async () => {
    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(2)
      .reply(
        200,
        getStubCloudwatchMetricsData(
          elasticacheMetricNames.map(m => ({ id: m, label: m })),
        ),
      );

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'redis',
      },
    });

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
        .subtract(1, 'hour')
        .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Cache hits');

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should return cloudwatch metrics for a cdn-route backing service', async () => {
    nock('https://aws-tags.example.com/')
      .post('/')
      .reply(200, getStubResourcesByTag());

    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(2)
      .reply(
        200,
        getStubCloudwatchMetricsData(
          cloudfrontMetricNames.map(m => ({ id: m, label: m })),
        ),
      );

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'cdn-route',
      },
    });

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
        .subtract(1, 'hour')
        .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Requests');
    expect(response.body).toContain('Total error rate');

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should return prometheus metrics for an elasticsearch backing service', async () => {
    nock('https://example.com/prom')
      .get('/api/v1/query_range')
      .query(true)
      .times(elasticsearchMetricNames.length)
      .reply(200, getStubPrometheusMetricsSeriesData(['001', '002']));

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'elasticsearch',
      },
    });

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
        .subtract(1, 'hour')
        .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Load average');
    expect(response.body).toContain('Memory');
    expect(response.body).toContain('Elasticsearch indices count');
    expect(response.body).toContain('Disk usage');
    expect(response.body).toContain('Disk read rate');
    expect(response.body).toContain('Disk write rate');
    expect(response.body).toContain('Network in');
    expect(response.body).toContain('Network out');

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should not return metrics for a user provided service', async () => {
    const userProvidedServiceGUID = '54e4c645-7d20-4271-8c27-8cc904e1e7ee';
    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
        .subtract(1, 'hour')
        .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: userProvidedServiceGUID,
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).not.toContain('Database Connections');
    expect(response.body).not.toContain('Cache hits');
    expect(response.body).toContain(
      'Metrics are not available for this service yet.',
    );

    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should not return metrics when encountering an unknown service', async () => {
    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'unknown-service-label',
      },
    });

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      rangeStart: moment()
      .subtract(1, 'hour')
      .format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain(
      'Metrics are not available for this service yet.',
    );
  });

  it('should redirect if no range provided', async () => {
    const response = await viewServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      },
    );

    expect(response.body).not.toBeDefined();
    expect(response.status).toEqual(302);
    expect(response.redirect).toContain('rangeStart');
    expect(response.redirect).toContain('rangeStop');
  });

  it('should redirect if resolver has been accessed', async () => {
    const response = await resolveServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        offset: '3h',
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      },
    );

    expect(response.body).not.toBeDefined();
    expect(response.status).toEqual(302);
    expect(response.redirect).toContain('rangeStart');
    expect(response.redirect).toContain('rangeStop');
  });

  it('should redirect if resolver has been accessed with an invalid offset', async () => {
    const response = await resolveServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        offset: '9999999h',
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      },
    );

    expect(response.body).not.toBeDefined();
    expect(response.status).toEqual(302);
    expect(response.redirect).toContain('rangeStart');
    expect(response.redirect).toContain('rangeStop');
  });

  it('should throw an error if rangeStop is sooner than rangeStart', async () => {
    await expect(
      viewServiceMetrics(ctx, {
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        rangeStart: moment().format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: moment()
          .subtract(1, 'hour')
          .format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      }),
    ).rejects.toThrow(/Invalid time range provided/);
  });

  it('should throw an error if asking for more than a year of metrics', async () => {
    await expect(
      viewServiceMetrics(ctx, {
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        rangeStart: moment()
          .subtract(1, 'year')
          .subtract(2, 'weeks')
          .format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      }),
    ).rejects.toThrow('Cannot handle more than a year of metrics');
  });

  it('should throw an error if providing non-ISO format', async () => {
    await expect(
      viewServiceMetrics(ctx, {
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        rangeStart: moment()
          .subtract(1, 'week')
          .unix(),
        rangeStop: moment().unix(),
        serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      }),
    ).rejects.toThrow('Cannot handle over a year old metrics');
  });

  it('should download a postgres csv', async () => {
    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(1)
      .reply(
        200,
        getStubCloudwatchMetricsData([
          { id: 'mFreeStorageSpace', label: '' },
          { id: 'mCPUUtilization', label: '' },
        ]),
      );

    mockService(data.serviceObj);

    const rangeStop = moment();
    const rangeStart = rangeStop.subtract(1, 'hour');

    const response = await downloadServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mFreeStorageSpace',
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        rangeStart: rangeStart.format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: rangeStop.format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
        units: 'Bytes',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/postgres-metrics.*\.csv/);
    expect(response.download!.data).toMatch(/Service,Time,Value/);
    expect(response.download!.data).toMatch(
      new RegExp(`postgres,${rangeStart.format('YYYY-MM-DD[T]HH:mm')},\\d+B`),
    );

    const lines = response.download!.data
      .split('\n')
      .filter(line => line.length > 0);

    expect(lines.length).toBeGreaterThan(2);

    const [{}, first, ...{}] = lines;
    const [{}, firstDate, {}] = first.split(',');
    expect(moment(firstDate).diff(rangeStart)).toBeLessThanOrEqual(60 * 1000);
  });

  it('should download a redis csv', async () => {
    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(2)
      .reply(
        200,
        getStubCloudwatchMetricsData([
          { id: 'mCacheHits', label: '' },
          { id: 'mCacheMisses', label: '' },
        ]),
      );

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'redis',
      },
    });

    const rangeStop = moment();
    const rangeStart = rangeStop.subtract(1, 'hour');

    const response = await downloadServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mCacheHits',
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        rangeStart: rangeStart.format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: rangeStop.format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
        units: 'Number',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/redis-metrics.*\.csv/);
    expect(response.download!.data).toMatch(/Service,Instance,Time,Value/);
    expect(response.download!.data).toMatch(
      new RegExp(`redis,,${rangeStart.format('YYYY-MM-DD[T]HH:mm')},\\d+`),
    );

    const lines = response.download!.data.split('\n');

    expect(lines.length).toBeGreaterThan(2);

    const [{}, first, ...{}] = lines;
    const [{}, {}, firstDate, {}] = first.split(',');
    expect(moment(firstDate).diff(rangeStart)).toBeLessThanOrEqual(60 * 1000);
  });

  it('should download a cdn-route csv', async () => {
    nock('https://aws-tags.example.com/')
      .post('/')
      .reply(200, getStubResourcesByTag());

    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .times(2)
      .reply(
        200,
        getStubCloudwatchMetricsData([
          { id: 'mRequests', label: '' },
          { id: 'mTotalErrorRate', label: '' },
        ]),
      );

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'cdn-route',
      },
    });

    const rangeStop = moment();
    const rangeStart = rangeStop.subtract(1, 'hour');

    const response = await downloadServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mRequests',
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        rangeStart: rangeStart.format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: rangeStop.format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
        units: 'Number',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/cdn-route-metrics.*\.csv/);
    expect(response.download!.data).toMatch(/Service,Time,Value/);
    expect(response.download!.data).toMatch(
      new RegExp(`cdn-route,${rangeStart.format('YYYY-MM-DD[T]HH:mm')},\\d+`),
    );

    const lines = response.download!.data.split('\n');

    expect(lines.length).toBeGreaterThan(2);

    const [{}, first, ...{}] = lines;
    const [{}, firstDate, ...{}] = first.split(',');
    expect(moment(firstDate).diff(rangeStart)).toBeLessThanOrEqual(60 * 1000);
  });

  it('should download an elasticsearch csv', async () => {
    nock('https://example.com/prom')
      .get('/api/v1/query_range')
      .query(true)
      .times(elasticsearchMetricNames.length)
      .reply(200, getStubPrometheusMetricsSeriesData(['001', '002']));

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'elasticsearch',
      },
    });

    const rangeStop = moment();
    const rangeStart = rangeStop.subtract(1, 'hour');

    const response = await downloadServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'loadAvg',
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        rangeStart: rangeStart.format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: rangeStop.format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
        units: 'Number',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/elasticsearch-metrics.*\.csv/);
    expect(response.download!.data).toMatch(/Service,Instance,Time,Value/);
    expect(response.download!.data).toMatch(
      new RegExp(
        `elasticsearch,00[1-2],${rangeStart.format('YYYY-MM-DD[T]HH:mm')},\\d+`,
      ),
    );

    const lines = response.download!.data.split('\n');

    expect(lines.length).toBeGreaterThan(2);

    const [{}, first, ...{}] = lines;
    const [{}, {}, firstDate, {}] = first.split(',');
    expect(moment(firstDate).diff(rangeStart)).toBeLessThanOrEqual(60 * 1000);
  });

  it('should fail to download csv if no data returned from prometheus', async () => {
    nock('https://example.com/prom')
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, getStubPrometheusMetricsSeriesData([]));

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'elasticsearch',
      },
    });

    await expect(
      downloadServiceMetrics(
        {
          ...ctx,
          linkTo: (_name, params) => querystring.stringify(params),
        },
        {
          metric: 'diskUsed',
          organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
          rangeStart: moment()
            .subtract(1, 'hour')
            .format('YYYY-MM-DD[T]HH:mm'),
          rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
          serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
          spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
          units: 'Bytes',
        },
      ),
    ).rejects.toThrow(/Did not get metric diskUsed for elasticsearch/);
  });

  it('should fail to download csv if no data returned from cloudwatch', async () => {
    nock('https://aws-cloudwatch.example.com/')
      .post('/')
      .reply(200, getStubCloudwatchMetricsData([]));

    mockService(data.serviceObj);

    await expect(
      downloadServiceMetrics(
        {
          ...ctx,
          linkTo: (_name, params) => querystring.stringify(params),
        },
        {
          metric: 'mFreeStorageSpace',
          organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
          rangeStart: moment()
            .subtract(1, 'hour')
            .format('YYYY-MM-DD[T]HH:mm'),
          rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
          serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
          spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
          units: 'Bytes',
        },
      ),
    ).rejects.toThrow(/Did not get metric mFreeStorageSpace for postgres/);
  });

  it('should redirect if no range or metric provided for csv download', async () => {
    const response = await downloadServiceMetrics(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      },
    );

    expect(response.body).not.toBeDefined();
    expect(response.status).toEqual(302);
    expect(response.redirect).toContain('rangeStart');
    expect(response.redirect).toContain('rangeStop');
  });

  it('should fail to download csv if the service label is not known', async () => {
    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'unknown-service-label',
      },
    });

    await expect(
      downloadServiceMetrics(
        {
          ...ctx,
          linkTo: (_name, params) => querystring.stringify(params),
        },
        {
          metric: 'aMetric',
          organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
          rangeStart: moment()
            .subtract(1, 'hour')
            .format('YYYY-MM-DD[T]HH:mm'),
          rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
          serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
          spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
          units: 'aUnit',
        },
      ),
    ).rejects.toThrow(/Unrecognised service label unknown-service-label/);
  });

  it('should fail to download csv for a user provided service', async () => {
    const userProvidedServiceGUID = '54e4c645-7d20-4271-8c27-8cc904e1e7ee';

    await expect(
      downloadServiceMetrics(
        {
          ...ctx,
          linkTo: (_name, params) => querystring.stringify(params),
        },
        {
          metric: 'aMetric',
          organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
          rangeStart: moment()
            .subtract(1, 'hour')
            .format('YYYY-MM-DD[T]HH:mm'),
          rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
          serviceGUID: userProvidedServiceGUID,
          spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
          units: 'aUnit',
        },
      ),
    ).rejects.toThrow(/Unrecognised service label User Provided Service/);
  });
});

describe(composeValue, () => {
  it('should compose values correctly', () => {
    expect(composeValue(2048, 'Bytes')).toEqual('2.00KiB');
    expect(composeValue(45, 'Percent')).toEqual('45.00%');
    expect(composeValue(128)).toEqual('128.00');
  });
});
describe(isNumeric, () => {
  it('should return true if a string resembles a number', () => {
    expect(isNumeric('01')).toBeTruthy();
  });
  it('should return false if a string doesn\'t resemeble a number', () => {
    expect(isNumeric('bb')).not.toBeTruthy();
  });
});


describe(sanitiseMomentInput, () => {
  it('should populate values with today\'s date-time if input values are missing', () => {
    const userInput = sanitiseMomentInput(
      { day: undefined, month: undefined, year: undefined, hour: undefined, minute: undefined },
    )
    const currentDay = Number(moment().format('DD'))
    const currentMonth = Number(moment().format('MM')) - 1  // momentjs months are Zero-based
    const currentYear = Number(moment().format('YYYY'))
    const currentHour = Number(moment().format('HH'))
    const currentMinute = Number(moment().format('mm'))
    expect(userInput.day).toEqual(currentDay);
    expect(userInput.month).toEqual(currentMonth);
    expect(userInput.year).toEqual(currentYear);
    expect(userInput.hour).toEqual(currentHour);
    expect(userInput.minute).toEqual(currentMinute);
  });
});

describe(parseRange, () => {
  it('should do nothing if user hasn\'t submitted anything', () => {

    const defaultRange = parseRange('2020-09-13T14:25', '2020-09-14T15:25')
    expect((defaultRange.rangeStart).format('YYYY-MM-DD[T]HH:mm'))
      .toEqual(moment('2020-09-13T14:25').format('YYYY-MM-DD[T]HH:mm'));
    expect((defaultRange.rangeStop).format('YYYY-MM-DD[T]HH:mm'))
      .toEqual(moment('2020-09-14T15:25').format('YYYY-MM-DD[T]HH:mm'));

  });
  it('should return a sanitized user input', () => {

    const userStartInput = { day: 13, month: 9 , year: 2020, hour: 14, minute: 25 }
    const userStopInput = { day: 14, month: 9 , year: 2020, hour: 15, minute: 25 }
    
    const userEnteredRange = parseRange(userStartInput, userStopInput)
    expect((userEnteredRange.rangeStart).format('YYYY-MM-DD[T]HH:mm'))
      .toEqual(moment(userStartInput).subtract('1','month').format('YYYY-MM-DD[T]HH:mm')); 
    expect((userEnteredRange.rangeStop).format('YYYY-MM-DD[T]HH:mm'))
      .toEqual(moment(userStopInput).subtract('1','month').format('YYYY-MM-DD[T]HH:mm'));
    // momentjs months are Zero-based hence the subtraction
  });

  it('should return a sanitized user input', () => {

    const userStartInput = { day: 13, month: 9 , year: 2020, hour: 14, minute: 25 }
    const userStopInput = { day: 14, month: 9 , year: 2020, hour: 15, minute: 25 }
    
    const userEnteredRange = parseRange(userStartInput, userStopInput)
    expect((userEnteredRange.rangeStart).format('YYYY-MM-DD[T]HH:mm'))
      .toEqual(moment(userStartInput).subtract('1','month').format('YYYY-MM-DD[T]HH:mm')); 
    expect((userEnteredRange.rangeStop).format('YYYY-MM-DD[T]HH:mm'))
      .toEqual(moment(userStopInput).subtract('1','month').format('YYYY-MM-DD[T]HH:mm'));
    // momentjs months are Zero-based hence the subtraction
  });
});

