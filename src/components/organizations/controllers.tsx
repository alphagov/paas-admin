import lodash from 'lodash';
import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IOrganization } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';

import { OrganizationsPage } from './views';

function sortOrganizationsByName(
  organizations: ReadonlyArray<IOrganization>,
): ReadonlyArray<IOrganization> {
  const organizationsCopy = Array.from(organizations);
  organizationsCopy.sort((a, b) => a.entity.name.localeCompare(b.entity.name));

  return organizationsCopy;
}

export async function listOrganizations(
  ctx: IContext,
  _params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [organizations] = await Promise.all([
    cf.organizations().then(sortOrganizationsByName),
  ]);

  const orgQuotaGUIDs = lodash.uniq(
    organizations.map(o => o.entity.quota_definition_guid),
  );
  const orgQuotas = await Promise.all(
    orgQuotaGUIDs.map(async q => await cf.organizationQuota(q)),
  );
  const orgQuotasByGUID = lodash.keyBy(orgQuotas, q => q.metadata.guid);
  const template = new Template(ctx.viewContext, 'Organisations');

  return {
    body: template.render(
      <OrganizationsPage
        linkTo={ctx.linkTo}
        organizations={organizations}
        quotas={orgQuotasByGUID}
      />,
    ),
  };
}
