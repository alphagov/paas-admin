import React from 'react';

import * as zendesk from 'node-zendesk';
import axios from 'axios';
import { AccountsClient, IAccountsUser } from '../../lib/accounts';
import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';
import { IContext } from '../app/context';
import { Token } from '../auth';
import { IValidationError } from '../errors/types';

import { validateNewOrganization } from './validators';
import {
  CreateOrganizationPage,
  CreateOrganizationSuccessPage,
  EmailOrganisationManagersConfirmationPage,
  EmailOrganisationManagersPage,
  IEmailOrganisationManagersPageValues,
  INewOrganizationUserBody,
  PlatformAdministratorPage,
} from './views';

const TITLE_CREATE_ORG = 'Create Organisation';
const TITLE_EMAIL_ORG_MANAGERS = 'Email organisation managers';

function throwErrorIfNotAdmin({ token }: { readonly token: Token }): void {
  if (token.hasAdminScopes()) {
    return;
  }

  throw new NotAuthorisedError('Not a platform admin');
}

function validateEmailMessage({ message }: IEmailOrganisationManagersPageValues): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!message) {
    errors.push({
      field: 'message',
      message: 'Enter your message',
    });
  }

  return errors;
}

function validateOrgSelection({ organisation }: IEmailOrganisationManagersPageValues): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!organisation) {
    errors.push({
      field: 'organisation',
      message: 'Select an organisation',
    });
  }

  return errors;
}

function contactOrgManagersContent(variables: IEmailOrganisationManagersPageValues, region: string): string {

  return `
  Hello,
  you are receiving this email as you're listed as a manager of the ${variables.organisation} organistion in our ${region.toUpperCase} region.
  
  ${variables.message}

  Thank you,
  GOV.​UK PaaS
  `;
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

  const errors = validateNewOrganization(body);
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

export async function emailOrganisationManagers(
  ctx: IContext, _params: IParameters, body: IEmailOrganisationManagersPageValues,
): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgsList = await cf.v3Organizations();

  const template = new Template(ctx.viewContext, TITLE_EMAIL_ORG_MANAGERS);
  return {
    body: template.render(<EmailOrganisationManagersPage
      linkTo={ctx.linkTo}
      csrf={ctx.viewContext.csrf}
      orgs={orgsList}
    />),
  };
}

export async function emailOrganisationManagersPost(
  ctx: IContext, _params: IParameters, body: IEmailOrganisationManagersPageValues,
): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const errors = [];

  errors.push(
    ...validateOrgSelection(body),
    ...validateEmailMessage(body),
  );

  const template = new Template(ctx.viewContext);

  if (errors.length > 0) {

    const cf = new CloudFoundryClient({
      accessToken: ctx.token.accessToken,
      apiEndpoint: ctx.app.cloudFoundryAPI,
      logger: ctx.app.logger,
    });
  
    const orgsList = await cf.v3Organizations();
  
    template.title = `Error: ${TITLE_EMAIL_ORG_MANAGERS}`;

    return {
      body: template.render(<EmailOrganisationManagersPage
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        errors={errors}
        orgs={orgsList}
        values={body}
      />),
      status: 400,
    };
  }

  // no errors so

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
  });

  const usersForGivenOrg = await cf.usersForOrganization(body.organisation);

  const managerUsersInOrg = await Promise.all(
    usersForGivenOrg.filter(user => user.entity.organization_roles.includes('org_manager'))
      .map(async manager => await accountsClient.getUser(manager.metadata.guid)),
  );

  const managersEmails: ReadonlyArray<string> = Array.from(
    new Set(
      managerUsersInOrg
        .filter((managerAccount): managerAccount is IAccountsUser => !!managerAccount)
        .map(managerAccount => managerAccount.email),
    ),
  );
  //find org guid in accounts
  // pull out list of org managers
  // add them as cc to zendesk ticket api
  //send 

  console.log(body)

  // const client = zendesk.createClient(ctx.app.zendeskConfig);

  // const zendeskAuthToken = Buffer.from(`${ctx.app.zendeskConfig.username}/token:${ctx.app.zendeskConfig.token}`).toString('base64');

  // axios.post(`${ctx.app.zendeskConfig}/tickets`, {
  //   data: {"ticket": {"subject": "Paas Support] My printer is on fire!", "comment": { "body": "The smoke is very colorful." }}}
  // }, {
  //   headers: {
  //     'Access-Control-Allow-Origin': '*',
  //     'Content-Type': 'application/json',
  //     'Authorization': `Basic ${zendeskAuthToken}` 
  //   }
  // })

  // (async () => {
  //   try {
  //     const result = await client.tickets.create({
  //       ticket: {
  //         comment: {
  //           body: contactOrgManagersContent({
  //             organisation: body.organisation,
  //             message: body.message,
  //           },
  //           ctx.viewContext.location)
  //         },
  //         subject: `[PaaS Support] About your organisation on Paas`,
  //         status: 'pending',
  //         tags: ['govuk_paas_support'],
  //       }
  //     });
  //     console.log(JSON.stringify(result, null, 2));
  //   } catch (err) {
  //   }
  // })();



  // await client.tickets.create({
  //   ticket: {
  //     comment: {
  //       body: contactOrgManagersContent({
  //         organisation: body.organisation,
  //         message: body.message,
  //       },
  //       ctx.viewContext.location)
  //     },
  //     subject: `[PaaS Support] About your organisation on Paas`,
  //     status: 'pending',
  //     tags: ['govuk_paas_support'],
  //   }
  // });

  template.title = 'Message has been sent';

  return {
    body: template.render(
      <EmailOrganisationManagersConfirmationPage
        linkTo={ctx.linkTo}
        heading={'Message has been sent'}
        text={`A Zendesk ticket has also been created to track progress.`}
      >
        <a className="govuk-link"
          href="/platform-admin/email-organisation-managers">
            Contact more organisation managers
        </a>.
      </EmailOrganisationManagersConfirmationPage>,
    ),
  }
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
