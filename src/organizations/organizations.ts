import { IParameters, IResponse } from '../lib/router';

import { IContext } from '../app/context';

import organizationsTemplate from './organizations.njk';

export async function listOrganizations(context: IContext, _params: IParameters): Promise<IResponse> {
  const organizations = await context.cf.organizations();
  const cfDownloadLinkLocation = 'https://packages.cloudfoundry.org/stable?release=';
  const cfDownloadLinkSource = '&amp;source=github';
  const documentationLink = 'https://docs.cloud.service.gov.uk/#';

  return {
    body: organizationsTemplate.render({
      routePartOf: context.routePartOf,
      linkTo: context.linkTo,
      cfDownloadLinkLocation,
      cfDownloadLinkSource,
      documentationLink,
      organizations,
    }),
  };
}
