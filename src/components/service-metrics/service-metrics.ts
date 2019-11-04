import * as cw from '@aws-sdk/client-cloudwatch-node';

import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import { fromOrg, IBreadcrumb } from '../breadcrumbs';
import serviceMetricsTemplate from './service-metrics.njk';

// Ignoring test coverage of viewServiceMetricImage because this is temporary code,
// to be replaced with properly rendered SVG graphs at a later date.
/* istanbul ignore next */
export async function viewServiceMetricImage(ctx: IContext, params: IParameters): Promise<IResponse> {
    const cloudWatch = new cw.CloudWatchClient({ region: ctx.app.awsRegion });
    const cmd = new cw.GetMetricWidgetImageCommand({
      MetricWidget: JSON.stringify({
        metrics: [
          [ 'AWS/RDS', params.metricDimension, 'DBInstanceIdentifier', `rdsbroker-${params.serviceGUID}` ],
        ],
        yAxis: {left: { min: 0} },
        start: '-PT24H',
        title: ' ',
        legend: {position: 'hidden'},
      }),
    });

    try {
      const data = await cloudWatch.send(cmd);
      if (!data.MetricWidgetImage) {
        throw new Error('Expected MetricWidgetImage to be set');
      }
      return {
          body: Buffer.from(data.MetricWidgetImage),
          mimeType: 'image/png',
      };
    } catch (err) {
      ctx.app.logger.error('failed to get metric widget image', err);
      return {
          body: Buffer.from(''),
          mimeType: 'image/png',
      };
    }
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

    return {
        body: serviceMetricsTemplate.render({
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
        }),
    };
}
