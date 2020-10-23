import axios, { AxiosResponse } from 'axios';
import * as zendesk from 'node-zendesk';
import React from 'react';

import { Template } from '../../layouts';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { IDualValidationError, IValidationError } from '../errors/types';

import {
  ContactUsPage,
  FindOutMorePage,
  HelpUsingPaasPage,
  IContactUsFormValues,
  IFindOutMoreFormValues,
  IHelpUsingPaasFormValues,
  ISignupFormValues,
  ISomethingWrongWithServiceFormValues,
  ISupportSelectionFormValues,
  JoiningExistingOrganisationPage,
  RequestAnAccountPage,
  SignUpPage,
  SomethingWrongWithServicePage,
  SupportConfirmationPage,
  SupportSelectionPage,
} from './views';

interface ISupportFormName {
  readonly name?: string;
}

interface ISupportFormEmail {
  readonly email?: string;
}

interface ISupportFormMessage {
  readonly message?: string;
}

interface ISupportFormGovOrgName {
  readonly gov_organisation_name?: string;
}

interface ISupportFormDeptAgency {
  readonly department_agency?: string;
}
interface ISupportFormServiceTeam {
  readonly service_team?: string;
}

interface ISomethingWrongWithServiceForm extends ISomethingWrongWithServiceFormValues {
  readonly values?: ISomethingWrongWithServiceFormValues;
}

interface IHelpUsingPaasForm extends IHelpUsingPaasFormValues {
  readonly values?: IHelpUsingPaasFormValues;
}

interface IFindOutMoreForm extends IFindOutMoreFormValues {
  readonly values?: IFindOutMoreFormValues;
}

interface IContactUsForm extends IContactUsFormValues {
  readonly values?: IContactUsFormValues;
}

interface ISignupForm extends ISignupFormValues {
  readonly values? : ISignupFormValues;
}

const VALID_EMAIL = /[^.]@[^.]/;
const TODAY_DATE = new Date();
const MAILCHIMP_API_SERVER = 'us2';
const MAILCHIMP_LIST_ID = "31ef176d08";

function signUpContent(variables: ISignupFormValues): string {
  const additionalUsers = `They would also like to invite:
  ${variables.additional_users ?
    variables.additional_users.map(user => (
      `- ${user.email} ${user.person_is_manager && user.person_is_manager === 'yes' ? '(org manager)' : ''}`
    )).join('\n') : ''}
  `;

  return `New organisation/account signup request from website

  From: ${variables.name}
  Email: ${variables.email} ${variables.person_is_manager === 'yes' ? '(org manager)' : ''}
  Department: ${variables.department_agency}
  Team/Service: ${variables.service_team}

  ${variables.additional_users && variables.additional_users.length > 0 && variables.invite_users === 'yes'
    ? additionalUsers
    : ''}`;
}

function findoutMoreContent(variables: IFindOutMoreFormValues): string {

  return `
    From: ${variables.name}
    Email: ${variables.email}
    Organisation name: ${variables.gov_organisation_name}
    ---
    ${variables.message}
  `;
}

function somethingWrongWithServiceContent(variables: ISomethingWrongWithServiceFormValues): string {

  return `
    From: ${variables.name}
    Email: ${variables.email}
    Organisation name: ${variables.affected_paas_organisation}
    Severity: ${variables.impact_severity}
    ---
    ${variables.message}
  `;
}

function helpUsingPaasContent(variables: IHelpUsingPaasFormValues): string {

  return `
    From: ${variables.name}
    Email: ${variables.email}
    Organisation name: ${variables.paas_organisation_name ? variables.paas_organisation_name : 'not provided'}
    ---
    ${variables.message}
  `;
}

function contactUsContent(variables: IContactUsFormValues): string {

  return `
    From: ${variables.name}
    Email: ${variables.email}
    Department or agency name: ${variables.department_agency}
    Service or team name: ${variables.service_team}
    ---
    ${variables.message}
  `;
}

function validateSupportSelection({ support_type }: ISupportSelectionFormValues): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!support_type) {
    errors.push({
      field: 'support_type',
      message: 'Select which type of support your require',
    });
  }

  return errors;
}

