import moment from 'moment-timezone';
import React from 'react';
import {renderToString} from 'react-dom/server';

import CloudFoundryClient from '../../lib/cf';
import {
  appSingleSeries,
  appSingleStats,

  prometheusTimeInterval,
  timeOffsets,
} from '../../lib/metrics';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';
import { IBreadcrumb } from '../breadcrumbs';

import appMetricsTemplate from './app-metrics.njk';

import { AppMetricsComponent } from '../metrics';

const numPointsOnChart = 45;

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

  const promInterval = prometheusTimeInterval(instantTime.getTime() - historicTime.getTime());

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

  const appMetricsProps = {
    application,

    datePickerProps: {
      instantTime, historicTime, isOpen: open,
    },

    httpReliabilitySingleStatProps: {
      interval: 5, intervalUnit: 'mins',
      val: await prom.getValue(
        appSingleStats['app-http-reliability-aggregated-singlestat'](
          application.metadata.guid, promInterval,
        ),
        instantTime,
      ),
    },
    httpLatencySingleStatProps: {
      interval: 5, intervalUnit: 'mins',
      val: await prom.getValue(
        appSingleStats['app-http-latency-aggregated-singlestat'](
          application.metadata.guid, promInterval,
        ),
        instantTime,
      ),
    },

    httpCountAggregatedSeriesProps: {
      data: await prom.getSeries(
        appSingleSeries['app-http-count-aggregated-series'](application.metadata.guid),
        timeStep, historicTime, instantTime,
      ),
    },
    httpLatencyAggregatedSeriesProps: {
      data: await prom.getSeries(
        appSingleSeries['app-http-latency-aggregated-series'](application.metadata.guid),
        timeStep, historicTime, instantTime,
      ),
    },

    cpuUsageAggregatedSeriesProps: {
      data: await prom.getSeries(
        appSingleSeries['app-cpu-usage-aggregated-series'](application.metadata.guid),
        timeStep, historicTime, instantTime,
      ),
    },
    memoryUsageAggregatedSeriesProps: {
      data: await prom.getSeries(
        appSingleSeries['app-memory-usage-aggregated-series'](application.metadata.guid),
        timeStep, historicTime, instantTime,
      ),
    },
    diskUsageAggregatedSeriesProps: {
      data: await prom.getSeries(
        appSingleSeries['app-disk-usage-aggregated-series'](application.metadata.guid),
        timeStep, historicTime, instantTime,
      ),
    },
  };

  const appMetrics = renderToString(React.createElement(AppMetricsComponent, appMetricsProps));

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = [
    { text: 'Organisations', href: ctx.linkTo('admin.organizations') },
    {
      text: organization.entity.name ,
      href: ctx.linkTo('admin.organizations.view', {organizationGUID: organization.metadata.guid}),
    },
    {
      text: space.entity.name,
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

      breadcrumbs,

      appMetrics, appMetricsProps,
    }),
  };
}

export async function dataAppMetrics(
  _ctx: IContext,
  _params: IParameters,
): Promise<IResponse> {
  return {
    body: JSON.stringify([
      ...Object.keys(appSingleStats),
      ...Object.keys(appSingleSeries),
    ]),
  };
}

export async function dataAppMetricValues(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {

  const sourceID = params.applicationGUID;

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

  const metricKey = params.metric;

  if (appSingleStats[metricKey]) {
    const promInterval = prometheusTimeInterval(instantTime.getTime() - historicTime.getTime());

    const metricVal = await prom.getValue(
      appSingleStats[metricKey](sourceID, promInterval),
      instantTime,
    );

    return { body: JSON.stringify(metricVal) };
  }

  if (appSingleSeries[metricKey]) {
    const metricVal = await prom.getSeries(
      appSingleSeries[metricKey](sourceID),
      timeStep, historicTime, instantTime,
    );
    return { body: JSON.stringify(metricVal) };
  }

  throw new Error('No metric found');
}
