/* eslint-disable no-case-declarations */
import * as cw from '@aws-sdk/client-cloudwatch-node';
import * as rg from '@aws-sdk/client-resource-groups-tagging-api-node';
import { mapValues, values } from 'lodash';
import moment from 'moment';
import React from 'react';

import { bytesConvert, DATE_TIME, Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import {
  CloudFrontMetricDataGetter,
  cloudfrontMetricNames,
  ElastiCacheMetricDataGetter,
  elasticacheMetricNames,
  ElasticsearchMetricDataGetter,
  elasticsearchMetricNames,
  RDSMetricDataGetter,
  rdsMetricNames,
} from '../../lib/metric-data-getters';
import roundDown from '../../lib/moment/round';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { fromOrg } from '../breadcrumbs';
import { summariseSerie } from '../charts/line-graph';
import { UserFriendlyError } from '../errors';

import {
  cloudFrontMetrics,
  elastiCacheMetrics,
  elasticSearchMetrics,
  rdsMetrics,
} from './metrics';
import { getPeriod } from './utils';
import {
  IMetricProperties,
  MetricPage,
  UnsupportedServiceMetricsPage,
} from './views';

const PERSISTANCE_MESSAGE_370_DAYS = '370 days';

interface IRange {
  readonly period: moment.Duration;
  readonly rangeStart: moment.Moment;
  readonly rangeStop: moment.Moment;
}

// check if user-provided string is a number
export function isNumeric(value: any) {
  return /^\d+$/.test(value);
}

export function sanitiseMomentInput(date: moment.MomentInputObject): moment.MomentInputObject {
  return {
    // if users enter something other than a number, return current date-time value
    day: isNumeric(date.day) ? date.day : moment().date(),
    hour: isNumeric(date.hour) ? date.hour : moment().hour(),
    minute: isNumeric(date.minute) ? date.minute : moment().minute(),
    month: isNumeric(date.month) ? date.month - 1 : moment().month(),
    year: isNumeric(date.year) ? date.year : moment().year(),
  };
}

export function parseRange(start: string | moment.MomentInputObject, stop: string | moment.MomentInputObject): IRange {
  let rangeStart = typeof start === 'object' ? moment(sanitiseMomentInput(start)).isValid() ? 
    moment(sanitiseMomentInput(start)) : moment() : moment(start);
  let rangeStop = typeof stop === 'object' ? moment(sanitiseMomentInput(stop)).isValid() ? 
    moment(sanitiseMomentInput(stop)) : moment() : moment(stop);

  if (
    rangeStart.isBefore(
      rangeStop
        .clone()
        .subtract(1, 'year')
        .subtract(1, 'week'),
    )
  ) {
    throw new UserFriendlyError(
      'Invalid time range provided. Cannot handle more than a year of metrics',
    );
  }

  if (
    rangeStop.isBefore(
      moment()
        .subtract(1, 'years')
        .subtract(1, 'week'),
    ) ||
    rangeStart.isBefore(
      moment()
        .subtract(1, 'years')
        .subtract(1, 'week'),
    )
  ) {
    throw new UserFriendlyError(
      'Invalid time range provided. Cannot handle over a year old metrics',
    );
  }

  if (rangeStop.isBefore(rangeStart)) {
    rangeStart = moment().subtract(1,'hour');
    rangeStop = moment();
  }

  const period = moment.duration(getPeriod(rangeStart, rangeStop), 'seconds');

  return {
    period,
    rangeStart: roundDown(rangeStart, period),
    rangeStop: roundDown(rangeStop, period),
  };
}

export function composeValue(value: number, units?: string): string {
  const safeValue = isNaN(value) ? 0 : value;

  switch (units) {
    case 'Bytes':
      const bytes = bytesConvert(safeValue);

      return `${bytes.value}${bytes.short}`;
    case 'Percent':
      return `${safeValue.toFixed(2)}%`;
  }

  return `${safeValue.toFixed(2)}`;
}

export async function resolveServiceMetrics(ctx: IContext, params: IParameters): Promise<IResponse> {
  const rangeStop = moment();
  /* eslint-disable sort-keys */
  const timeRanges: { readonly [key: string]: moment.Moment } = {
    '1h': rangeStop.clone().subtract(1, 'hour'),
    '3h': rangeStop.clone().subtract(3, 'hours'),
    '12h': rangeStop.clone().subtract(12, 'hours'),
    '24h': rangeStop.clone().subtract(24, 'hours'),
    '7d': rangeStop.clone().subtract(7, 'days'),
    '30d': rangeStop.clone().subtract(30, 'days'),
  };
  /* eslint-enable sort-keys */
  const rangeStart = timeRanges[params.offset] || timeRanges['24h'];

  return await Promise.resolve({
    redirect: ctx.linkTo('admin.organizations.spaces.services.metrics.view', {
      organizationGUID: params.organizationGUID,
      rangeStart: rangeStart.format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: rangeStop.format('YYYY-MM-DD[T]HH:mm'),
      serviceGUID: params.serviceGUID,
      spaceGUID: params.spaceGUID,
    }),
    status: 302,
  });
}

export async function viewServiceMetrics(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  if (!params.rangeStart || !params.rangeStop) {
    return {
      redirect: ctx.linkTo('admin.organizations.spaces.services.metrics.view', {
        organizationGUID: params.organizationGUID,
        rangeStart: moment()
          .subtract(24, 'hours')
          .format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: params.serviceGUID,
        spaceGUID: params.spaceGUID,
      }),
      status: 302,
    };
  }

  const { rangeStart, rangeStop, period } = parseRange(
    params.rangeStart,
    params.rangeStop,
  );

  const [userProvidedServices, space, organization] = await Promise.all([
    cf.userServices(params.spaceGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  const isUserProvidedService = userProvidedServices.some(
    s => s.metadata.guid === params.serviceGUID,
  );

  const service = isUserProvidedService
    ? await cf.userServiceInstance(params.serviceGUID)
    : await cf.serviceInstance(params.serviceGUID);

  const servicePlan = !isUserProvidedService
    ? await cf.servicePlan(service.entity.service_plan_guid)
    : undefined;

  const summarisedService = {
    entity: service.entity,
    metadata: service.metadata,
    service: servicePlan
      ? await cf.service(servicePlan.entity.service_guid)
      : undefined,
    service_plan: servicePlan,
  };

  const serviceLabel = isUserProvidedService
    ? 'User Provided Service'
    : (await cf.service(service.entity.service_guid)).entity.label;

  const template = new Template(
    ctx.viewContext,
    `Service ${service.entity.name} Metrics between 
    ${moment(rangeStart).format(DATE_TIME)} and ${moment(rangeStop).format(DATE_TIME)}`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.spaces.services.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
      text: space.entity.name,
    },
    { text: service.entity.name },
  ]);

  const defaultTemplateParams = {
    csrf: ctx.viewContext.csrf,
    linkTo: ctx.linkTo,
    organizationGUID: organization.metadata.guid,
    period,
    rangeStart: rangeStart.toDate(),
    rangeStop: rangeStop.toDate(),
    routePartOf: ctx.routePartOf,
    service: summarisedService,
    serviceLabel,
    spaceGUID: space.metadata.guid,
  };

  const downloadLink = ctx.linkTo(
    'admin.organizations.spaces.services.metrics.download',
    {
      organizationGUID: organization.metadata.guid,
      rangeStart,
      rangeStop,
      serviceGUID: service.metadata.guid,
      spaceGUID: space.metadata.guid,
    },
  );
  let metrics: ReadonlyArray<IMetricProperties>;
  let persistancePeriod: string | undefined;

  switch (serviceLabel) {
    case 'cdn-route':
      const cloudFrontMetricSeries = await new CloudFrontMetricDataGetter(
        new cw.CloudWatchClient({
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: 'us-east-1',
        }),
        new rg.ResourceGroupsTaggingAPIClient({
          endpoint: ctx.app.awsResourceTaggingAPIEndpoint,
          region: 'us-east-1',
        }),
      ).getData(
        cloudfrontMetricNames,
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      metrics = cloudFrontMetrics(
        cloudFrontMetricSeries,
        mapValues(cloudFrontMetricSeries, s => s.map(summariseSerie)),
        downloadLink,
      );
      break;
    case 'postgres':
    case 'mysql':
      const rdsMetricSeries = await new RDSMetricDataGetter(
        new cw.CloudWatchClient({
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: ctx.app.awsRegion,
        }),
      ).getData(
        rdsMetricNames,
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      metrics = rdsMetrics(
        rdsMetricSeries,
        mapValues(rdsMetricSeries, s => s.map(summariseSerie)),
        downloadLink,
      );
      break;
    case 'redis':
      const elastiCacheMetricSeries = await new ElastiCacheMetricDataGetter(
        new cw.CloudWatchClient({
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: ctx.app.awsRegion,
        }),
      ).getData(
        elasticacheMetricNames,
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      metrics = elastiCacheMetrics(
        elastiCacheMetricSeries,
        mapValues(elastiCacheMetricSeries, s => s.map(summariseSerie)),
        downloadLink,
      );
      break;
    case 'elasticsearch':
      const elasticSearchMetricSeries = await new ElasticsearchMetricDataGetter(
        new PromClient(
          ctx.app.prometheusEndpoint,
          ctx.app.prometheusUsername,
          ctx.app.prometheusPassword,
          ctx.app.logger,
        ),
      ).getData(
        elasticsearchMetricNames,
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      persistancePeriod = PERSISTANCE_MESSAGE_370_DAYS;
      metrics = elasticSearchMetrics(
        elasticSearchMetricSeries,
        mapValues(elasticSearchMetricSeries, s => s.map(summariseSerie)),
        downloadLink,
      );
      break;
    default:
      return {
        body: template.render(
          <UnsupportedServiceMetricsPage {...defaultTemplateParams} />,
        ),
      };
  }

  return {
    body: template.render(
      <MetricPage
        {...defaultTemplateParams}
        metrics={metrics}
        persistancePeriod={persistancePeriod}
      />,
    ),
  };
}

export async function downloadServiceMetrics(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  if (
    !params.rangeStart ||
    !params.rangeStop ||
    !params.metric ||
    !params.units
  ) {
    return {
      redirect: ctx.linkTo('admin.organizations.spaces.services.metrics.view', {
        organizationGUID: params.organizationGUID,
        rangeStart: moment()
          .subtract(24, 'hours')
          .format('YYYY-MM-DD[T]HH:mm'),
        rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
        serviceGUID: params.serviceGUID,
        spaceGUID: params.spaceGUID,
      }),
      status: 302,
    };
  }

  const { rangeStart, rangeStop, period } = parseRange(
    params.rangeStart,
    params.rangeStop,
  );

  const userProvidedServices = await cf.userServices(params.spaceGUID);

  const isUserProvidedService = userProvidedServices.some(
    s => s.metadata.guid === params.serviceGUID,
  );

  const service = isUserProvidedService
    ? await cf.userServiceInstance(params.serviceGUID)
    : await cf.serviceInstance(params.serviceGUID);

  const serviceLabel = isUserProvidedService
    ? 'User Provided Service'
    : (await cf.service(service.entity.service_guid)).entity.label;

  const name = `${serviceLabel}-metrics-${params.metric}-${params.rangeStart}-${params.rangeStop}.csv`;

  let headers: ReadonlyArray<string>;
  let contents: ReadonlyArray<ReadonlyArray<string>>;

  switch (serviceLabel) {
    case 'cdn-route':
      const cloudfrontMetricSeries = await new CloudFrontMetricDataGetter(
        new cw.CloudWatchClient({
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: 'us-east-1',
        }),
        new rg.ResourceGroupsTaggingAPIClient({
          endpoint: ctx.app.awsResourceTaggingAPIEndpoint,
          region: 'us-east-1',
        }),
      ).getData(
        [params.metric],
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      headers = ['Service', 'Time', 'Value'];
      contents = values(cloudfrontMetricSeries[params.metric])
        .map(metric =>
          metric.metrics.map(series => [
            serviceLabel,
            moment(series.date).format('YYYY-MM-DD[T]HH:mm'),
            composeValue(series.value, params.units),
          ]),
        )
        .reduceRight((list, flatList) => [...flatList, ...list], []);
      break;
    case 'postgres':
    case 'mysql':
      const rdsMetricSeries = await new RDSMetricDataGetter(
        new cw.CloudWatchClient({
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: ctx.app.awsRegion,
        }),
      ).getData(
        [params.metric],
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      headers = ['Service', 'Time', 'Value'];
      contents = values(rdsMetricSeries[params.metric])
        .map(metric =>
          metric.metrics.map(series => [
            serviceLabel,
            moment(series.date).format('YYYY-MM-DD[T]HH:mm'),
            composeValue(series.value, params.units),
          ]),
        )
        .reduceRight((list, flatList) => [...flatList, ...list], []);
      break;
    case 'redis':
      const elasticacheMetricSeries = await new ElastiCacheMetricDataGetter(
        new cw.CloudWatchClient({
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: ctx.app.awsRegion,
        }),
      ).getData(
        [params.metric],
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      headers = ['Service', 'Instance', 'Time', 'Value'];
      contents = values(elasticacheMetricSeries[params.metric])
        .map(metric =>
          metric.metrics.map(series => [
            serviceLabel,
            metric.label,
            moment(series.date).format('YYYY-MM-DD[T]HH:mm'),
            composeValue(series.value, params.units),
          ]),
        )
        .reduceRight((list, flatList) => [...flatList, ...list], []);
      break;
    case 'elasticsearch':
      const elasticsearchMetricSeries = await new ElasticsearchMetricDataGetter(
        new PromClient(
          ctx.app.prometheusEndpoint,
          ctx.app.prometheusUsername,
          ctx.app.prometheusPassword,
          ctx.app.logger,
        ),
      ).getData(
        [params.metric],
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
      );

      headers = ['Service', 'Instance', 'Time', 'Value'];
      contents = values(elasticsearchMetricSeries[params.metric])
        .map(metric =>
          metric.metrics.map(series => [
            serviceLabel,
            metric.label,
            moment(series.date).format('YYYY-MM-DD[T]HH:mm'),
            composeValue(series.value, params.units),
          ]),
        )
        .reduceRight((list, flatList) => [...flatList, ...list], []);
      break;
    default:
      throw new Error(`Unrecognised service label ${serviceLabel}`);
  }

  if (!contents.length) {
    throw new Error(`Did not get metric ${params.metric} for ${serviceLabel}`);
  }

  const csvData = [headers, ...contents];

  return {
    download: {
      data: csvData.map(line => line.join(',')).join('\n'),
      name,
    },
    mimeType: 'text/csv',
  };
}
