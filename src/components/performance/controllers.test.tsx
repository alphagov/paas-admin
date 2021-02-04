import querystring from 'querystring';

import nock from 'nock';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { getStubPrometheusMetricsSeriesData } from '../../lib/prom/prom.test.data';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import {
  downloadPerformanceData,
  viewDashboard,
} from '.';

const prometheusNoData = { status: 'success', data: { resultType: 'series', result: [] } };

const linker = (route: string) => `https://example.com/${route}`;
const ctx: IContext = { ...createTestContext(), linkTo: linker };

describe(viewDashboard, () => {
  let nockProm: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockProm = nock('https://example.com/prom');
  });

  afterEach(() => {
    nockProm.done();

    nock.cleanAll();
  });

  it('should generate a graph representation', async () => {
    nockProm
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, getStubPrometheusMetricsSeriesData(['billable', 'trial']))

      .get('/api/v1/query_range')
      .query(true)
      .reply(200, getStubPrometheusMetricsSeriesData(['users']))

      .get('/api/v1/query_range')
      .query(true)
      .reply(200, getStubPrometheusMetricsSeriesData(['services']));

      const response = await viewDashboard(
        {
          ...ctx,
          linkTo: (_name, params) => querystring.stringify(params),
        },
        {},
      );

      expect(response).toHaveProperty('body');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
  });

  it('should generate a graph representation with no data', async () => {
    nockProm
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, prometheusNoData)

      .get('/api/v1/query_range')
      .query(true)
      .reply(200, prometheusNoData)

      .get('/api/v1/query_range')
      .query(true)
      .reply(200, prometheusNoData);

      const response = await viewDashboard(
        {
          ...ctx,
          linkTo: (_name, params) => querystring.stringify(params),
        },
        {},
      );

      expect(response).toHaveProperty('body');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
  });
});

describe(downloadPerformanceData, () => {
  let nockProm: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockProm = nock('https://example.com/prom');
  });

  afterEach(() => {
    nockProm.done();

    nock.cleanAll();
  });

  it('should return a downloadable CSV - mOrganizations', async () => {
    nockProm
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, getStubPrometheusMetricsSeriesData(['billable', 'trial']));

    const response = await downloadPerformanceData(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mOrganizations',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/govuk-paas-performance-mOrganizations.csv/);
    expect(response.download!.data).toMatch(/date,billable,trial/);

    const lines = response.download!.data.split('\n');

    expect(lines.length).toBeGreaterThan(2);
  });

  it('should fail to return a downloadable CSV due to missing data - mOrganizations', async () => {
    nockProm
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, prometheusNoData);

    const response = await downloadPerformanceData(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mOrganizations',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/govuk-paas-performance-mOrganizations.csv/);
    expect(response.download!.data).toMatch(/date,billable,trial/);

    const lines = response.download!.data.split('\n');

    expect(lines.length).toEqual(1);
  });

  it('should return a downloadable CSV - mApplicationCount', async () => {
    nockProm
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, getStubPrometheusMetricsSeriesData(['applications']));

    const response = await downloadPerformanceData(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mApplicationCount',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/govuk-paas-performance-mApplicationCount.csv/);
    expect(response.download!.data).toMatch(/date,applications/);

    const lines = response.download!.data.split('\n');

    expect(lines.length).toBeGreaterThan(2);
  });

  it('should fail to return a downloadable CSV due to missing data - mApplicationCount', async () => {
    nockProm
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, prometheusNoData);

    const response = await downloadPerformanceData(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mApplicationCount',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/govuk-paas-performance-mApplicationCount.csv/);
    expect(response.download!.data).toMatch(/date,applications/);

    const lines = response.download!.data.split('\n');

    expect(lines.length).toEqual(1);
  });

  it('should return a downloadable CSV - mServiceCount', async () => {
    nockProm
      .get('/api/v1/query_range')
      .query(true)
      .reply(200, getStubPrometheusMetricsSeriesData(['services']));

    const response = await downloadPerformanceData(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mServiceCount',
      },
    );

    expect(response.mimeType).toEqual('text/csv');
    expect(response.download).toBeDefined();
    expect(response.download!.name).toMatch(/govuk-paas-performance-mServiceCount.csv/);
    expect(response.download!.data).toMatch(/date,services/);

    const lines = response.download!.data.split('\n');

    expect(lines.length).toBeGreaterThan(2);
  });

  it('should fail to return a downloadable CSV due to invalid metric requested', async () => {
    await expect(downloadPerformanceData(
      {
        ...ctx,
        linkTo: (_name, params) => querystring.stringify(params),
      },
      {
        metric: 'mNotReal',
      },
    )).rejects.toThrow(/Performance metric not recognised/);
  });
});

