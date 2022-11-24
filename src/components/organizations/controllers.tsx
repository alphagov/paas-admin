import lodash from 'lodash';
import React from 'react';

import * as zendesk from 'node-zendesk';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';
import UAAClient, { IUaaUser } from '../../lib/uaa';
import { IContext } from '../app/context';
import { IValidationError } from '../errors/types';
import { SuccessPage } from '../shared';

import { EmailManagers, EditOrganization, OrganizationsPage, IEmailManagersFormValues, EmailManagersConfirmationPage } from './views';
import { AccountsClient, IAccountsUser } from '../../lib/accounts';

import { IOrganization, OrganizationUserRoles } from '../../lib/cf/types';

import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
} from '../auth';

const TITLE_EMAIL_MANAGERS = 'Email managers';

interface IUpdateOrgDataBody {
  readonly name: string;
  readonly owner: string;
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

function checkFormField(variable: string, field: string, message: string): ReadonlyArray<IValidationError> {
  const errors = [];

  const isInvalid = !variable

  if (isInvalid) {
    errors.push({
      field,
      message,
    });
  }

  return errors;
}

export function constructSubject(userInput: string | undefined): string {
  const prefix = "[PaaS Support]"
  const defaultSubject = "About your organisation on GOV.UK PaaS"
  let subject:string = userInput ? userInput : defaultSubject
  return `${prefix} ${subject}`
}

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

// body of the zendesk email
export function emailManagersZendeskContent(variables: IEmailManagersFormValues, region: string, organisation: string): string {
  const managerType = variables.managerType === 'org_manager' ?
    'an organisation manager ' : variables.managerType === 'billing_manager' ? 
    'a billing manager' : `a space manager of ${variables.space} space`;
  // whitespace matters
    return `
${variables.message}

You are receiving this email as you are listed as ${managerType} in the ${organisation} organisation in our ${region.toUpperCase()} region.

Thank you,
GOV.UK PaaS`;
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

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );

  let [organizations] = await Promise.all([
    cf.organizations().then(sortOrganizationsByName),
  ]);

  let filterLink = {href: 'admin.organizations', text: 'Hide test and suspended organisations', view: 'realOrgsOnly' }

  // filter out test and suspended orgs
  // update the filter text
  if (_params && _params.view === 'realOrgsOnly') {
    const testOrgsRegex = new RegExp(/^(CATS?|ACC|BACC|SMOKE|PERF|AIVENBACC|ASATS)-/)
    organizations = organizations
    .filter(org => !org.entity.name.match(testOrgsRegex))
    .filter(org => org.entity.status !== 'suspended')

    filterLink = {href: 'admin.organizations', text: 'Show all', view: 'all' }
  }

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
        filterLink={filterLink}
        isAdmin={isAdmin}
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

