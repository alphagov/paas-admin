import { IParameters, IResponse } from '../lib/router';

import { IContext } from '../app/context';

import organizationsTemplate from './organizations.njk';

export async function listOrganizations(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const organizations = await ctx.cf.organizations();

  return {
    body: organizationsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organizations,
    }),
  };
}
