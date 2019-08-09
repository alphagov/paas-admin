import moment from 'moment';

import CloudFoundryClient from '../../lib/cf';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import appMetricsTemplate from './app-metrics.njk';

export async function viewAppMetrics(
  ctx: IContext, params: IParameters,
): Promise<IResponse> {

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

  return {
    body: appMetricsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      application, space, organization,
    }),
  };
}

export async function dataAppMetrics(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {

  const sourceID = params.applicationGUID;
  const instantTime = moment().toDate().getTime();
  const historicTime = moment().subtract(3, 'hours').toDate().getTime();
  const timeStep = 30;

  const prom = new PromClient(
    'https://metric-store.tlwr.dev.cloudpipelineapps.digital',
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