function validateName({ name }: ISupportFormName): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!name) {
    errors.push({
      field: 'name',
      message: 'Enter your full name',
    });
  }

  return errors;
}

function validateEmail({ email }: ISupportFormEmail): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!email || !VALID_EMAIL.test(email)) {
    errors.push({
      field: 'email',
      message: 'Enter an email address in the correct format, like name@example.com',
    });
  }

  return errors;
}

function validateMessage({ message }: ISupportFormMessage): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!message) {
    errors.push({
      field: 'message',
      message: 'Enter your message',
    });
  }

  return errors;
}

function validateAffectedOrg(
  { affected_paas_organisation }: ISomethingWrongWithServiceForm,
): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!affected_paas_organisation) {
    errors.push({
      field: 'affected_paas_organisation',
      message: 'Enter the name of the affected organisation',
    });
  }

  return errors;
}

function validateImpactSeverity({ impact_severity }: ISomethingWrongWithServiceForm): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!impact_severity) {
    errors.push({
      field: 'impact_severity',
      message: 'Select the severity of the impact',
    });
  }

  return errors;
}

function validateGovOrg({ gov_organisation_name }: ISupportFormGovOrgName): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!gov_organisation_name) {
    errors.push({
      field: 'gov_organisation_name',
      message: 'Enter your government organisation’s name',
    });
  }

  return errors;
}

function validateDepartmentAgency({ department_agency }: ISupportFormDeptAgency): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!department_agency) {
    errors.push({
      field: 'department_agency',
      message: 'Enter your department or agency',
    });
  }

  return errors;
}

function validateServiceTeam({ service_team }: ISupportFormServiceTeam): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!service_team) {
    errors.push({
      field: 'service_team',
      message: 'Enter your service or team',
    });
  }

  return errors;
}

function validateSignupEmail({ email }: ISignupForm): ReadonlyArray<IDualValidationError> {
  const errors = [];

  const allowedEmailAddresses =
    /(.+\.gov\.uk|.+nhs\.(net|uk)|.+mod\.uk|.+digitalaccessibilitycentre\.org|.+\.police\.uk|police\.uk)$/;

  if (!email || !VALID_EMAIL.test(email)) {
    errors.push({
      field: 'email',
      message: 'Enter an email address in the correct format, like name@example.com',
    });
  }

  if (email && VALID_EMAIL.test(email) && !allowedEmailAddresses.test(email)) {
    errors.push({
      field: 'email',
      message: 'We only accept .gov.uk, .mod.uk, nhs.net, nhs.uk, digitalaccessibilitycentre.org, .police.uk or ' +
        'police.uk email addresses',
      messageExtra: `
        If you work for a government organisation or public body with a different email address, please contact us on
        <a class="govuk-link"
          href="mailto:gov-uk-paas-support@digital.cabinet-office.gov.uk"
        >
          gov-uk-paas-support@digital.cabinet-office.gov.uk
        </a>`,
    });
  }

  return errors;
}

function validatePersonIsManager({ person_is_manager }: ISignupForm): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!person_is_manager) {
    errors.push({
      field: 'person_is_manager',
      message: 'Select the appropriate option for an org manager',
    });
  }

  return errors;
}

function validateInviteUsers({ invite_users }: ISignupForm): ReadonlyArray<IValidationError> {
  const errors = [];

  if (!invite_users) {
    errors.push({
      field: 'invite_users',
      message: 'Select "Yes" if you would like to invite users to your organisation',
    });
  }

  return errors;
}

function validateAdditionalUserYesButEmpty({
  invite_users,
  additional_users,
}: ISignupForm): ReadonlyArray<IValidationError> {
  const errors = [];

  if (invite_users === 'yes' && additional_users?.every(user => user.email === '')) {
    errors.push({
        field: 'additional_users-0',
        message: 'Enter at least one additional user email address',
      });
  }

  return errors;
}

