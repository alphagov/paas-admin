import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';

import serviceOverviewTemplate from './overview.njk';

export async function viewService(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
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

  const servicePlan = !isUserProvidedService ? await cf.servicePlan(service.entity.service_plan_guid) : null;

  const summarisedService = {
    entity: service.entity,
    metadata: service.metadata,
    service_plan: {
      ...servicePlan,
      service: servicePlan ? await cf.service(servicePlan.entity.service_guid) : null,
    },
  };

  return {
    body: serviceOverviewTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      organization,
      service: summarisedService,
      space,
      isAdmin,
      isBillingManager,
      isManager,
      location: ctx.app.awsRegion,
    }),
  };
}
