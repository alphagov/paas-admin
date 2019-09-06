import moment from 'moment-timezone';
import React from 'react';
import {renderToString} from 'react-dom/server';

import CloudFoundryClient from '../../lib/cf';
import {
  numPointsOnSmallChart,

  prometheusTimeInterval,

  rdsSingleSeries,
  rdsSingleStats,

  timeOffsets,
} from '../../lib/metrics';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';
import { IBreadcrumb } from '../breadcrumbs';

import serviceMetricsTemplate from './service-metrics.njk';

import { ServiceMetricsComponent } from '../metrics';

export async function viewServiceMetrics(
  ctx: IContext, params: IParameters,
): Promise<IResponse> {

  let instantTime: Date = moment
    .tz('Europe/London')
    .subtract(3, 'minutes') // RDS metrics take time to percolate
    .toDate()
  ;
  let historicTime: Date = moment
    .tz('Europe/London')
    .subtract(3, 'minutes') // RDS metrics take time to percolate
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
        .subtract(3, 'minutes') // RDS metrics take time to percolate
        .toDate()
      ;
    }

    return {
      redirect: ctx.linkTo(
        'admin.organizations.spaces.services.metrics.view',
        {
          'organizationGUID': params.organizationGUID,
          'spaceGUID': params.spaceGUID,
          'serviceGUID': params.serviceGUID,
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

  const [userProvidedServices, space, organization] = await Promise.all([
    cf.userServices(params.spaceGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  const isUserProvidedService = userProvidedServices.some(s => s.metadata.guid === params.serviceGUID);

  const service = isUserProvidedService ?
    await cf.userServiceInstance(params.serviceGUID) :
  await cf.serviceInstance(params.serviceGUID);

  const servicePlan = !isUserProvidedService ? await cf.servicePlan(service.entity.service_plan_guid) : null;

  const summarisedService = {
    entity: service.entity,
    metadata: service.metadata,
    service_plan: {
      ...servicePlan,
      service: servicePlan ? await cf.service(servicePlan.entity.service_guid) : null,
    },
  };

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
    ) / 1000) / numPointsOnSmallChart,
  );

  const prom = new PromClient(
    ctx.app.prometheusAPI,
    ctx.token.accessToken,
    ctx.app.logger,
  );

  const serviceMetricsProps = {
    service: summarisedService,

    datePickerProps: {
      instantTime, historicTime, isOpen: open,
    },

    freeStorageSpaceSingleStatProps: {
      interval: 5, intervalUnit: 'mins',
      val: await prom.getValue(
        rdsSingleStats['rds-free-storage-space-aggregated-singlestat'](
          service.metadata.guid, promInterval,
        ),
        instantTime,
      ),
    },

    cpuUsageAggregatedSeriesProps: {
      data: await prom.getSeries(
        rdsSingleSeries['rds-cpu-usage-aggregated-series'](service.metadata.guid),
        timeStep, historicTime, instantTime,
      ),
    },
    freeStorageSpaceAggregatedSeriesProps: {
      data: await prom.getSeries(
        rdsSingleSeries['rds-free-storage-space-aggregated-series'](service.metadata.guid),
        timeStep, historicTime, instantTime,
      ),
    },
  };

  const serviceMetrics = renderToString(React.createElement(ServiceMetricsComponent, serviceMetricsProps));

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = [
    { text: 'Organisations', href: ctx.linkTo('admin.organizations') },
    {
      text: organization.entity.name ,
      href: ctx.linkTo('admin.organizations.view', {organizationGUID: organization.metadata.guid}),
    },
    {
      text: space.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.services.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    { text: summarisedService.entity.name },
  ];

  return {
    body: serviceMetricsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      space, organization,
      service: summarisedService,

      timeOffsets,

      times: {
        instantTime: moment.tz(instantTime, 'Europe/London').format(datetimeLocalFmt),
        historicTime: moment.tz(historicTime, 'Europe/London').format(datetimeLocalFmt),
      },

      breadcrumbs,

      serviceMetrics, serviceMetricsProps,
    }),
  };
}

export async function dataServiceMetrics(
  _ctx: IContext,
  _params: IParameters,
): Promise<IResponse> {
  return {
    body: JSON.stringify([
      ...Object.keys(rdsSingleStats),
      ...Object.keys(rdsSingleSeries),
    ]),
  };
}

export async function dataServiceMetricValues(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {

  const sourceID = params.serviceGUID;

  const historicTime = moment.tz(parseInt(params['start-time'], 10), 'Europe/London').toDate();
  const instantTime = moment.tz(parseInt(params['end-time'], 10), 'Europe/London').toDate();

  const timeStep = Math.ceil(
    (
      (instantTime.getTime() - historicTime.getTime()
    ) / 1000) / numPointsOnSmallChart,
  );

  const prom = new PromClient(
    ctx.app.prometheusAPI,
    ctx.token.accessToken,
    ctx.app.logger,
  );

  const metricKey = params.metric;

  if (rdsSingleStats[metricKey]) {
    const promInterval = prometheusTimeInterval(instantTime.getTime() - historicTime.getTime());

    const metricVal = await prom.getValue(
      rdsSingleStats[metricKey](sourceID, promInterval),
      instantTime,
    );

    return { body: JSON.stringify(metricVal) };
  }

  if (rdsSingleSeries[metricKey]) {
    const metricVal = await prom.getSeries(
      rdsSingleSeries[metricKey](sourceID),
      timeStep, historicTime, instantTime,
    );
    return { body: JSON.stringify(metricVal) };
  }

  throw new Error('No metric found');
}
