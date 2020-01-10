import * as cw from '@aws-sdk/client-cloudwatch-node';
import * as rg from '@aws-sdk/client-resource-groups-tagging-api-node';

import { mapValues } from 'lodash';
import moment from 'moment';
import CloudFoundryClient from '../../lib/cf';
import {
  CloudFrontMetricDataGetter,
  cloudfrontMetricNames,

  ElastiCacheMetricDataGetter,
  elasticacheMetricNames,

  RDSMetricDataGetter,
  rdsMetricNames,
} from '../../lib/metric-data-getters';
import roundDown from '../../lib/moment/round';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import { fromOrg, IBreadcrumb } from '../breadcrumbs';
import { drawLineGraph, summariseSerie } from '../charts/line-graph';
import { UserFriendlyError } from '../errors';
import cloudfrontMetricsTemplate from './cloudfront-service-metrics-csv.njk';
import cloudfrontServiceMetrics from './cloudfront-service-metrics.njk';
import elasticacheMetricsTemplate from './elasticache-service-metrics-csv.njk';
import elasticacheServiceMetricsTemplate from './elasticache-service-metrics.njk';
import rdsMetricsTemplate from './rds-service-metrics-csv.njk';
import rdsServiceMetricsTemplate from './rds-service-metrics.njk';
import unsupportedServiceMetricsTemplate from './unsupported-service-metrics.njk';
import { getPeriod } from './utils';

interface IRange {
  readonly period: moment.Duration;
  readonly rangeStart: moment.Moment;
  readonly rangeStop: moment.Moment;
}

export async function resolveServiceMetrics(ctx: IContext, params: IParameters): Promise<IResponse> {
  const rangeStop = moment();
  const timeRanges: {[key: string]: moment.Moment} = {
    '1h': rangeStop.clone().subtract(1, 'hour'),
    '3h': rangeStop.clone().subtract(3, 'hours'),
    '12h': rangeStop.clone().subtract(12, 'hours'),
    '24h': rangeStop.clone().subtract(24, 'hours'),
    '7d': rangeStop.clone().subtract(7, 'days'),
    '30d': rangeStop.clone().subtract(30, 'days'),
  };
  const rangeStart = timeRanges[params.offset] || timeRanges['24h'];

  return {
    status: 302,
    redirect: ctx.linkTo('admin.organizations.spaces.services.metrics.view', {
      organizationGUID: params.organizationGUID,
      spaceGUID: params.spaceGUID,
      serviceGUID: params.serviceGUID,
      rangeStart: rangeStart.format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: rangeStop.format('YYYY-MM-DD[T]HH:mm'),
    }),
  };
}