function validateAdditionalUserEmail({ additional_users }: ISignupForm): ReadonlyArray<IValidationError> {
  const errors = [];
  if (additional_users) {
    // eslint-disable-next-line functional/no-let
    for (let i = 0; i < additional_users.length; i++) {
      if (additional_users[i].email && !VALID_EMAIL.test(additional_users[i].email)) {
        errors.push({
          field: `additional_users-${i}`,
          message: `Enter additional user ${i+1} email address in the correct format, like name@example.com`,
        });
      }
    }
  }

  return errors;
}

async function mailchimpSignUp(
  { apiKey, apiServer, listID }: {
    readonly apiKey: string;
    readonly apiServer: string;
    readonly listID: string;
  },
  { email, name }: {
    readonly email: string;
    readonly name: string;
  },
): Promise<AxiosResponse> {
  const names = name.split(' ');

  // Docs: https://mailchimp.com/developer/guides/create-your-first-audience/#add-a-contact-to-an-audience
  return await axios.request({
    auth: { password: apiKey, username: 'key' },
    baseURL: `https://${apiServer}.api.mailchimp.com`,
    data: {
      email_address: email,
      merge_fields: {
        FNAME: names[0],
        LNAME: names.pop(),
      },
      status: 'pending', // `pending` will send out an email asking to confirm signup.
      tags: [ 'announce', 'essential' ],
    },
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'post',
    url: `/3.0/lists/${listID}/members`,
  });
}

export async function SupportSelectionForm (ctx: IContext, _params: IParameters): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Get support');

  return await Promise.resolve({
    body: template.render(<SupportSelectionPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
    />),
  });
}

export async function HandleSupportSelectionFormPost (
  ctx: IContext,
  _params: IParameters,
  body: ISupportSelectionFormValues,
): Promise<IResponse> {
  const errors = [];
  const template = new Template(ctx.viewContext);

  errors.push(
    ...validateSupportSelection(body),
  );

  if (errors.length > 0) {
    template.title = 'Error: Get support';

    return await Promise.resolve({
      body: template.render(<SupportSelectionPage
        csrf={ctx.viewContext.csrf}
        errors={errors}
        linkTo={ctx.linkTo}
        values={body}
      />),
      status: 400,
    });
  }

  return await Promise.resolve({
    body: template.render(<SupportSelectionPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      values={body}
    />),
  });
}

export async function SomethingWrongWithServiceForm (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Something’s wrong with my live service');

  return await Promise.resolve({
    body: template.render(<SomethingWrongWithServicePage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
    />),
  });
}

export async function HandleSomethingWrongWithServiceFormPost(
  ctx: IContext,
  _params: IParameters,
  body: ISomethingWrongWithServiceForm,
): Promise<IResponse> {
  const errors = [];
  const template = new Template(ctx.viewContext);

  errors.push(
    ...validateName(body),
    ...validateEmail(body),
    ...validateAffectedOrg(body),
    ...validateImpactSeverity(body),
    ...validateMessage(body),
    );
  if (errors.length > 0) {
    template.title = 'Error: Something’s wrong with my live service';

    return {
      body: template.render(<SomethingWrongWithServicePage
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        errors={errors}
        values={body}
      />),
      status: 400,
    };
  }

  const client = zendesk.createClient(ctx.app.zendeskConfig);

  await client.requests.create({
    request: {
      comment: {
        body: somethingWrongWithServiceContent({
          affected_paas_organisation: body.affected_paas_organisation,
          email: body.email,
          impact_severity: body.impact_severity,
          message: body.message,
          name: body.name,
        }),
      },
      requester: {
        email: body.email,
        name: body.name,
      },
      subject: `[PaaS Support] ${TODAY_DATE.toDateString()} something wrong in ${body.affected_paas_organisation} live
        service`,
    },
  });
  template.title = 'We have received your message';

  return {
    body: template.render(
      <SupportConfirmationPage
        linkTo={ctx.linkTo}
        heading={'We have received your message'}
        text={`We deal with the most critical issues first. During working hours we will start investigating critical
          issues within 20 minutes.`}
      >
      Outside of working hours we support critical issues only, and we aim to start working on the issue within
      40 minutes.<br />
      If the issue is not impacting your service, we aim to start working on your request within 1 business day.<br />
      Read more about our{' '}
        <a className="govuk-link"
          href="https://www.cloud.service.gov.uk/support-and-response-times">
            support and resolution times
        </a>.
      </SupportConfirmationPage>,
    ),
  };
}

