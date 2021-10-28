import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { AccountsClient, IAccountsUser } from '../../lib/accounts';

import { validateNewOrganization } from './validators';
import {
  CreateOrganizationPage,
  EmailOrganizationPage,
  CreateOrganizationSuccessPage,
  INewOrganizationUserBody,
  PlatformAdministratorPage,
  EmailSuccessPage,
} from './views';
import NotificationClient from '../../lib/notify';

import {
  IOrganization,
} from '../../lib/cf/types';

import { IValidationError } from '../errors/types';

const TITLE_CREATE_ORG = 'Create Organisation';

function throwErrorIfNotAdmin({ token }: { readonly token: Token }): void {
  if (token.hasAdminScopes()) {
    return;
  }

  throw new NotAuthorisedError('Not a platform admin');
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

function sortOrganizationsByName(
  organizations: ReadonlyArray<IOrganization>,
): ReadonlyArray<IOrganization> {
  const organizationsCopy = Array.from(organizations);
  organizationsCopy.sort((a, b) => a.entity.name.localeCompare(b.entity.name));

  return organizationsCopy;
}

export async function emailOrganizationForm(ctx: IContext, _params: IParameters): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const template = new Template(ctx.viewContext, "Email org managers");

  const emailBody = _params['emailBody'];
  const orgName = _params['orgName'];

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
  });

  const notify = new NotificationClient({
    apiKey: ctx.app.notifyAPIKey,
    templates: {
      sendOrgEmail: ctx.app.notifySendOrgEmailTemplateID,
    },
  });

  const [organizations] = await Promise.all([
    cf.organizations().then(sortOrganizationsByName),
  ]);

  const errors: Array<IValidationError> = [];

  if (emailBody !== undefined && orgName !== undefined) {
    const usersForGivenOrg = await cf.usersForOrganization(orgName);

    const managerUsersInOrg = await Promise.all(
      usersForGivenOrg.filter(user => user.entity.organization_roles.includes('org_manager'))
        .map(async manager => await accountsClient.getUser(manager.metadata.guid))
    );

    const managersEmails: ReadonlyArray<string> = Array.from(
      new Set(
        managerUsersInOrg
          .filter((managerAccount): managerAccount is IAccountsUser => !!managerAccount)
          .map((managerAccount) => managerAccount.email)
      )
    );

    const url = new URL(ctx.app.domainName);

    const results = managersEmails.map(
      async email => await notify.sendOrgEmail(email, url.toString(), emailBody)
    );

    await Promise.all(results)
      .then(
        results => results.map(
          (resp: IResponse) => {
            // TODO should we check JUST for 201s?
            // TODO check for more errors, connection errors etc
            if (resp.status !== undefined && resp.status > 199) {
                errors.push({ field: 'email', message: 'email not sent' });
            }
          }
        )
      );
  }

  return {
    body: template.render(
      errors.length == 0 && 
      emailBody !== undefined && 
      orgName !== undefined ?
        <EmailSuccessPage
          linkTo={ctx.linkTo}
          csrf={ctx.viewContext.csrf}
        />
      :
        <EmailOrganizationPage
          csrf={ctx.viewContext.csrf}
          linkTo={ctx.linkTo}
          orgs={organizations}
          errors={errors}
        />
    ),
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

  const errors = validateNewOrganization(body);
  if (errors.length > 0) {
    const orgs = await cf.v3Organizations();
    const owners = Array.from(new Set(orgs
      .filter(org => !!org.metadata.annotations.owner)
      .map(org => ({ name: org.name, owner: org.metadata.annotations.owner }))
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

