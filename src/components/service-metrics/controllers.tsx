/* eslint-disable no-case-declarations */
import * as cw from '@aws-sdk/client-cloudwatch-node';
import * as rg from '@aws-sdk/client-resource-groups-tagging-api-node';
import { Duration, format, formatISO, isBefore, isValid, sub } from 'date-fns';
import { mapValues, values } from 'lodash';
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
  SQSMetricDataGetter,
  sqsMetricNames,
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
  sqsMetrics,
} from './metrics';
import { getPeriod } from './utils';
import {
  IMetricProperties,
  MetricPage,
  UnsupportedServiceMetricsPage,
} from './views';

const PERSISTANCE_MESSAGE_370_DAYS = '370 days';

interface IRange {
  readonly period: Duration;
  readonly rangeStart: Date;
  readonly rangeStop: Date;
}

type RangeObject = {
  readonly day?: number;
  readonly hour?: number;
  readonly minute?: number;
  readonly month?: number;
  readonly second?: number;
  readonly year?: number;
};

type Range = RangeObject | string;

// check if user-provided string is a number
export function isNumeric(value: string): boolean {
  return /^\d+$/.test(value);
}

function isValidDateObject(obj: RangeObject): boolean {
  if (obj.month && (obj.month < 1 || obj.month > 12)) {
    return false;
  }

  if (obj.day && (obj.day < 1 || obj.day > 31)) {
    return false;
  }

  if (obj.hour && (obj.hour < 0 || obj.hour > 23)) {
    return false;
  }

  if (obj.minute && (obj.minute < 0 || obj.minute > 59)) {
    return false;
  }

  if (obj.second && (obj.second < 0 || obj.second > 59)) {
    return false;
  }

  return true;
}

export function objectToDate(obj: RangeObject): Date {
  const now = new Date();

  if (!isValidDateObject(obj)) {
    return now;
  }

  return new Date(
    obj.year || now.getFullYear(),
    obj.month ? obj.month - 1 : now.getMonth(),
    obj.day || now.getDate(),
    obj.hour !== undefined ? obj.hour : now.getHours(),
    obj.minute !== undefined ? obj.minute : now.getMinutes(),
    obj.second !== undefined ? obj.second : now.getSeconds(),
  );
}

export function parseRange(start: Range, stop: Range): IRange {
  const rawStart = typeof start === 'object' ? objectToDate(start) : new Date(start);
  const rawStop = typeof stop === 'object' ? objectToDate(stop) : new Date(stop);

  /* istanbul ignore next */
  const rangeStart = isValid(rawStart) ? rawStart : new Date();
  /* istanbul ignore next */
  const rangeStop = isValid(rawStop) ? rawStop : new Date();

  if (isBefore(rangeStart, sub(rangeStop, { weeks: 1, years: 1 }))) {
    throw new UserFriendlyError('Invalid time range provided. Cannot handle more than a year of metrics');
  }

  if (isBefore(rangeStop, sub(new Date(), { weeks: 1, years: 1 }))
    || isBefore(rangeStart, sub(new Date(), { weeks: 1, years: 1 }))) {
    throw new UserFriendlyError('Invalid time range provided. Cannot handle over a year old metrics');
  }

  if (isBefore(rangeStop, rangeStart)) {
    const rangeStart = sub(new Date(), { hours: 1 });
    const rangeStop = new Date();

    return {
      period: { seconds: 60 },
      rangeStart,
      rangeStop,
    };
  }

  const period = { seconds: getPeriod(rangeStart, rangeStop) };

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
  const rangeStop = new Date();
  /* eslint-disable sort-keys */
  const timeRanges: { readonly [key: string]: Date } = {
    '1h': sub(rangeStop, { hours: 1 }),
    '3h': sub(rangeStop, { hours: 3 }),
    '12h': sub(rangeStop, { hours: 12 }),
    '24h': sub(rangeStop, { hours: 24 }),
    '7d': sub(rangeStop, { days: 7 }),
    '30d': sub(rangeStop, { days: 30 }),
  };
  /* eslint-enable sort-keys */
  const rangeStart = timeRanges[params.offset] || timeRanges['24h'];

  return await Promise.resolve({
    redirect: ctx.linkTo('admin.organizations.spaces.services.metrics.view', {
      organizationGUID: params.organizationGUID,
      rangeStart: formatISO(rangeStart),
      rangeStop: formatISO(rangeStop),
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
        rangeStart: formatISO(sub(new Date(), { hours: 24 })),
        rangeStop: formatISO(new Date()),
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
    ${format(rangeStart, DATE_TIME)} and ${format(rangeStop, DATE_TIME)}`,
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
    rangeStart: rangeStart,
    rangeStop: rangeStop,
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
    case 'aws-sqs-queue':
      const sqsMetricSeries = await new SQSMetricDataGetter(
        new cw.CloudWatchClient({
          credentials: ctx.app.awsCredentials,
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: ctx.app.awsRegion,
        }),
      ).getData(
        sqsMetricNames,
        params.serviceGUID,
        period,
        rangeStart,
        rangeStop,
        servicePlan!.entity.name,
      );

      metrics = sqsMetrics(
        sqsMetricSeries,
        mapValues(sqsMetricSeries, s => s.map(summariseSerie)),
        downloadLink,
      );
      break;
    case 'cdn-route':
      const cloudFrontMetricSeries = await new CloudFrontMetricDataGetter(
        new cw.CloudWatchClient({
          credentials: ctx.app.awsCredentials,
          endpoint: ctx.app.awsCloudwatchEndpoint,
          region: 'us-east-1',
        }),
        new rg.ResourceGroupsTaggingAPIClient({
          credentials: ctx.app.awsCredentials,
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
          credentials: ctx.app.awsCredentials,
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
          credentials: ctx.app.awsCredentials,
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
        rangeStart: formatISO(sub(new Date(), { hours: 24 })),
        rangeStop: formatISO(new Date()),
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
    case 'aws-sqs-queue':
      const servicePlan = await cf.servicePlan(service.entity.service_plan_guid);
      const sqsMetricSeries = await new SQSMetricDataGetter(
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
        servicePlan.entity.name,
      );

      headers = ['Service', 'Time', 'Value'];
      contents = values(sqsMetricSeries[params.metric])
        .map(metric =>
          metric.metrics.map(series => [
            serviceLabel,
            formatISO(series.date),
            composeValue(series.value, params.units),
          ]),
        )
        .reduceRight((list, flatList) => [...flatList, ...list], []);
      break;
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
            formatISO(series.date),
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
            formatISO(series.date),
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
            metric.label || '',
            formatISO(series.date),
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
            /* istanbul ignore next */
            metric.label || '',
            formatISO(series.date),
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
