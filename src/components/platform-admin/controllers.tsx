import * as zendesk from 'node-zendesk';
import React from 'react';

import { Template } from '../../layouts';
import { AccountsClient, IAccountsUser } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import { IV3OrganizationResource } from '../../lib/cf/types';
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';
import UAAClient, { IUaaUser } from '../../lib/uaa';
import { IContext } from '../app/context';
import { Token } from '../auth';
import { IValidationError } from '../errors/types';

import { validateNewOrganization } from './validators';
import {
  ContactOrganisationManagersConfirmationPage,
  ContactOrganisationManagersPage,
  CreateOrganizationPage,
  CreateOrganizationSuccessPage,
  IContactOrganisationManagersPageValues,
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

// form field validations
function validateEmailMessage({ message }: IContactOrganisationManagersPageValues): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!message) {
    errors.push({
      field: 'message',
      message: 'Enter your message',
    });
  }

  return errors;
}

function validateOrgSelection({ organisation }: IContactOrganisationManagersPageValues): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!organisation) {
    errors.push({
      field: 'organisation',
      message: 'Select an organisation',
    });
  }

  return errors;
}

function validateManagerRoleSelection({ managerRole }: IContactOrganisationManagersPageValues): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!managerRole) {
    errors.push({
      field: 'managerRole',
      message: 'Select a manager role',
    });
  }

  return errors;
}

// body of the zendesk email
export function contactOrgManagersZendeskContent(variables: IContactOrganisationManagersPageValues, region: string): string {
// whitespace matters
  return `
${variables.message}

You are receiving this email as you are listed as ${variables.managerRole === 'org_manager' ? 'an organisation' : 'a billing'} manager of the ${variables.organisation} organisation in our ${region.toUpperCase()} region.

Thank you,
GOV.UK PaaS`;
}

export function sortOrganisationsByName(organisations: ReadonlyArray<IV3OrganizationResource>): ReadonlyArray<IV3OrganizationResource> {
  // have to create copy because original array type is read only
  const organisationsCopy = Array.from(organisations)
  return organisationsCopy.sort((a, b) => a.name.localeCompare(b.name));
}

export function filterOutRealOrganisations(organisations: ReadonlyArray<IV3OrganizationResource>): ReadonlyArray<IV3OrganizationResource> {
  return organisations.filter(org => !org.name.match(/^(CATS?|ACC|BACC|SMOKE|PERF|AIVENBACC|ASATS)-/));
}

// construct requester object for zendesk api
export function constructZendeskRequesterObject(user: IUaaUser | null): any {
  const user_name = user === null ? 'GOV.UK PaaS Admin' : `${user!.name.givenName} ${user!.name.familyName}`;
  const user_email = user === null ? 'gov-uk-paas-support@digital.cabinet-office.gov.uk' : user!.emails[0].value;

return {
    name: user_name,
    // en-gb via https://developer.zendesk.com/api-reference/ticketing/account-configuration/locales/#list-available-public-locales
    locale_id: 1176,
    email: user_email,
  };
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

// intial form display
export async function contactOrganisationManagers(
  ctx: IContext, _params: IParameters,
): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgsList = await cf.v3Organizations()
    .then(filterOutRealOrganisations)
    .then(sortOrganisationsByName)

  const template = new Template(ctx.viewContext, TITLE_EMAIL_ORG_MANAGERS);

return {
    body: template.render(<ContactOrganisationManagersPage
      linkTo={ctx.linkTo}
      csrf={ctx.viewContext.csrf}
      orgs={orgsList}
    />),
  };
}

// when form is submitted
export async function contactOrganisationManagersPost(
  ctx: IContext, _params: IParameters, body: IContactOrganisationManagersPageValues,
): Promise<IResponse> {
  throwErrorIfNotAdmin(ctx);

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
  });

  const errors = [];

  // check if any fields are missing
  // if so, create error messages
  errors.push(
    ...validateOrgSelection(body),
    ...validateManagerRoleSelection(body),
    ...validateEmailMessage(body),
  );

  const template = new Template(ctx.viewContext);
  const orgsList = await cf.v3Organizations()
    .then(filterOutRealOrganisations)
    .then(sortOrganisationsByName)
  let orgUserEmails:ReadonlyArray<any> = [];

  // get email adfresses for all managers for the selected type and organisation
  if (body.organisation) {
    const usersForGivenOrg = await cf.usersForOrganization(body.organisation);
    // we need to look into paas-accounts for their actual email address
    const filteredManagers = await Promise.all(
      usersForGivenOrg.filter(user => user.entity.organization_roles.includes(body.managerRole))
        .map(async manager => await accountsClient.getUser(manager.metadata.guid)),
    );

    // create a zendesk api-friendly array of email address objects
    orgUserEmails = Array.from(
      new Set(
        filteredManagers
          .filter((user): user is IAccountsUser => !!user)
          .map(user => ({ user_email: user.email })),
      ),
    );

    // if manager role type has been selected but there are no users with selected role, update the error message
    // message property is readonly so cannot just update the message
    if (orgUserEmails.length === 0 && body.managerRole ) {
      /* istanbul ignore next */
      const managerRoleErrorIndex = errors.findIndex(
        error => error.field === 'managerRole',
      );
      errors.splice(managerRoleErrorIndex, 0, { field: 'managerRole', message: 'Select organisation does not have any of the selected manager roles' });
    }
  }

  // if there are errors, rerender the page with error messages
  if (errors.length > 0) {

    template.title = `Error: ${TITLE_EMAIL_ORG_MANAGERS}`;

    return {
      body: template.render(<ContactOrganisationManagersPage
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        errors={errors}
        orgs={orgsList}
        values={body}
      />),
      status: 400,
    };
  }

  // get org name from selected org guid
  const orgDisplayName = orgsList
    .filter(org => org.guid === body.organisation)
    .map(org => org.name)
    .toString();

  // get admin user details to populate requester field for zendesk
  const adminUser: IUaaUser | null = await uaa.getUser(ctx.token.userID);

 // send zendesk api request with all the data
  const client = zendesk.createClient(ctx.app.zendeskConfig);
  await client.tickets.create({
    ticket: {
      comment: {
        body: contactOrgManagersZendeskContent({
          organisation: orgDisplayName,
          message: body.message,
          managerRole: body.managerRole,
        },
        ctx.viewContext.location),
      },
      subject: '[PaaS Support] About your organisation on GOV.UK PaaS',
      status: 'pending',
      tags: ['govuk_paas_support'],
      requester: constructZendeskRequesterObject(adminUser),
      email_ccs: orgUserEmails,
    },
  });

  template.title = 'Message has been sent';

  return {
    body: template.render(
      <ContactOrganisationManagersConfirmationPage
        linkTo={ctx.linkTo}
        heading={'Message has been sent'}
        text={'A Zendesk ticket has also been created to track progress.'}
      >
        <a className="govuk-link"
          href="/platform-admin/contact-organisation-managers">
            Contact more organisation managers
        </a>.
      </ContactOrganisationManagersConfirmationPage>,
    ),
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
