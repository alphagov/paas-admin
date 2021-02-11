import querystring from 'querystring';

import nock from 'nock';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import {
  downloadPerformanceData,
  viewDashboard,
} from '.';

const linker = (route: string) => `https://example.com/${route}`;
const ctx: IContext = { ...createTestContext(), linkTo: linker };

const sampleMetric = { date: new Date(), value: 1 };
const performanceMetrics = {
  applications: [{ label: 'applications', metrics: [sampleMetric, sampleMetric] }],
  organizations: [
    { label: 'billable', metrics: [sampleMetric, sampleMetric] },
    { label: 'trial', metrics: [sampleMetric, sampleMetric] },
  ],
  services: [{ label: 'services', metrics: [sampleMetric, sampleMetric] }],
};
const performanceNoMetrics = {
  applications: undefined,
  organizations: undefined,
  services: undefined,
};

describe(viewDashboard, () => {
  let nockPerformance: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockPerformance = nock('https://example.com/performance');
  });

  afterEach(() => {
    nockPerformance.done();

    nock.cleanAll();
  });

  it('should generate a graph representation', async () => {
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceMetrics);

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
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceNoMetrics);

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
  let nockPerformance: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockPerformance = nock('https://example.com/performance');
  });

  afterEach(() => {
    nockPerformance.done();

    nock.cleanAll();
  });

  it('should return a downloadable CSV - mOrganizations', async () => {
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceMetrics);

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
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceNoMetrics);

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
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceMetrics);

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
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceNoMetrics);

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
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceMetrics);

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
    nockPerformance
      .get('/metrics.json')
      .reply(200, performanceNoMetrics);

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