export async function HelpUsingPaasForm (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'I need some help using GOV.UK PaaS');

  return await Promise.resolve({
    body: template.render(<HelpUsingPaasPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
    />),
  });
}

export async function HandleHelpUsingPaasFormPost(
  ctx: IContext,
  _params: IParameters,
  body: IHelpUsingPaasForm,
): Promise<IResponse> {
  const errors = [];
  const template = new Template(ctx.viewContext);

  errors.push(
    ...validateName(body),
    ...validateEmail(body),
    ...validateMessage(body));
  if (errors.length > 0) {
    template.title = 'Error: I need some help using GOV.UK PaaS';

    return {
      body: template.render(<HelpUsingPaasPage
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        errors={errors}
        values={body}
      />),
      status: 400,
    };
  }

  const client = zendesk.createClient(ctx.app.zendeskConfig);

  await client.requests.create({
    request: {
      comment: {
        body: helpUsingPaasContent({
          email: body.email,
          message: body.message,
          name: body.name,
          paas_organisation_name: body.paas_organisation_name,
        }),
      },
      requester: {
        email: body.email,
        name: body.name,
      },
      subject: `[PaaS Support] ${TODAY_DATE.toDateString()} request for help`,
    },
  });

  template.title = 'We have received your message';

  return {
    body: template.render(
      <SupportConfirmationPage
        linkTo={ctx.linkTo}
        heading={'We have received your message'}
        text={'We try to reply to all queries by the end of the next working day.'}
      >
        Read more about our{' '}
        <a className="govuk-link"
          href="https://www.cloud.service.gov.uk/support-and-response-times">
            support and resolution times
        </a>.
      </SupportConfirmationPage>,
    ),
  };
}

export async function FindOutMoreForm (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'I’d like to find out more about GOV.UK PaaS');

  return await Promise.resolve({
    body: template.render(<FindOutMorePage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
    />),
  });
}

export async function HandleFindOutMoreFormPost (
  ctx: IContext,
  _params: IParameters,
  body: IFindOutMoreForm,
): Promise<IResponse> {
  const errors = [];
  const template = new Template(ctx.viewContext);
  errors.push(
    ...validateName(body),
    ...validateEmail(body),
    ...validateGovOrg(body),
    ...validateMessage(body),
  );

  if (errors.length > 0) {
    template.title = 'Error: I’d like to find out more about GOV.UK PaaS';

    return {
      body: template.render(<FindOutMorePage
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        errors={errors}
        values={body}
      />),
      status: 400,
    };
  }


  const client = zendesk.createClient(ctx.app.zendeskConfig);

  await client.requests.create({
    request: {
      comment: {
        body: findoutMoreContent({
          email: body.email,
          gov_organisation_name: body.gov_organisation_name,
          message: body.message,
          name: body.name,
        }),
      },
      requester: {
        email: body.email,
        name: body.name,
      },
      subject: `[PaaS Support] ${TODAY_DATE.toDateString()} request for information`,
    },
  });

  template.title = 'We have received your message';

  return {
    body: template.render(
      <SupportConfirmationPage
        linkTo={ctx.linkTo}
        heading={'We have received your message'}
        text={`A member of our product team will be in touch. We try to reply to all queries by the end of the next
          working day.`}
      >
        Read more about our{' '}
        <a className="govuk-link"
          href="https://www.cloud.service.gov.uk/roadmap">
            roadmap and features
        </a>.
      </SupportConfirmationPage>,
    ),
  };
}

export async function ContactUsForm (ctx: IContext, _params: IParameters): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Contact us');

  return await Promise.resolve({
    body: template.render(<ContactUsPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
    />),
  });
}

