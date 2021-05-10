import querystring from 'querystring';

import nock from 'nock';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import {
  combineMetrics,
  downloadPerformanceData,
  exportMaxPerMonthDataValues,
  formatDate,
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
    nockPerformance.on('response', () => {
      nockPerformance.done();
    });

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
    nockPerformance.on('response', () => {
      nockPerformance.done();
    });

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

describe(exportMaxPerMonthDataValues,() => {
 it('should only return the max value from a set of objects who have the same date month value', () => {
   const input = {
      'label': 'custom metric',
      'metrics': [
        { date: new Date('2020-02-24T16:32:03.000Z'), value: 213 },
        { date: new Date('2020-03-02T16:32:03.000Z'), value: 220 },
        { date: new Date('2020-03-09T16:32:03.000Z'), value: 218 },
        { date: new Date('2020-03-16T16:32:03.000Z'), value: 216 },
        { date: new Date('2020-04-06T16:32:03.000Z'), value: 237 },
        { date: new Date('2020-04-13T16:32:03.000Z'), value: 242 },
      ],
     };
    const expectedOutput = [
      { date: new Date('2020-02-24T16:32:03.000Z'), value: 213 },
      { date: new Date('2020-03-02T16:32:03.000Z'), value: 220 },
      { date: new Date('2020-04-13T16:32:03.000Z'), value: 242 },
    ];
   const output = exportMaxPerMonthDataValues(input);
   expect(output).toEqual(expectedOutput);
 });
});

describe(combineMetrics,() => {
  it('should combine two array of objects into one array with trial and billable values', () => {
    const input1 = {
      'label': 'metric1',
      'metrics': [
        { 'date': new Date('2020-02-24T16:32:03.000Z'),'value': 42 },
        { 'date': new Date('2020-03-02T16:32:03.000Z'),'value': 43 },
        { 'date': new Date('2020-03-23T16:32:03.000Z'),'value': 42 },
      ],
    };
    const input2 = {
      'label': 'metric2',
      'metrics': [
        { 'date': new Date('2020-02-24T16:32:03.000Z'),'value': 14 },
        { 'date': new Date('2020-03-09T16:32:03.000Z'),'value': 14 },
        { 'date': new Date('2020-03-16T16:32:03.000Z'),'value': 15 },
        { 'date': new Date('2020-03-23T16:32:03.000Z'),'value': 13 },
      ],
    };
     const expectedOutput = [
       { date: 'February 2020', billable: 42, trial: 14 },
       { date: 'March 2020', billable: 43, trial: 15 },
     ];
    const output = combineMetrics(input1, input2);
    expect(output).toEqual(expectedOutput);
  });
 });
