import CloudFoundryClient from '../../lib/cf';
import { IOrganization } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';
import * as account from '../account';

import organizationsTemplate from './organizations.njk';

function sortOrganizationsByName(organizations: ReadonlyArray<IOrganization>): ReadonlyArray<IOrganization> {
  const organizationsCopy = Array.from(organizations);
  organizationsCopy.sort((a, b) => a.entity.name.localeCompare(b.entity.name));
  return organizationsCopy;
}

export async function listOrganizations(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [organizations, user] = await Promise.all([
    cf.organizations().then(sortOrganizationsByName),
    account.fetchLoggedInUser(ctx),
  ]);

  return {
    body: organizationsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      organizations,
      location: ctx.app.location,
      user: user
    }),
  };
}
