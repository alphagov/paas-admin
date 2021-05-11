import lodash from 'lodash'
import React from 'react'

import { Template } from '../../layouts'
import CloudFoundryClient from '../../lib/cf'
import { IOrganization } from '../../lib/cf/types'
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router'
import { IContext } from '../app/context'

import { OrganizationsPage, EditOrganizationQuota } from './views'
import { SuccessPage } from '../shared'

interface IUpdateOrgQuotaBody {
  readonly quota: string
}

function sortOrganizationsByName (
  organizations: readonly IOrganization[]
): readonly IOrganization[] {
  const organizationsCopy = Array.from(organizations)
  organizationsCopy.sort((a, b) => a.entity.name.localeCompare(b.entity.name))

  return organizationsCopy
}

export async function listOrganizations (
  ctx: IContext,
  _params: IParameters
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger
  })

  const [organizations] = await Promise.all([
    cf.organizations().then(sortOrganizationsByName)
  ])

  const orgQuotaGUIDs = lodash.uniq(
    organizations.map(o => o.entity.quota_definition_guid)
  )
  const orgQuotas = await Promise.all(
    orgQuotaGUIDs.map(async q => await cf.organizationQuota(q))
  )
  const orgQuotasByGUID = lodash.keyBy(orgQuotas, q => q.metadata.guid)
  const template = new Template(ctx.viewContext, 'Organisations')

  return {
    body: template.render(
      <OrganizationsPage
        linkTo={ctx.linkTo}
        organizations={organizations}
        quotas={orgQuotasByGUID}
      />
    )
  }
}

export async function editOrgQuota (ctx: IContext, params: IParameters): Promise<IResponse> {
  if (!ctx.token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin')
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger
  })

  const [organization, quotas] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.organizationQuotas()
  ])

  const realQuotas = quotas.filter(quota => quota.name.match(/^(CATS|ACC|BACC|SMOKE|PERF|AIVENBACC)-/) == null)
  const template = new Template(ctx.viewContext, `Organisation ${organization.entity.name} Manage Quota`)

  template.breadcrumbs = [
    { href: ctx.linkTo('admin.organizations'), text: 'Organisations' },
    {
      href: ctx.linkTo('admin.organizations.view', { organizationGUID: organization.metadata.guid }),
      text: organization.entity.name
    },
    { text: 'Manage Quota' }
  ]

  return {
    body: template.render(<EditOrganizationQuota
      organization={organization}
      quotas={realQuotas.sort((qA, qB) => qA.apps.total_memory_in_mb - qB.apps.total_memory_in_mb)}
      csrf={ctx.viewContext.csrf}
    />)
  }
}

export async function updateOrgQuota (ctx: IContext, params: IParameters, body: IUpdateOrgQuotaBody): Promise<IResponse> {
  if (!ctx.token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin')
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger
  })

  const organization = await cf.organization(params.organizationGUID)

  await cf.applyOrganizationQuota(body.quota, params.organizationGUID)

  const template = new Template(ctx.viewContext, 'Quota successfully set')

  template.breadcrumbs = [
    { href: ctx.linkTo('admin.organizations'), text: 'Organisations' },
    {
      href: ctx.linkTo('admin.organizations.view', { organizationGUID: organization.metadata.guid }),
      text: organization.entity.name
    },
    {
      href: ctx.linkTo('admin.organizations.quota.edit', { organizationGUID: organization.metadata.guid }),
      text: 'Manage Quota'
    }
  ]

  return {
    body: template.render(<SuccessPage
      heading='Quota successfully set'
                          />)
  }
}
