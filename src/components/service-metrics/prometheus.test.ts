import moment from 'moment';
import nock from 'nock';
import pino from 'pino';

import PromClient from '../../lib/prom';
import { getPrometheusMetricGraphData } from './prometheus';

const config = {
  apiEndpoint: 'https://example.com/prom',
  username: 'jeff',
  password: 'J3ff3rs0n!',
  logger: pino({level: 'silent'}),
};

describe('service-metrics-prometheus', () => {
  let nockPrometheus: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockPrometheus = nock(config.apiEndpoint);
  });

  afterEach(() => {
    nockPrometheus.done();

    nock.cleanAll();
  });

  it('should getPrometheusMetricGraphData successfully', async () => {
    nockPrometheus
      .get(/api.v1.query_range\??/).times(8).reply(200, {
        status: 'success',
        data: {
          result: [{
            metric: {
              instance: '001',
            },
            values: [
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
            ],
        }],
      },
    });

    const client = new PromClient(config.apiEndpoint, config.username, config.password, config.logger);
    const data = await getPrometheusMetricGraphData(
      client, 'elasticsearch', 'serviceGUID1', moment.duration(5, 'minutes'), moment().subtract(1, 'day'), moment(),
    );

    expect(data).toBeDefined();
  });

  it('should return nothing due to prometheus returning an empty array', async () => {
    nockPrometheus
      .get(/api.v1.query_range\??/).times(8).reply(200, {
        status: 'success',
        data: {
          result: [],
      },
    });

    const client = new PromClient(config.apiEndpoint, config.username, config.password, config.logger);
    const data = await getPrometheusMetricGraphData(
      client, 'elasticsearch', 'serviceGUID2', moment.duration(5, 'minutes'), moment().subtract(1, 'day'), moment(),
    );

    expect(data).not.toBeNull();
    expect(data!.graphs.length).toBe(0);
  });

  it('should return nothing due to unsupported service', async () => {
    const client = new PromClient(config.apiEndpoint, config.username, config.password, config.logger);
    const data = await getPrometheusMetricGraphData(
      client, 'unknown-service', 'serviceGUID3', moment.duration(5, 'minutes'), moment().subtract(1, 'day'), moment(),
    );

    expect(data).toBeNull();
  });
});
