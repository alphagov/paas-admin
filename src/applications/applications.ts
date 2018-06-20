import { IContext } from '../app/context';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import CloudFoundryClient from '../cf';
import { IRoute } from '../cf/types';
import { IParameters, IResponse } from '../lib/router';

import applicationOverviewTemplate from './overview.njk';

function buildURL(route: IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

export async function viewApplication(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

  const application = await cf.application(params.applicationGUID);
  const space = await cf.space(params.spaceGUID);
  const organization = await cf.organization(params.organizationGUID);

  const summary = await cf.applicationSummary(params.applicationGUID);

  const summarisedApplication = {
    entity: {
      ...application.entity,
      ...summary,
      urls: summary.routes.map(buildURL),
    },
    metadata: application.metadata,
  };

  return {
    body: applicationOverviewTemplate.render({
      application: summarisedApplication,
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      space,
      organization,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}
