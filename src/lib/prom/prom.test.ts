import { getUnixTime, sub } from 'date-fns';
import nock from 'nock';
import pino from 'pino';

import PromClient from '.';

const config = {
  apiEndpoint: 'https://example.com/prom',
  logger: pino({ level: 'silent' }),
  password: 'J3ff3rs0n!',
  username: 'jeff',
};

describe('lib/prom test suite', () => {
  let nockPrometheus: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockPrometheus = nock(config.apiEndpoint);
  });

  afterEach(() => {
    nockPrometheus.done();

    nock.cleanAll();
  });

  it('should throw error when prometheus responds with 404', async () => {
    nockPrometheus.get(/api.v1.query\??/).reply(404, { error: 'not found' });

    const client = new PromClient(config);
    await expect(
      client.getValue('http_response_2xx', new Date()),
    ).rejects.toThrowError(/failed with status 404/);
  });

  it('should throw error when prometheus responds with 404 no body', async () => {
    nockPrometheus.get(/api.v1.query\??/).reply(404);

    const client = new PromClient(config);
    await expect(
      client.getValue('http_response_2xx', new Date()),
    ).rejects.toThrowError(/failed with status 404/);
  });

  it('should getValue successfully', async () => {
    nockPrometheus.get(/api.v1.query\??/).reply(200, {
      data: {
        result: [
          {
            value: [
              (new Date())
                .getTime() / 1000,
              `${Math.random() * 100}`,
            ],
          },
        ],
      },
      status: 'success',
    });

    const client = new PromClient({
      ...config,
      timeout: 1000,
    });
    const values = await client.getValue('http_response_2xx', new Date());

    expect(values).toBeDefined();
    expect(values!.length).toBeGreaterThan(0);
    expect(values![0]).toBeGreaterThan(0);
  });

  it('should fail to getValue when invalid query has been provided', async () => {
    nockPrometheus.get(/api.v1.query\??/).reply(200, {
      data: { result: [] },
      status: 'success',
    });

    const client = new PromClient(config);
    const value = await client.getValue('http_response_5xx', new Date());

    expect(value).toBeUndefined();
  });

  it('should getSeries successfully', async () => {
    const now = new Date();
    nockPrometheus.get(/api.v1.query_range\??/).reply(200, {
      data: {
        result: [
          {
            metric: {
              instance: '001',
            },
            values: [
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
            ],
          },
          {
            metric: {
              instance: '002',
            },
            values: [
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
              [
                getUnixTime(now),
                `${Math.random() * 100}`,
              ],
            ],
          },
        ],
      },
      status: 'success',
    });

    const client = new PromClient(config);
    const series = await client.getSeries(
      'http_response_2xx',
      10,
      sub(new Date(), { days: 1 }),
      new Date(),
    );

    expect(series).toBeDefined();
    expect(series!.length).toEqual(2);
    expect(series![0].metrics.length).toEqual(4);
    expect(getUnixTime(series![0].metrics[0].date)).toEqual(getUnixTime(now));
    expect(getUnixTime(series![0].metrics[1].date)).toEqual(getUnixTime(now));
  });

  it('should fail to getSeries when invalid query has been provided', async () => {
    nockPrometheus.get(/api.v1.query_range\??/).reply(200, {
      data: {
        result: [],
      },
      status: 'success',
    });

    const client = new PromClient(config);
    const series = await client.getSeries(
      'http_response_5xx',
      10,
      sub(new Date(), { days: 1 }),
      new Date(),
    );

    expect(series).toBeUndefined();
  });
});
