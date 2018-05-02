import { IContext } from '../app/context';
import CloudFoundryClient from '../cf';
import { IParameters, IResponse } from '../lib/router';

import serviceOverviewTemplate from './overview.njk';

export async function viewService(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const service = await cf.serviceInstance(params.serviceGUID);
  const space = await cf.space(params.spaceGUID);
  const organization = await cf.organization(params.organizationGUID);

  const servicePlan = await cf.servicePlan(service.entity.service_plan_guid);

  const summarisedService = {
    entity: service.entity,
    metadata: service.metadata,
    service_plan: {
      ...servicePlan,
      service: await cf.service(servicePlan.entity.service_guid),
    },
  };

  return {
    body: serviceOverviewTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      service: summarisedService,
      space,
    }),
  };
}