export async function viewServiceMetrics(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );

  if (!params.rangeStart || !params.rangeStop) {
    return {
      status: 302,
      redirect: ctx.linkTo(
        'admin.organizations.spaces.services.metrics.view', {
          organizationGUID: params.organizationGUID,
          spaceGUID: params.spaceGUID,
          serviceGUID: params.serviceGUID,
          rangeStart: moment().subtract(24, 'hours').format('YYYY-MM-DD[T]HH:mm'),
          rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
        }),
    };
  }

  const {rangeStart, rangeStop, period} = parseRange(params.rangeStart, params.rangeStop);

  const [isManager, isBillingManager, userProvidedServices, space, organization] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
    cf.userServices(params.spaceGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  const isUserProvidedService = userProvidedServices.some(s => s.metadata.guid === params.serviceGUID);

  const service = isUserProvidedService ?
  await cf.userServiceInstance(params.serviceGUID) :
  await cf.serviceInstance(params.serviceGUID);

  const serviceLabel = isUserProvidedService ? 'User Provided Service'
  : (await cf.service(service.entity.service_guid)).entity.label;

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = fromOrg(ctx, organization, [
    {
      text: space.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.services.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    { text: service.entity.name },
  ]);

  const defaultTemplateParams = {
    routePartOf: ctx.routePartOf,
    linkTo: ctx.linkTo,
    context: ctx.viewContext,
    organization,
    service,
    serviceLabel,
    space,
    isAdmin,
    isBillingManager,
    isManager,
    breadcrumbs,
    period,
    rangeStart,
    rangeStop,
    downloadLink: ctx.linkTo('admin.organizations.spaces.services.metrics.download', {
      organizationGUID: organization.metadata.guid,
      spaceGUID: space.metadata.guid,
      serviceGUID: service.metadata.guid,
      rangeStart,
      rangeStop,
    }),
  };

  switch (serviceLabel) {
    case 'User Provided Service':
      return {
        body: unsupportedServiceMetricsTemplate.render(defaultTemplateParams),
      };
    case 'cdn-route':
      const cloudfrontMetricSeries = await new CloudFrontMetricDataGetter(
        new cw.CloudWatchClient({
          region: 'us-east-1',
          endpoint: ctx.app.awsCloudwatchEndpoint,
        }),
        new rg.ResourceGroupsTaggingAPIClient({
          region: 'us-east-1',
          endpoint: ctx.app.awsResourceTaggingAPIEndpoint,
        }),
      ).getData(cloudfrontMetricNames, params.serviceGUID, period, rangeStart, rangeStop);

      const cloudfrontMetricSummaries = mapValues(cloudfrontMetricSeries, s => s.map(summariseSerie));

      return {
        body: cloudfrontServiceMetrics.render({
          ...defaultTemplateParams,
          drawLineGraph,
          metricSeries: cloudfrontMetricSeries,
          metricSummaries: cloudfrontMetricSummaries,
        }),
      };
    case 'mysql':
    case 'postgres':
      const rdsMetricSeries = await new RDSMetricDataGetter(
        new cw.CloudWatchClient({
          region: ctx.app.awsRegion,
          endpoint: ctx.app.awsCloudwatchEndpoint,
        }),
      ).getData(rdsMetricNames, params.serviceGUID, period, rangeStart, rangeStop);

      const rdsMetricSummaries = mapValues(rdsMetricSeries, s => s.map(summariseSerie));

      return {
        body: rdsServiceMetricsTemplate.render({
          ...defaultTemplateParams,
          drawLineGraph,
          metricSeries: rdsMetricSeries,
          metricSummaries: rdsMetricSummaries,
        }),
      };
    case 'redis':
      const elasticacheMetricSeries = await new ElastiCacheMetricDataGetter(
        new cw.CloudWatchClient({
          region: ctx.app.awsRegion,
          endpoint: ctx.app.awsCloudwatchEndpoint,
        }),
      ).getData(elasticacheMetricNames, params.serviceGUID, period, rangeStart, rangeStop);

      const elasticacheMetricSummaries = mapValues(elasticacheMetricSeries, s => s.map(summariseSerie));

      return {
        body: elasticacheServiceMetricsTemplate.render({
          ...defaultTemplateParams,
          drawLineGraph,
          metricSeries: elasticacheMetricSeries,
          metricSummaries: elasticacheMetricSummaries,
        }),
      };
    case 'elasticsearch':
      throw new Error('Not implemented');
    default:
      throw new Error(`Unrecognised service label ${serviceLabel}`);
  }
}

export async function downloadServiceMetrics(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );

  if (!params.rangeStart || !params.rangeStop || !params.metric) {
    return {
      status: 302,
      redirect: ctx.linkTo(
        'admin.organizations.spaces.services.metrics.view', {
          organizationGUID: params.organizationGUID,
          spaceGUID: params.spaceGUID,
          serviceGUID: params.serviceGUID,
          rangeStart: moment().subtract(24, 'hours').format('YYYY-MM-DD[T]HH:mm'),
          rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
        }),
    };
  }

  const {rangeStart, rangeStop, period} = parseRange(params.rangeStart, params.rangeStop);

  const [isManager, isBillingManager, userProvidedServices, space, organization] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
    cf.userServices(params.spaceGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  const isUserProvidedService = userProvidedServices.some(s => s.metadata.guid === params.serviceGUID);

  const service = isUserProvidedService ?
  await cf.userServiceInstance(params.serviceGUID) :
  await cf.serviceInstance(params.serviceGUID);

  const serviceLabel = isUserProvidedService ? 'User Provided Service'
  : (await cf.service(service.entity.service_guid)).entity.label;

  const defaultTemplateParams = {
    routePartOf: ctx.routePartOf,
    linkTo: ctx.linkTo,
    context: ctx.viewContext,
    organization,
    service,
    serviceLabel,
    space,
    isAdmin,
    isBillingManager,
    isManager,
    period,
    rangeStart,
    rangeStop,
  };

  const name = `${serviceLabel}-metrics-${params.metric}-${params.rangeStart}-${params.rangeStop}.csv`;

  switch (serviceLabel) {
    case 'User Provided Service':
      return {
        body: unsupportedServiceMetricsTemplate.render(defaultTemplateParams),
      };
    case 'cdn-route':
      const cloudfrontMetricSeries = await new CloudFrontMetricDataGetter(
        new cw.CloudWatchClient({
          region: 'us-east-1',
          endpoint: ctx.app.awsCloudwatchEndpoint,
        }),
        new rg.ResourceGroupsTaggingAPIClient({
          region: 'us-east-1',
          endpoint: ctx.app.awsResourceTaggingAPIEndpoint,
        }),
      ).getData([params.metric], params.serviceGUID, period, rangeStart, rangeStop);

      return {
        mimeType: 'text/csv',
        download: {
          name,
          data: cloudfrontMetricsTemplate.render({
            ...defaultTemplateParams,
            metricData: cloudfrontMetricSeries[params.metric],
            units: params.units,
          }),
        },
      };
    case 'mysql':
    case 'postgres':
      const rdsMetricSeries = await new RDSMetricDataGetter(
        new cw.CloudWatchClient({
          region: ctx.app.awsRegion,
          endpoint: ctx.app.awsCloudwatchEndpoint,
        }),
      ).getData([params.metric], params.serviceGUID, period, rangeStart, rangeStop);

      return {
        mimeType: 'text/csv',
        download: {
          name,
          data: rdsMetricsTemplate.render({
            ...defaultTemplateParams,
            metricData: rdsMetricSeries[params.metric],
            units: params.units,
          }),
        },
      };
    case 'redis':
      const elasticacheMetricSeries = await new ElastiCacheMetricDataGetter(
        new cw.CloudWatchClient({
          region: ctx.app.awsRegion,
          endpoint: ctx.app.awsCloudwatchEndpoint,
        }),
      ).getData([params.metric], params.serviceGUID, period, rangeStart, rangeStop);

      return {
        mimeType: 'text/csv',
        download: {
          name,
          data: elasticacheMetricsTemplate.render({
            ...defaultTemplateParams,
            metricData: elasticacheMetricSeries[params.metric],
            units: params.units,
          }),
        },
      };
    case 'elasticsearch':
      throw new Error('Not implemented');
    default:
      throw new Error(`Unrecognised service label ${serviceLabel}`);
  }
}

function parseRange(start: string, stop: string): IRange {
  const rangeStart = moment(start);
  const rangeStop = moment(stop);
  if (rangeStart.isBefore(rangeStop.clone().subtract(1, 'year').subtract(1, 'week'))) {
    throw new UserFriendlyError('Invalid time range provided. Cannot handle more than a year of metrics');
  }

  if (rangeStop.isBefore(moment().subtract(1, 'years').subtract(1, 'week')) || rangeStart.isBefore(moment().subtract(1, 'years').subtract(1, 'week'))) {
    throw new UserFriendlyError('Invalid time range provided. Cannot handle over a year old metrics');
  }

  if (rangeStop.isBefore(rangeStart)) {
    throw new UserFriendlyError('Invalid time range provided');
  }

  const period = moment.duration(getPeriod(rangeStart, rangeStop), 'seconds');

  return { period, rangeStart: roundDown(rangeStart, period), rangeStop: roundDown(rangeStop, period) };
}
