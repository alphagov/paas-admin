import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { NotFoundError } from '../../lib/router/errors';
import { AccountsClient } from '../../lib/accounts';

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
  IOrganizationUserRoles,
  IOrganization,
} from '../../lib/cf/types';

import { IValidationError } from '../errors/types';

interface UserEmails {
  readonly email: string;
};

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

  console.debug(organizations);

  if (emailBody === undefined && orgName === undefined) {
      // render form
  return {
      body: template.render(
        <EmailOrganizationPage
          csrf={ctx.viewContext.csrf}
          linkTo={ctx.linkTo}
          orgs={organizations}
        />),
    };
  }
  else {
     // send emails



    // TODO should this be called userRolesForOrg...
    const ufo = await cf.usersForOrganization(orgName);

    const ufo_to_account = async function(user: IOrganizationUserRoles): Promise<string> {
        const account_user = await accountsClient.getUser(user.metadata.guid);
        if (account_user != undefined) {
            return account_user.email;
        }
        else {
            return '';
        }
    };

    const manager_emails_promises = Array.from(
        ufo.filter(user => user.entity.organization_roles.includes('org_manager'))
          .map(ufo_to_account));

    const manager_emails = await Promise.all(manager_emails_promises);

    const deduped_emails: ReadonlyArray<string> = Array.from(new Set(manager_emails.filter(e => e.length > 0)));

    const url = new URL(ctx.app.domainName);

    const results = deduped_emails.map(
        async email => await notify.sendOrgEmail(email, url.toString(), emailBody
    ));

    const errors: Array<IValidationError> = [];
    await Promise.all(results).then(
        results => results.map(
            (n: IResponse) => {
                // TODO should we check JUST for 201s?
                // TODO check for more errors, connection errors etc
                if (n.status !== undefined && n.status > 199) {
                    errors.push({ field: 'email', message: 'email not sent' });
                }
        }));

    return {
        body: template.render(
        errors.length > 0 ?
          <EmailOrganizationPage
            csrf={ctx.viewContext.csrf}
            linkTo={ctx.linkTo}
            orgs={organizations}
            errors={errors}
          />
        : <EmailSuccessPage
            linkTo={ctx.linkTo}
            csrf={ctx.viewContext.csrf}
          />),
    };
  }
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

