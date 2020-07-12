import React from 'react';

import { Template } from '../../layouts';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { IValidationError } from '../errors/types';

import {
  ContactUsPage,
  FindOutMorePage,
  HelpUsingPaasPage,
  ISupportSelectionFormProperties,
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

interface ISomethingWrongWithServiceForm extends ISupportFormName, ISupportFormEmail, ISupportFormMessage {
  readonly affected_paas_organisation: string;
  readonly impact_severity: string;
  readonly values?: {
    readonly name: string;
    readonly email: string;
    readonly message: string;
    readonly affected_paas_organisation: string;
    readonly impact_severity: string;
  };
}

interface IHelpUsingPaasForm extends ISupportFormName, ISupportFormEmail, ISupportFormMessage {
  readonly paas_organisation_name: string;
  readonly values?: {
    readonly name: string;
    readonly email: string;
    readonly message: string;
    readonly paas_organisation_name: string;
  };
}

interface IFindOutMoreForm extends ISupportFormName, ISupportFormEmail, ISupportFormMessage, ISupportFormGovOrgName {
  readonly values?: {
    readonly name: string;
    readonly email: string;
    readonly message: string;
    readonly gov_organisation_name: string;
  };
}

interface IContactUsForm extends
  ISupportFormName, ISupportFormEmail, ISupportFormMessage, ISupportFormDeptAgency, ISupportFormServiceTeam {
  readonly values?: {
    readonly name: string;
    readonly email: string;
    readonly message: string;
    readonly department_agency?: string;
    readonly service_team?: string;
  };
}

const VALID_EMAIL = /[^.]@[^.]/;

function validateSupportSelection({ support_type }: ISupportSelectionFormProperties): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!support_type) {
    errors.push({
      field: 'support_type',
      message: 'Select which type of support your require',
    });
  }

  return errors;
}

function validateName({ name }: ISupportFormName): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!name) {
    errors.push({
      field: 'name',
      message: 'Enter your full name',
    });
  }

  return errors;
}

function validateEmail({ email }: ISupportFormEmail): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!email || !VALID_EMAIL.test(email)) {
    errors.push({
      field: 'email',
      message: 'Enter an email address in the correct format, like name@example.com',
    });
  }

  return errors;
}

function validateMessage({ message }: ISupportFormMessage): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!message) {
    errors.push({
      field: 'message',
      message: 'Enter your message',
    });
  }

  return errors;
}

function validateAffectedOrg({ affected_paas_organisation }: ISomethingWrongWithServiceForm): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!affected_paas_organisation) {
    errors.push({
      field: 'affected_paas_organisation',
      message: 'Enter the name of the affected organisation',
    });
  }

  return errors;
}

function validateImpactSeverity({ impact_severity }: ISomethingWrongWithServiceForm): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!impact_severity) {
    errors.push({
      field: 'impact_severity',
      message: 'Select the severity of the impact',
    });
  }

  return errors;
}

function validateGovOrg({ gov_organisation_name }: ISupportFormGovOrgName): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!gov_organisation_name) {
    errors.push({
      field: 'gov_organisation_name',
      message: 'Enter your government organisation’s name',
    });
  }

  return errors;
}

function validateDepartmentAgency({ department_agency }: ISupportFormDeptAgency): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!department_agency) {
    errors.push({
      field: 'department_agency',
      message: 'Enter your department or agency',
    });
  }

  return errors;
}

function validateServiceTeam({ service_team }: ISupportFormServiceTeam): ReadonlyArray<IValidationError> {
  const errors: Array<IValidationError> = [];

  if (!service_team) {
    errors.push({
      field: 'service_team',
      message: 'Enter your service or team',
    });
  }

  return errors;
}

export async function SupportSelectionForm (ctx: IContext, _params: IParameters): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Get support');

  return {
    body: template.render(<SupportSelectionPage
      csrf={ctx.viewContext.csrf}
      errors={[]}
      values={[]}
    />),
  };
}

export async function HandleSupportSelectionFormPost (ctx: IContext, body: ISupportSelectionFormProperties): Promise<IResponse> {
  const errors: Array<IValidationError> = [];
  const template = new Template(ctx.viewContext);

  errors.push(
    ...validateSupportSelection(body),
  );

  if (errors.length > 0) {
    template.title = 'Error: Get support';

    return {
      body: template.render(<SupportSelectionPage
        csrf={ctx.viewContext.csrf}
        errors={errors}
        values={body}
      />),
    };
  }
}

export async function SomethingWrongWithServiceForm (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Something’s wrong with my live service');

  return {
    body: template.render(<SomethingWrongWithServicePage
      csrf={ctx.viewContext.csrf}
      errors={[]}
      values={[]}
    />),
  };
}

export async function HandleSomethingWrongWithServiceFormPost (ctx: IContext, params: IParameters, body: ISomethingWrongWithServiceForm): Promise<IResponse> {
  const errors: Array<IValidationError> = [];
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
        errors={errors}
        values={body}
      />),
    };
  } else {
    template.title = 'We have received your message';

    return {
      body: template.render(
        <SupportConfirmationPage
          linkTo={ctx.linkTo}
          heading={'We have received your message'}
          text={'We deal with the most critical issues first. During working hours we will start investigating critical issues within 20 minutes.'}
        >
        Outside of working hours we support critical issues only, and we aim to start working on the issue within 40 minutes.<br />
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
}

export async function HelpUsingPaasForm (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'I need some help using GOV.UK PaaS');

  return {
    body: template.render(<HelpUsingPaasPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      errors={[]}
      values={[]}
    />),
  };
}

export async function HandleHelpUsingPaasFormPost (ctx: IContext, params: IParameters,  body: IHelpUsingPaasForm): Promise<IResponse> {
  const errors: Array<IValidationError> = [];
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
    };
  } else {
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
}

export async function FindOutMoreForm (ctx: IContext): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'I’d like to find out more about GOV.UK PaaS');

  return {
    body: template.render(<FindOutMorePage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      errors={[]}
      values={[]}
    />),
  };
}

export async function HandleFindOutMoreFormPost (ctx: IContext, params: IParameters,  body: IFindOutMoreForm): Promise<IResponse> {
  const errors: Array<IValidationError> = [];
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
    };
  } else {
    template.title = 'We have received your message';

    return {
      body: template.render(
        <SupportConfirmationPage
          linkTo={ctx.linkTo}
          heading={'We have received your message'}
          text={'A member of our product team will be in touch. We try to reply to all queries by the end of the next working day.'}
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
}

export async function ContactUsForm (ctx: IContext, _params: IParameters): Promise<IResponse> {

  const template = new Template(ctx.viewContext, 'Contact us');

  return {
    body: template.render(<ContactUsPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      errors={[]}
      values={[]}
    />),
  };
}

export async function HandleContactUsFormPost (ctx: IContext, params: IParameters,  body: IContactUsForm): Promise<IResponse> {
  const errors: Array<IValidationError> = [];
  const template = new Template(ctx.viewContext);

  errors.push(
    ...validateName(body),
    ...validateEmail(body),
    ...validateMessage(body),
    ...validateDepartmentAgency(body),
    ...validateServiceTeam(body),
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
    };
  } else {
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
}