export async function HandleContactUsFormPost(
  ctx: IContext,
  _params: IParameters,
  body: IContactUsForm,
): Promise<IResponse> {
  const errors = [];
  const template = new Template(ctx.viewContext);

  errors.push(
    ...validateName(body),
    ...validateEmail(body),
    ...validateDepartmentAgency(body),
    ...validateServiceTeam(body),
    ...validateMessage(body),
  );

  if (errors.length > 0) {
    template.title = 'Error: Contact us';

    return {
      body: template.render(<ContactUsPage
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        errors={errors}
        values={body}
      />),
      status: 400,
    };
  }

  const client = zendesk.createClient(ctx.app.zendeskConfig);

  await client.requests.create({
    request: {
      comment: {
        body: contactUsContent({
          department_agency: body.department_agency,
          email: body.email,
          message: body.message,
          name: body.name,
          service_team: body.service_team,
        }),
      },
      requester: {
        email: body.email,
        name: body.name,
      },
      subject: `[PaaS Support] ${TODAY_DATE.toDateString()} support request from website`,
    },
  });

  template.title = 'We have received your message';

  return {
    body: template.render(
      <SupportConfirmationPage
        linkTo={ctx.linkTo}
        heading={'We have received your message'}
        text={'We will contact you on the next working day.'}
      >
        <a className="govuk-link"
          href="https://www.cloud.service.gov.uk/get-started">
            See the next steps to get started
        </a>.
      </SupportConfirmationPage>,
    ),
  };
}

export async function RequestAnAccountForm(ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Request a GOV.UK PaaS account');

  return await Promise.resolve({
    body: template.render(<RequestAnAccountPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      />),
  });
}

export async function JoiningExistingOrganisationNotice (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Joining an existing organisation');

  return await Promise.resolve({
    body: template.render(<JoiningExistingOrganisationPage/>),
  });
}

export async function SignupForm (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Request a GOV.UK PaaS account');

  return await Promise.resolve({
    body: template.render(<SignUpPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
    />),
  });
}

export async function HandleSignupFormPost(
  ctx: IContext,
  _params: IParameters,
  body: ISignupFormValues,
): Promise<IResponse> {
  const errors = [];
  const template = new Template(ctx.viewContext);
  errors.push(
    ...validateName(body),
    ...validateSignupEmail(body),
    ...validateDepartmentAgency(body),
    ...validateServiceTeam(body),
    ...validatePersonIsManager(body),
    ...validateInviteUsers(body),
    ...validateAdditionalUserYesButEmpty(body),
    ...validateAdditionalUserEmail(body),
  );

  if (errors.length > 0) {
    template.title = 'Request a GOV.UK PaaS account';

    return {
      body: template.render(<SignUpPage
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        errors={errors}
        values={body}
      />),
      status: 400,
    };
  }

  const client = zendesk.createClient(ctx.app.zendeskConfig);

  await client.requests.create({
    request: {
      comment: {
        body: signUpContent({
          additional_users: body.additional_users,
          department_agency: body.department_agency,
          email: body.email,
          invite_users:body.invite_users,
          name: body.name,
          person_is_manager:body.person_is_manager,
          service_team: body.service_team,
        }),
      },
      requester: {
        email: body.email,
        name: body.name,
      },
      subject: `[PaaS Support] ${TODAY_DATE.toDateString()} Registration Request`,
    },
  });

  if (body.mailing_list === '1') {
    await mailchimpSignUp({
      apiKey: ctx.app.mailchimpAPIKey,
      apiServer: MAILCHIMP_API_SERVER,
      listID: MAILCHIMP_LIST_ID,
    }, body);
  }

  template.title = 'We have received your request';

  return {
    body: template.render(
      <SupportConfirmationPage
        linkTo={ctx.linkTo}
        heading={'We have received your request'}
        text={'We will email you with your organisation account details in the next working day.'}
      >
        <a className="govuk-link"
          href="https://www.cloud.service.gov.uk/get-started">
            See the next steps to get started
        </a>.
      </SupportConfirmationPage>,
    ),
  };
}
