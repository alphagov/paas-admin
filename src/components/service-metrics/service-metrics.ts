import * as cw from '@aws-sdk/client-cloudwatch-node';
import moment from 'moment';
import { CloudwatchMetricDataClient, IMetricGraphDataResponse } from '../../lib/aws/cloudwatch-metric-data';
import CloudFoundryClient from '../../lib/cf';
import roundDown from '../../lib/moment/round';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import { fromOrg, IBreadcrumb } from '../breadcrumbs';
import { drawMultipleLineGraphs } from '../charts/line-graph';
import { UserFriendlyError } from '../errors';
import elasticacheServiceMetricsTemplate from './elasticache-service-metrics.njk';
import elasticsearchServiceMetricsTemplate from './elasticsearch-service-metrics.njk';
import { getPrometheusMetricGraphData, IMetricGraphDataResponse as PrometheusGraphData } from './prometheus';
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

    const metricGraphData = await gatherData(ctx, serviceLabel, service.metadata.guid, period, rangeStart, rangeStop);
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
    };
    if (!metricGraphData) {
      return {
        body: unsupportedServiceMetricsTemplate.render(defaultTemplateParams),
      };
    }

    const metricGraphsById = drawMultipleLineGraphs(metricGraphData.graphs);

    switch (metricGraphData.serviceType) {
      case 'rds':
        return {
          body: rdsServiceMetricsTemplate.render({
            ...defaultTemplateParams,
            metricGraphsById,
          }),
        };
      case 'elasticache':
        return {
          body: elasticacheServiceMetricsTemplate.render({
            ...defaultTemplateParams,
            metricGraphsById,
          }),
        };
      case 'elasticsearch':
        return {
          body: elasticsearchServiceMetricsTemplate.render({
            ...defaultTemplateParams,
            metricGraphsById,
          }),
        };
      /* istanbul ignore next */
      default:
        throw new Error(`Unrecognised service type ${metricGraphData!.serviceType}`);
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

async function gatherData(
  ctx: IContext, serviceLabel: string, guid: string,
  period: moment.Duration, rangeStart: moment.Moment, rangeStop: moment.Moment,
): Promise<IMetricGraphDataResponse | PrometheusGraphData | null> {
  switch (serviceLabel) {
    case 'postgres':
    case 'mysql':
    case 'redis':
      const cloudWatchMetricDataClient = new CloudwatchMetricDataClient(
        new cw.CloudWatchClient({
          region: ctx.app.awsRegion,
          endpoint: ctx.app.awsCloudwatchEndpoint,
        }),
      );

      return cloudWatchMetricDataClient.getMetricGraphData(
        guid,
        serviceLabel,
        period,
        rangeStart,
        rangeStop,
      );
    case 'elasticsearch':
      const prometheusClient = new PromClient(
        ctx.app.prometheusEndpoint,
        ctx.app.prometheusUsername,
        ctx.app.prometheusPassword,
        ctx.app.logger,
      );

      return getPrometheusMetricGraphData(
        prometheusClient,
        serviceLabel,
        guid,
        period,
        rangeStart,
        rangeStop,
      );
    default:
      return null;
  }
}
