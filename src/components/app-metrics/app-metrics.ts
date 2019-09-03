import moment from 'moment-timezone';

import CloudFoundryClient from '../../lib/cf';
import { prometheusTimeInterval, timeOffsets } from '../../lib/metrics';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';
import { IBreadcrumb } from '../breadcrumbs';

import {
  appCPUUsageAggregatedSeries,
  appDiskUsageAggregatedSeries,

  appHTTPCountAggregatedSeries,
  appHTTPCountSegmentedSeries,

  appHTTPLatencyAggregatedSeries,
  appHTTPLatencySegmentedSeries,

  appHTTPLatencySingleStat,
  appHTTPReliabilitySingleStat,

  appMemoryUsageAggregatedSeries,
} from '../metrics';

import appMetricsTemplate from './app-metrics.njk';

export async function viewAppMetrics(
  ctx: IContext, params: IParameters,
): Promise<IResponse> {

  let instantTime: Date = moment
    .tz('Europe/London')
    .toDate()
  ;
  let historicTime: Date = moment
    .tz('Europe/London')
    .subtract(1, 'hours')
    .toDate()
  ;

  const datetimeLocalFmt = 'YYYY-MM-DDTHH:mm';

  let open: boolean = false;
  if (typeof params.open !== 'undefined') {
    open = params.open === 'false' ? false : true;
  }

  if (typeof params['nice-offset'] !== 'undefined') {
    const niceOffset = timeOffsets[params['nice-offset']];

    if (typeof niceOffset !== 'undefined') {
      historicTime = moment
        .tz('Europe/London')
        .subtract(niceOffset, 'seconds')
        .toDate()
      ;
    }

    return {
      redirect: ctx.linkTo(
        'admin.organizations.spaces.applications.metrics.view',
        {
          'organizationGUID': params.organizationGUID,
          'spaceGUID': params.spaceGUID,
          'applicationGUID': params.applicationGUID,
          'start-time': moment
            .tz(historicTime, 'Europe/London')
            .format(datetimeLocalFmt)
          ,
          'end-time': moment
            .tz(instantTime, 'Europe/London')
            .format(datetimeLocalFmt)
          ,
          'open': open,
        },
      ),
    };
  }

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

  if (typeof params['start-time'] !== 'undefined' &&
      typeof params['end-time'] !== 'undefined'
  ) {
    historicTime = moment.tz(params['start-time'], datetimeLocalFmt, 'Europe/London').toDate();
    instantTime = moment.tz(params['end-time'], datetimeLocalFmt, 'Europe/London').toDate();

    if (instantTime <= historicTime) {
      throw new Error('instantTime must come after historicTime');
    }
  }

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = [
    { text: 'Organisations', href: ctx.linkTo('admin.organizations') },
    {
      text: organization.entity.name ,
      href: ctx.linkTo('admin.organizations.view', {organizationGUID: organization.metadata.guid}),
    },
    { text: space.entity.name },
    {
      text: 'Applications',
      href: ctx.linkTo('admin.organizations.spaces.applications.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    { text: application.entity.name },
  ];

  return {
    body: appMetricsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      application, space, organization,

      timeOffsets,

      times: {
        instantTime: moment.tz(instantTime, 'Europe/London').format(datetimeLocalFmt),
        historicTime: moment.tz(historicTime, 'Europe/London').format(datetimeLocalFmt),
      },

      open,
      breadcrumbs,
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

  const promInterval = prometheusTimeInterval(instantTime.getTime() - historicTime.getTime());

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
    appHTTPReliabilitySingleStat(sourceID, promInterval),
    appHTTPLatencySingleStat(sourceID, promInterval),
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
    appHTTPCountSegmentedSeries(sourceID, 1),
    appHTTPCountSegmentedSeries(sourceID, 2),
    appHTTPCountSegmentedSeries(sourceID, 3),
    appHTTPCountSegmentedSeries(sourceID, 4),
    appHTTPCountSegmentedSeries(sourceID, 5),
    appHTTPCountAggregatedSeries(sourceID),

    appHTTPLatencySegmentedSeries(sourceID, 1),
    appHTTPLatencySegmentedSeries(sourceID, 2),
    appHTTPLatencySegmentedSeries(sourceID, 3),
    appHTTPLatencySegmentedSeries(sourceID, 4),
    appHTTPLatencySegmentedSeries(sourceID, 5),
    appHTTPLatencyAggregatedSeries(sourceID),

    appCPUUsageAggregatedSeries(sourceID),
    appMemoryUsageAggregatedSeries(sourceID),
    appDiskUsageAggregatedSeries(sourceID),
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
