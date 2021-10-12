import lodash from 'lodash';
import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IOrganization } from '../../lib/cf/types';
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';
import { IContext } from '../app/context';
import { SuccessPage } from '../shared';

import { EditOrganization, OrganizationsPage } from './views';

interface IUpdateOrgDataBody {
  readonly name: string;
  readonly quota: string;
  readonly suspended: string;
}

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

export async function editOrgData(ctx: IContext, params: IParameters): Promise<IResponse> {
  if (!ctx.token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin');
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [organization, quotas] = await Promise.all([
    cf.getOrganization({ guid: params.organizationGUID }),
    cf.organizationQuotas(),
  ]);

  const realQuotas = quotas.filter(quota => !quota.name.match(/^(CATS|ACC|BACC|SMOKE|PERF|AIVENBACC)-/));
  const template = new Template(ctx.viewContext, `Organisation ${organization.name} Manage`);

  template.breadcrumbs = [
    { href: ctx.linkTo('admin.organizations'), text: 'Organisations' },
    {
      href: ctx.linkTo('admin.organizations.view', { organizationGUID: organization.guid }),
      text: organization.name,
    },
    { text: 'Manage Organisation' },
  ];

  return {
    body: template.render(<EditOrganization
      organization={organization}
      quotas={realQuotas.sort((qA, qB) => qA.apps.total_memory_in_mb - qB.apps.total_memory_in_mb)}
      csrf={ctx.viewContext.csrf}
    />),
  };
}

export async function updateOrgData(ctx: IContext, params: IParameters, body: IUpdateOrgDataBody): Promise<IResponse> {
  if (!ctx.token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin');
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const organization = await cf.getOrganization({ guid: params.organizationGUID });

  await cf.applyOrganizationQuota(body.quota, params.organizationGUID);
  await cf.updateOrganization(organization, {
    metadata: organization.metadata,
    name: body.name,
    suspended: body.suspended === 'true',
  });

  const template = new Template(ctx.viewContext, 'Organisation successfully updated');

  template.breadcrumbs = [
    { href: ctx.linkTo('admin.organizations'), text: 'Organisations' },
    {
      href: ctx.linkTo('admin.organizations.view', { organizationGUID: organization.guid }),
      text: organization.name,
    },
    {
      href: ctx.linkTo('admin.organizations.quota.edit', { organizationGUID: organization.guid }),
      text: 'Manage Organisation',
    },
  ];

  return {
    body: template.render(<SuccessPage
      heading="Organisation successfully updated"
    />),
  };
}
