import nock from 'nock';

import { getStubPrometheusMetricsSeriesData } from '../../lib/prom/prom.test.data';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { scrape } from './scraper';

const prometheusNoData = { status: 'success', data: { resultType: 'series', result: [] } };

const linker = (route: string) => `https://example.com/${route}`;
const ctx: IContext = { ...createTestContext(), linkTo: linker };

describe(scrape, () => {
  let nockProm: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockProm = nock('https://example.com/prom');
  });

  afterEach(() => {
    nockProm.done();

    nock.cleanAll();
  });

  it('collect the data accordingly', async () => {
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

      const data = await scrape({
        pingdom: {},
        prometheus: {
          endpoint: ctx.app.prometheusEndpoint,
          password: ctx.app.prometheusPassword,
          username: ctx.app.prometheusUsername,
        },
      }, ctx.log);

      expect(data).toHaveProperty('applications');
      expect(data.applications).toHaveLength(1);
      expect(data.applications![0].metrics.length).toBeGreaterThan(1);
  });

  it('collect the data accordingly', async () => {
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

      const data = await scrape({
        pingdom: {},
        prometheus: {
          endpoint: ctx.app.prometheusEndpoint,
          password: ctx.app.prometheusPassword,
          username: ctx.app.prometheusUsername,
        },
      }, ctx.log);

      expect(data.applications).toBeUndefined();
      expect(data.organizations).toBeUndefined();
      expect(data.services).toBeUndefined();
  });
});