  const realQuotas = quotas.filter(quota => !quota.name.match(/^(CATS|ACC|BACC|SMOKE|PERF|AIVENBACC|ASATS)-/));
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
    metadata: {
      ...organization.metadata,
      annotations: {
        ...organization.metadata.annotations,
        owner: body.owner,
      },
    },
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

export async function emailManagersForm(ctx: IContext, params: IParameters): Promise<IResponse> {
  if (!ctx.token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin');
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [
    spaces,
    organisation,
  ] = await Promise.all([
    cf.orgSpaces(params.organizationGUID),
    cf.organization(params.organizationGUID),
  ]);
  
  const template = new Template(ctx.viewContext, TITLE_EMAIL_MANAGERS);

  template.breadcrumbs = [
    { href: ctx.linkTo('admin.organizations'), text: 'Organisations' },
    {
      href: ctx.linkTo('admin.organizations.view', { organizationGUID: organisation.metadata.guid }),
      text: organisation.entity.name,
    },
    { text: TITLE_EMAIL_MANAGERS },
  ];

  return {
    body: template.render(<EmailManagers
      organisation={organisation}
      spaces={spaces}
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
    />),
  };
}

export async function emailManagersFormPost(
  ctx: IContext, _params: IParameters, body: IEmailManagersFormValues,
): Promise<IResponse> {
  if (!ctx.token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin');
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [
    spaces,
    organisation,
  ] = await Promise.all([
    cf.orgSpaces(_params.organizationGUID),
    cf.organization(_params.organizationGUID),
  ]);

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
    ...checkFormField(body.managerType, 'managerType', 'Select a manager role'),
    ...checkFormField(body.message, 'message', 'Enter your message'),
  );

  // if they've selected a space manager role, but not selected a space
  if(body.managerType === 'space_manager' && body.space === '') {
    errors.push(
      ...checkFormField(body.space, 'space', 'Select a space'),
    );
  }

  let emailAddressesArray:ReadonlyArray<any> = [];
  let filteredManagers:ReadonlyArray<any> = [];
  // different CF call needed to get org users and space users
  // we also need to look into paas-accounts for their actual email address
  if (body.space !== '' && body.managerType === 'space_manager') {
    
    const usersForGivenSpace = await cf.usersForSpace(body.space);
    filteredManagers = await Promise.all(
      usersForGivenSpace.filter(user => user.entity.space_roles.includes(body.managerType))
        .map(async manager => await accountsClient.getUser(manager.metadata.guid)),
    );
  } else {
    const usersForGivenOrg = await cf.usersForOrganization(_params.organizationGUID);
    filteredManagers = await Promise.all(
      usersForGivenOrg.filter(user => user.entity.organization_roles.includes(body.managerType as unknown as OrganizationUserRoles))
        .map(async manager => await accountsClient.getUser(manager.metadata.guid)),
    );
  }

  // create a zendesk api-friendly array of email address objects
  emailAddressesArray = Array.from(
    new Set(
      filteredManagers
        .filter((user): user is IAccountsUser => !!user)
        .filter(user => user.email)
        .map(user => ({ user_email: user.email })),
    ),
  );

  // if manager role type has been selected but there are no users with selected role, update the error message
  // message property is readonly so cannot just update the message
  if (emailAddressesArray.length === 0 && body.managerType !== 'space_manager') {
    /* istanbul ignore next */
    const managerTypeErrorIndex = errors.findIndex(
      error => error.field === 'managerType',
    );
    errors.splice(managerTypeErrorIndex, 0, { field: 'managerType', message: 'Select organisation does not have any of the selected manager roles' });
  }
  // selected space does not have any space managers
  if (emailAddressesArray.length === 0 && body.managerType === 'space_manager' && body.space !== '') {
    /* istanbul ignore next */
    const spaceErrorIndex = errors.findIndex(
      error => error.field === 'space',
    );
    errors.splice(spaceErrorIndex, 0, { field: 'space', message: 'Selected space does not have any space managers' });
  }
    
  const template = new Template(ctx.viewContext, TITLE_EMAIL_MANAGERS);
  template.breadcrumbs = [
    { href: ctx.linkTo('admin.organizations'), text: 'Organisations' },
    {
      href: ctx.linkTo('admin.organizations.view', { organizationGUID: organisation.metadata.guid }),
      text: organisation.entity.name,
    },
    { text: TITLE_EMAIL_MANAGERS },
  ];
  
  // if there are errors, rerender the page with error messages
  if (errors.length > 0) {

    template.title = `Error: ${TITLE_EMAIL_MANAGERS}`;

    return {
      body: template.render(<EmailManagers
        organisation={organisation}
        spaces={spaces}
        errors={errors}
        values={body}
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
      />),
    };
  }

  // get admin user details to populate requester field for zendesk
  const adminUser: IUaaUser | null = await uaa.getUser(ctx.token.userID);

  const spaceName = spaces.filter(space => space.metadata.guid === body.space).map(space => space.entity.name)

 // send zendesk api request with all the data
  const client = zendesk.createClient(ctx.app.zendeskConfig);
  await client.tickets.create({
    ticket: {
      comment: {
        body: emailManagersZendeskContent({
          message: body.message,
          managerType: body.managerType,
          space: spaceName as any,
        },
        ctx.viewContext.location,
        organisation.entity.name),
      },
      subject: constructSubject(body.subject),
      status: 'pending',
      tags: ['govuk_paas_support'],
      requester: constructZendeskRequesterObject(adminUser),
      email_ccs: emailAddressesArray,
    },
  });

  template.title = 'Message has been sent';

  return {
    body: template.render(
      <EmailManagersConfirmationPage
        linkTo={ctx.linkTo}
        heading={'Message has been sent'}
        text={'A Zendesk ticket has also been created to track progress.'}
      >
        <a className="govuk-link"
          href="/organisations">
            Back to list of organisations
        </a>.
      </EmailManagersConfirmationPage>,
    ),
  };
}
