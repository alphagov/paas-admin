import { IContext } from '../app/context';
import { IParameters, IResponse } from '../lib/router';

import serviceOverviewTemplate from './overview.njk';

export async function viewService(ctx: IContext, params: IParameters): Promise<IResponse> {
  const service = await ctx.cf.serviceInstance(params.serviceGUID);
  const space = await ctx.cf.space(params.spaceGUID);
  const organization = await ctx.cf.organization(params.organizationGUID);

  const servicePlan = await ctx.cf.servicePlan(service.entity.service_plan_guid);

  const summarisedService = {
    entity: service.entity,
    metadata: service.metadata,
    service_plan: {
      ...servicePlan,
      service: await ctx.cf.service(servicePlan.entity.service_guid),
    },
  };

  return {
    body: serviceOverviewTemplate.render({
      linkTo: ctx.linkTo,
      service: summarisedService,
      space,
      organization,
    }),
  };
}
