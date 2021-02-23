import nock from 'nock';

import { getStubPrometheusMetricsSeriesData } from '../../lib/prom/prom.test.data';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { scrape } from './scraper';

jest.setTimeout(30000);

const prometheusNoData = { status: 'success', data: { resultType: 'series', result: [] } };
const pingdomEndpoint = 'https://example.com/pingdom';

const linker = (route: string) => `https://example.com/${route}`;
const ctx: IContext = { ...createTestContext(), linkTo: linker };

describe(scrape, () => {
  let nockProm: nock.Scope;
  let nockPingdom: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockPingdom = nock(pingdomEndpoint);
    nockProm = nock(ctx.app.platformMetricsEndpoint);
  });

  afterEach(() => {
    nockProm.on('response', () => {
      nockProm.done();
    });
    nockPingdom.on('response', () => {
      nockPingdom.done();
    });

    nock.cleanAll();
  });

  it('collect the data accordingly', async () => {
    nockPingdom
      .get('/api/3.1/summary.average/12345')
      .query(true)
      .reply(200, { summary: { status: { totalup: 9999, totaldown: 1, totalunknown: 0 } } });

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
        pingdom: {
          checkID: '12345',
          endpoint: pingdomEndpoint,
          token: 'qwerty-123456',
        },
        prometheus: {
          endpoint: ctx.app.platformMetricsEndpoint,
          password: ctx.app.prometheusPassword,
          username: ctx.app.prometheusUsername,
        },
      }, ctx.log);

      expect(data).toHaveProperty('uptime');
      expect(data.uptime).toEqual(99.99);
      expect(data).toHaveProperty('applications');
      expect(data.applications).toHaveLength(1);
      expect(data.applications![0].metrics.length).toBeGreaterThan(1);
  });

  it('collect the data accordingly', async () => {
    nockPingdom
      .get('/api/3.1/summary.average/12345')
      .query(true)
      .reply(500);

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
        pingdom: {
          checkID: '12345',
          endpoint: pingdomEndpoint,
          token: 'qwerty-123456',
        },
        prometheus: {
          endpoint: ctx.app.platformMetricsEndpoint,
          password: ctx.app.prometheusPassword,
          username: ctx.app.prometheusUsername,
        },
      }, ctx.log);

      expect(data.applications).toBeUndefined();
      expect(data.organizations).toBeUndefined();
      expect(data.services).toBeUndefined();
      expect(data.uptime).toBeUndefined();
  });
});
