import { IContext } from '../app/context';
import { IRoute } from '../cf/types';
import { IParameters, IResponse } from '../lib/router';

import applicationOverviewTemplate from './overview.njk';

function buildURL(route: IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

export async function viewApplication(ctx: IContext, params: IParameters): Promise<IResponse> {
  const application = await ctx.cf.application(params.applicationGUID);
  const space = await ctx.cf.space(params.spaceGUID);
  const organization = await ctx.cf.organization(params.organizationGUID);

  const summary = await ctx.cf.applicationSummary(params.applicationGUID);

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
      linkTo: ctx.linkTo,
      space,
      organization,
    }),
  };
}
