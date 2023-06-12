import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IV3OrganizationResource } from '../../lib/cf/types';
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';
import { IContext } from '../app/context';
import { Token } from '../auth';

import {
  CreateOrganizationPage,
  CreateOrganizationSuccessPage,
  INewOrganizationUserBody,
  PlatformAdministratorPage,
} from './views';
import { validateArrayMember, validateRequired, validateSlug } from '../../lib/validation';
import { owners } from '../organizations/owners';


const TITLE_CREATE_ORG = 'Create Organisation';

function throwErrorIfNotAdmin({ token }: { readonly token: Token }): void {
  if (token.hasAdminScopes()) {
    return;
  }

  throw new NotAuthorisedError('Not a platform admin');
}

export function sortOrganisationsByName(organisations: ReadonlyArray<IV3OrganizationResource>): ReadonlyArray<IV3OrganizationResource> {
  // have to create copy because original array type is read only
  const organisationsCopy = Array.from(organisations)
  return organisationsCopy.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterOutRealOrganisations(organisations: ReadonlyArray<IV3OrganizationResource>): ReadonlyArray<IV3OrganizationResource> {
  return organisations.filter(org => !org.name.match(/^(CATS?|ACC|BACC|SMOKE|PERF|AIVENBACC|ASATS)-/));
}

export async function createOrganizationForm(ctx: IContext, _params: IParameters): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgs = await cf.v3Organizations();
  const owners = Array.from(new Set(orgs
    .filter(org => !!org.metadata.annotations.owner)
    .map(org => ({ name: org.name, owner: org.metadata.annotations.owner! }))
    .sort()));

  const template = new Template(ctx.viewContext, TITLE_CREATE_ORG);

  return {
    body: template.render(<CreateOrganizationPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      owners={owners}
    />),
  };
}

export async function createOrganization(
  ctx: IContext, _params: IParameters, body: INewOrganizationUserBody,
): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const template = new Template(ctx.viewContext, TITLE_CREATE_ORG);

  const errors = [
    ...validateRequired(body.organization, 'organization', 'Organisation name is a required field'),
    ...validateSlug(body.organization, 'organization', 'Organisation name must be all lowercase and hyphen separated'),
    ...validateRequired(body.owner, 'owner', 'Owner is a required field'),
    ...validateArrayMember(body.owner, owners, 'owner', 'Owner must be an existing organisation'),
  ];

  if (errors.length > 0) {
    const orgs = await cf.v3Organizations();
    const owners = Array.from(new Set(orgs
      .filter(org => !!org.metadata.annotations.owner)
      .map(org => ({ name: org.name, owner: org.metadata.annotations.owner! }))
      .sort()));

    return {
      body: template.render(<CreateOrganizationPage
        errors={errors}
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        values={body}
        owners={owners}
      />),
      status: 422,
    };
  }

  const organization = await cf.v3CreateOrganization({
    metadata: {
      annotations: { owner: body.owner! },
    },
    name: body.organization!,
  });

  await cf.v3CreateSpace({
    name: 'sandbox',
    relationships: { organization: { data: { guid: organization.guid } } },
  });

  return {
    body: template.render(<CreateOrganizationSuccessPage
      linkTo={ctx.linkTo}
      organizationGUID={organization.guid}
    />),
  };
}

export async function viewHomepage(
  ctx: IContext,
  _params: IParameters,
): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const template = new Template(ctx.viewContext, 'Platform Administrator');

  return await Promise.resolve({
    body: template.render(
      <PlatformAdministratorPage
        linkTo={ctx.linkTo}
        csrf={ctx.viewContext.csrf}
      />,
    ),
  });
}
