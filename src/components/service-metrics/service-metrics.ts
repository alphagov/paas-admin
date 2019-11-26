import * as cw from '@aws-sdk/client-cloudwatch-node';
import moment from 'moment';
import { CloudwatchMetricDataClient } from '../../lib/aws/cloudwatch-metric-data';
import CloudFoundryClient from '../../lib/cf';
import roundDown from '../../lib/moment/round';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import { fromOrg, IBreadcrumb } from '../breadcrumbs';
import { drawMultipleLineGraphs } from '../charts/line-graph';
import { UserFriendlyError } from '../errors';
import elasticacheServiceMetricsTemplate from './elasticache-service-metrics.njk';
import rdsServiceMetricsTemplate from './rds-service-metrics.njk';
import unsupportedServiceMetricsTemplate from './unsupported-service-metrics.njk';

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
      rangeStart: rangeStart.unix(),
      rangeStop: rangeStop.unix(),
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
            rangeStart: moment().subtract(24, 'hours').unix(),
            rangeStop: moment().unix(),
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

    const cloudWatchMetricDataClient = new CloudwatchMetricDataClient(
      new cw.CloudWatchClient({
        region: ctx.app.awsRegion,
        endpoint: ctx.app.awsCloudwatchEndpoint,
      }),
    );

    const metricGraphData = await cloudWatchMetricDataClient.getMetricGraphData(
      service.metadata.guid,
      serviceLabel,
      period,
      rangeStart,
      rangeStop,
    );

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
      /* istanbul ignore next */
      default:
        throw new Error(`Unrecognised service type ${metricGraphData.serviceType}`);
    }
}

function parseRange(start: string, stop: string): IRange {
  const rangeStart = moment.unix(parseInt(start, 10));
  const rangeStop = moment.unix(parseInt(stop, 10));
  const secondsDifference = rangeStop.diff(rangeStart) / 1000;
  let period;

  if (rangeStop.isBefore(rangeStart)) {
    throw new UserFriendlyError('Invalid time range provided');
  }

  if (secondsDifference <= 900) { // If less than 15 minutes
    period = moment.duration(3, 'seconds');
  } else if (secondsDifference <= 3600) { // If less than an hour
    period = moment.duration(10, 'seconds');
  } else if (secondsDifference <= 7200) { // If less than 2 hours
    period = moment.duration(30, 'seconds');
  } else if (secondsDifference <= 90000) { // If less than 25 hours
    period = moment.duration(5, 'minutes');
  } else if (secondsDifference <= 1080000) { // If less than 300 hours
    period = moment.duration(1, 'hour');
  } else {
    period = moment.duration(1, 'day');
  }

  if (rangeStart.isBefore(rangeStop.clone().subtract(1, 'year'))) {
    throw new UserFriendlyError('Invalid time range provided. Cannot handle more than a year of metrics');
  }

  return { period, rangeStart: roundDown(rangeStart, period), rangeStop: roundDown(rangeStop, period) };
}
