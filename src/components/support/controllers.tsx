import React from 'react';

import { Template } from '../../layouts';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { IValidationError } from '../errors/types';

import {
  ISupportSelectionFormProperties,
  SomethingWrongWithServicePage,
  SupportSelectionPage,
  SupportConfirmationPage,
} from './views';

interface ISupportFormName {
  readonly name?: string;
  readonly values?: {
    readonly name: string;
  };
}

interface ISupportFormEmail {
  readonly email?: string;
}

interface ISupportFormMessage {
  readonly message?: string;
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

