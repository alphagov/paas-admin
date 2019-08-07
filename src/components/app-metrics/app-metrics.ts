import axios, { AxiosResponse } from 'axios';
import moment from 'moment';
import { BaseLogger } from 'pino';

import {intercept} from '../../lib/axios-logger/axios';
import CloudFoundryClient from '../../lib/cf';
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

  const appGUID = params.applicationGUID;
  const instantTime = moment().toDate().getTime() / 1000;
  const historicTime = moment().subtract(3, 'hours').toDate().getTime() / 1000;
  const timeStep = 30;

  // tslint:disable:max-line-length
  const [
    httpReliability,
    latency,
  ] = await Promise.all([
    `100 * (sum (sum by (source_id) (sum_over_time(http_count{source_id="${appGUID}", status_code=~"[1-3].."}[24h])) or vector(0)) / sum (sum by (source_id) (sum_over_time(http_count{source_id="${appGUID}"}[24h]))) or vector(1))`,
    `sum(avg by (source_id) (avg_over_time(http_mean_ms{source_id="${appGUID}"}[24h])) or vector(0))`,
  ].map(q => {
    return request(
      `/api/v1/query`,
      {
        time: instantTime,
        query: q,
      },
      ctx.token.accessToken,
      ctx.app.logger,
    ).then(
      r => r.data.data.result[0].value[1],
    );
  }));
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
    `sum (http_count{source_id="${appGUID}", status_code=~"1.."} or vector(0))`,
    `sum (http_count{source_id="${appGUID}", status_code=~"2.."} or vector(0))`,
    `sum (http_count{source_id="${appGUID}", status_code=~"3.."} or vector(0))`,
    `sum (http_count{source_id="${appGUID}", status_code=~"4.."} or vector(0))`,
    `sum (http_count{source_id="${appGUID}", status_code=~"5.."} or vector(0))`,
    `sum (http_count{source_id="${appGUID}"} or vector(0))`,
    `sum (http_mean_ms{source_id="${appGUID}", status_code=~"1.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${appGUID}", status_code=~"2.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${appGUID}", status_code=~"3.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${appGUID}", status_code=~"4.."} or vector(0))`,
    `sum (http_mean_ms{source_id="${appGUID}", status_code=~"5.."} or vector(0))`,
    `sum (avg (http_mean_ms{source_id="${appGUID}"}) or vector(0))`,
    `100 * avg by (source_id) (cpu{source_id="${appGUID}"})`,
    `100 * avg by (source_id) (memory{source_id="${appGUID}"} / memory_quota{source_id="${appGUID}"})`,
    `100 * avg by (source_id) (disk{source_id="${appGUID}"} / disk_quota{source_id="${appGUID}"})`,
  ].map(q => {
    return request(
      `/api/v1/query_range`,
      {
        start: historicTime, end: instantTime, step: timeStep,
        query: q,
      },
      ctx.token.accessToken,
      ctx.app.logger,
    ).then(
      response => response.data.data.result[0].values,
    );
  }));

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

async function request(
  path: string,
  params: {readonly [key: string]: string | number},
  token: string,
  logger: BaseLogger,
): Promise<AxiosResponse> {

  const instance = axios.create();
  intercept(instance, 'cf', logger);

  const method = 'GET';
  const baseURL = 'https://metric-store.tlwr.dev.cloudpipelineapps.digital';
  const response = await instance.request({
    method, params, baseURL,
    url: path,
    validateStatus: (status: number) => status > 0 && status < 501,
    timeout: 2500,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status < 200 || response.status >= 300) {
    let msg = `cf: ${method} ${baseURL}/${path} failed with status ${response.status}`;
    if (typeof response.data === 'object') {
      msg = `${msg} and data ${JSON.stringify(response.data)}`;
    }

    const err = new Error(msg);
    /* istanbul ignore next */
    if (typeof response.data === 'object' && response.data.error_code) {
      // err.code = response.data.error_code;
    }

    throw err;
  }

  return response;
}
