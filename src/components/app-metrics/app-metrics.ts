import moment from 'moment-timezone';

import CloudFoundryClient from '../../lib/cf';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import appMetricsTemplate from './app-metrics.njk';

export async function viewAppMetrics(
  ctx: IContext, params: IParameters,
): Promise<IResponse> {

  const datetimeLocalFmt = 'YYYY-MM-DDTHH:mm';

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [application, space, organization] = await Promise.all([
    cf.application(params.applicationGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  let instantTime: Date = moment.tz('Europe/London').toDate();
  let historicTime: Date = moment.tz('Europe/London').subtract(3, 'hours').toDate();

  if (typeof params['start-time'] !== 'undefined' &&
      typeof params['end-time'] !== 'undefined'
  ) {
    historicTime = moment.tz(params['start-time'], datetimeLocalFmt, 'Europe/London').toDate();
    instantTime = moment.tz(params['end-time'], datetimeLocalFmt, 'Europe/London').toDate();

    if (instantTime <= historicTime) {
      throw new Error('instantTime must come after historicTime');
    }
  }

  return {
    body: appMetricsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      application, space, organization,

      times: {
        instantTime: moment.tz(instantTime, 'Europe/London').format(datetimeLocalFmt),
        historicTime: moment.tz(historicTime, 'Europe/London').format(datetimeLocalFmt),
      },
    }),
  };
}

export async function dataAppMetrics(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {

  const sourceID = params.applicationGUID;
  const numPointsOnChart = 150;

  const historicTime = moment.tz(parseInt(params['start-time'], 10), 'Europe/London').toDate();
  const instantTime = moment.tz(parseInt(params['end-time'], 10), 'Europe/London').toDate();

  const timeStep = Math.ceil(
    (
      (instantTime.getTime() - historicTime.getTime()
    ) / 1000) / numPointsOnChart,
  );

  const prom = new PromClient(
    ctx.app.prometheusAPI,
    ctx.token.accessToken,
    ctx.app.logger,
  );

  // tslint:disable:max-line-length
  const [
    httpReliability,
    latency,
  ] = await Promise.all([
    `100 * (sum (sum by (source_id) (sum_over_time(http_count{source_id="${sourceID}", status_code=~"[1-3].."}[24h])) or vector(0)) / sum (sum by (source_id) (sum_over_time(http_count{source_id="${sourceID}"}[24h]))) or vector(1))`,
    `sum(avg by (source_id) (avg_over_time(http_mean_ms{source_id="${sourceID}"}[24h])) or vector(0))`,
  ].map(q => prom.getValue(q, instantTime)));
  // tslint:enable:max-line-length

  const [
    http1xxCountSeries, http2xxCountSeries, http3xxCountSeries,
    http4xxCountSeries, http5xxCountSeries,
    httpTotalCountSeries,
    http1xxLatencySeries, http2xxLatencySeries, http3xxLatencySeries,
    http4xxLatencySeries, http5xxLatencySeries,
    httpAverageLatencySeries,
    cpuSeries, memorySeries, diskSeries,
  ] = await Promise.all([
    `sum (http_count{source_id="${sourceID}", status_code=~"1.."} or vector(0))`,
    `sum (http_count{source_id="${sourceID}", status_code=~"2.."} or vector(0))`,
    `sum (http_count{source_id="${sourceID}", status_code=~"3.."} or vector(0))`,
    `sum (http_count{source_id="${sourceID}", status_code=~"4.."} or vector(0))`,
    `sum (http_count{source_id="${sourceID}", status_code=~"5.."} or vector(0))`,
    `sum (http_count{source_id="${sourceID}"} or vector(0))`,
    `sum (http_mean_ms{source_id="${sourceID}", status_code=~"1.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${sourceID}", status_code=~"2.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${sourceID}", status_code=~"3.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${sourceID}", status_code=~"4.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${sourceID}", status_code=~"5.."} or vector(0))`,
    `sum (avg (http_mean_ms{source_id="${sourceID}"}) or vector(0))`,
    `100 * avg by (source_id) (cpu{source_id="${sourceID}"})`,
    `100 * avg by (source_id) (memory{source_id="${sourceID}"} / memory_quota{source_id="${sourceID}"})`,
    `100 * avg by (source_id) (disk{source_id="${sourceID}"} / disk_quota{source_id="${sourceID}"})`,
  ].map(q => prom.getSeries(q, timeStep, historicTime, instantTime)));

  return {
    body: JSON.stringify({
      values: {
        httpReliability, latency,
      },
      series: {
        http1xxCountSeries, http2xxCountSeries, http3xxCountSeries,
        http4xxCountSeries, http5xxCountSeries,
        httpTotalCountSeries,
        http1xxLatencySeries, http2xxLatencySeries, http3xxLatencySeries,
        http4xxLatencySeries, http5xxLatencySeries,
        httpAverageLatencySeries,
        cpuSeries, memorySeries, diskSeries,
      },
    }),
  };
}
