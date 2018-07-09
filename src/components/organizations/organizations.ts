import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import organizationsTemplate from './organizations.njk';

export async function listOrganizations(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const organizations = await cf.organizations();
  const cfDownloadLinkLocation = 'https://packages.cloudfoundry.org/stable?release=';
  const cfDownloadLinkSource = '&amp;source=github';
  const documentationLink = 'https://docs.cloud.service.gov.uk/#';

  return {
    body: organizationsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      cfDownloadLinkLocation,
      cfDownloadLinkSource,
      documentationLink,
      organizations,
    }),
  };
}
