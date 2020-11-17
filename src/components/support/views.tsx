import React, { ReactElement, ReactNode } from 'react';

import { RouteLinker } from '../app';
import { IDualValidationError, IValidationError } from '../errors/types';

interface IProperties {
  readonly linkTo: RouteLinker;
}
interface IFormProperties extends IProperties {
  readonly csrf: string;
  readonly errors?: ReadonlyArray<IValidationError>;
}

export interface ISupportSelectionFormValues {
  readonly support_type: string;
}

interface ISupportSelectionFormProperties extends IFormProperties {
  readonly values?: ISupportSelectionFormValues;
}

export interface ISomethingWrongWithServiceFormValues {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly affected_paas_organisation: string;
  readonly impact_severity: string;
}

interface ISomethingWrongWithServiceFormProperties extends IFormProperties {
  readonly values?: ISomethingWrongWithServiceFormValues;
}

export interface IHelpUsingPaasFormValues {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly paas_organisation_name: string;
}

interface IHelpUsingPaasFormProperties extends IFormProperties {
  readonly values?: IHelpUsingPaasFormValues;
}

export interface IFindOutMoreFormValues {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly gov_organisation_name: string;
}

interface IFindOutMoreFormProperties extends IFormProperties {
  readonly values?: IFindOutMoreFormValues;
}

export interface IContactUsFormValues {
  readonly name: string;
  readonly email: string;
  readonly message: string;
  readonly department_agency: string;
  readonly service_team: string;
}

interface IContactUsFormProperties extends IFormProperties {
  readonly values?: IContactUsFormValues;
}

export interface ISignupFormValues {
  readonly email: string;
  readonly name: string;
  readonly department_agency: string;
  readonly service_team: string;
  readonly person_is_manager: string;
  readonly invite_users: string;
  readonly additional_users?: ReadonlyArray<{
    readonly email: string;
    readonly person_is_manager: string;
  }>;
}

interface ISignupFormProperties extends IFormProperties {
  readonly errors?: ReadonlyArray<IDualValidationError>;
  readonly values?: ISignupFormValues;
}

interface ISupportConfirmationPageProperties {
  readonly heading: string;
  readonly text: string;
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
}

export function SupportSelectionPage(props: ISupportSelectionFormProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
      {props.errors && props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}
      <h1 className="govuk-heading-l">Get support</h1>
      <form noValidate method="post">
        <input type="hidden" name="_csrf" value={props.csrf} />
        <div className={`govuk-form-group ${
            props.errors?.some(e => e.field === 'support_type')
                ? 'govuk-form-group--error'
                : ''
            }`}>
          <fieldset
            className="govuk-fieldset"
            aria-describedby={
              props.errors?.some(e => e.field === 'support_type')
                ? 'support_type-error'
                : ''
            }
            >
            <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">
                How can we help you?
            </legend>
            {props.errors
              ?.filter(error => error.field === 'support_type')
              .map((error, index) => (
                <span
                  key={index}
                  id="support_type-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <div className="govuk-radios">
              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="support_type"
                  name="support_type" type="radio"
                  value="something-wrong-with-service"
                  defaultChecked={props.values?.support_type === 'something-wrong-with-service'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="support_type">
                  Something&apos;s wrong with my live service
                </label>
              </div>
              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="support_type-1"
                  name="support_type"
                  type="radio"
                  value="help-using-paas"
                  defaultChecked={props.values?.support_type === 'help-using-paas'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="support_type-1">
                  I need some help using GOV.UK PaaS
                </label>
              </div>

              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="support_type-2"
                  name="support_type"
                  type="radio"
                  value="find-out-more"
                  defaultChecked={props.values?.support_type === 'find-out-more'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="support_type-2">
                  I&apos;d like to find out more about GOV.UK PaaS
                </label>
              </div>

              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="support_type-3"
                  name="support_type"
                  type="radio"
                  value="request-an-account"
                  defaultChecked={props.values?.support_type === 'request-an-account'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="support_type-3">
                  Request a GOV.UK PaaS account
                </label>
              </div>

              <div className="govuk-radios__divider">or</div>

              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="support_type-4"
                  name="support_type"
                  type="radio"
                  value="contact-us"
                  defaultChecked={props.values?.support_type === 'contact-us'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="support_type-4">
                  Contact us for any other query
                </label>
              </div>
            </div>
          </fieldset>
        </div>
        <button
          className="govuk-button"
          data-module="govuk-button"
          data-prevent-double-click="true"
        >
          Continue
        </button>
      </form>
      </div>
    </div>
  );
}

export function SomethingWrongWithServicePage(props: ISomethingWrongWithServiceFormProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        {props.errors && props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}
        <h1 className="govuk-heading-l">Something&apos;s wrong with my live service</h1>
        <div className="govuk-inset-text">
          <p className="govuk-body">
            If you have a critical issue, <a className="govuk-link" href="https://status.cloud.service.gov.uk/">start by
            checking the system status page</a>: if it&apos;s a known issue with the platform, it will show there and
            we&apos;ll keep our users updated on the progression of the incident.
          </p>
          <p className="govuk-body">
            If you are having a critical issue with a live service outside working hours, please use the emergency
            contact details you have been sent.
          </p>
        </div>
        <form noValidate method="post">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'name')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="name">
              Full name
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <span
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
           className={`govuk-input ${
            props.errors?.some(e => e.field === 'name')
                ? 'govuk-input--error'
                : ''
            }`}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            spellCheck="false"
            defaultValue={props.values?.name}
            aria-describedby={
              props.errors?.some(e => e.field === 'name')
                ? 'name-error'
                : ''
            }
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'email')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="email">
              Email address
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <span
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input className={`govuk-input ${
              props.errors?.some(e => e.field === 'email')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck="false"
              defaultValue={props.values?.email}
              aria-describedby={
                props.errors?.some(e => e.field === 'email')
                  ? 'email-error'
                  : ''
              }
               />
          </div>
          <div className={`govuk-form-group ${
            props.errors?.some(e => e.field === 'affected_paas_organisation')
                ? 'govuk-form-group--error'
                : ''
            }`}
          >
            <label className="govuk-label" htmlFor="affected_paas_organisation">
              The name of the organisation affected
            </label>
            {props.errors
            ?.filter(error => error.field === 'affected_paas_organisation')
            .map((error, index) => (
              <span
                key={index}
                id="affected_paas_organisation-error"
                className="govuk-error-message"
              >
                <span className="govuk-visually-hidden">Error:</span>{' '}
                {error.message}
              </span>
            ))
            }
            <input className={`govuk-input ${
              props.errors?.some(e => e.field === 'affected_paas_organisation')
                ? 'govuk-input--error'
                : ''
                }`
              }
              id="affected_paas_organisation"
              name="affected_paas_organisation"
              type="text"
              spellCheck="false"
              defaultValue={props.values?.affected_paas_organisation}
              aria-describedby={
                props.errors?.some(e => e.field === 'affected_paas_organisation')
                  ? 'affected_paas_organisation-error'
                  : ''
              }
            />
          </div>
          <div className={`govuk-form-group ${
            props.errors?.some(e => e.field === 'impact_severity')
                ? 'govuk-form-group--error'
                : ''
            }`}>
            <fieldset
              className="govuk-fieldset"
              aria-describedby={
                props.errors?.some(e => e.field === 'impact_severity')
                  ? 'impact_severity-error'
                  : ''
              }>
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">
                How severely is this impacting your service?
              </legend>
              {props.errors
              ?.filter(error => error.field === 'impact_severity')
              .map((error, index) => (
                <span
                  key={index}
                  id="impact_severity-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
              <div className="govuk-radios">
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="impact_severity"
                    name="impact_severity"
                    type="radio"
                    value="service-down"
                    defaultChecked={props.values?.impact_severity === 'service-down'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="impact_severity">
                    Your live service is not available to end users
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="impact_severity-1"
                    name="impact_severity"
                    type="radio"
                    value="service-downgraded"
                    defaultChecked={props.values?.impact_severity === 'service-downgraded'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="impact_severity-1">
                    End users are experiencing a degraded live service
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="impact_severity-2"
                    name="impact_severity"
                    type="radio"
                    value="cannot_operate_live"
                    defaultChecked={props.values?.impact_severity === 'cannot_operate_live'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="impact_severity-2">
                      You can&apos;t make a critical change to live applications
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="impact_severity-3"
                    name="impact_severity"
                    type="radio"
                    value="cannot_operate_dev"
                    defaultChecked={props.values?.impact_severity === 'cannot_operate_dev'}
                   />
                  <label className="govuk-label govuk-radios__label" htmlFor="impact_severity-3">
                    You can&apos;t make changes to development applications
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="impact_severity-4"
                    name="impact_severity"
                    type="radio"
                    value="other"
                    defaultChecked={props.values?.impact_severity === 'other'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="impact_severity-4">
                    Other
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'message')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="message">
            Message
            </label>
            {props.errors
              ?.filter(error => error.field === 'message')
              .map((error, index) => (
                <span
                  key={index}
                  id="message-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <textarea
              className={`govuk-textarea ${
                props.errors?.some(e => e.field === 'message')
                    ? 'govuk-textarea--error'
                    : ''
                }`}
              id="message"
              name="message"
              rows={5}
              aria-describedby={
                props.errors?.some(e => e.field === 'message')
                  ? 'message-error'
                  : ''
              }
              defaultValue={props.values?.message}
              >
            </textarea>
          </div>
          <button data-prevent-double-click="true" className="govuk-button" data-module="govuk-button">
            Submit
          </button>
        </form>
        <h2 className="govuk-heading-m">Escalate a request</h2>
        <p className="govuk-body">
          If you have already sent your request for support and you think we’re not handling it in the way you would
          expect, please contact a member of the product team, who will reply during working hours.
        </p>
        <p className="govuk-body">
          To escalate an issue about a production service in or outside working hours, please use the emergency contact
          details you have been sent.
        </p>
      </div>
    </div>
  );
}

export function SupportConfirmationPage(props: ISupportConfirmationPageProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <div className="govuk-panel govuk-panel--confirmation">
          <h1 className="govuk-panel__title">
            {props.heading}
          </h1>
          <div className="govuk-panel__body">
            {props.text}
          </div>
        </div>

        <p className="govuk-body">{props.children}</p>
      </div>
    </div>
  );
}

export function HelpUsingPaasPage(props: IHelpUsingPaasFormProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
      {props.errors && props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}
        <h1 className="govuk-heading-l">I need some help using GOV.UK PaaS</h1>
        <form noValidate method="post">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'name')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="name">
              Full name
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <span
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
           className={`govuk-input ${
            props.errors?.some(e => e.field === 'name')
                ? 'govuk-input--error'
                : ''
            }`}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            spellCheck="false"
            defaultValue={props.values?.name}
            aria-describedby={
              props.errors?.some(e => e.field === 'name')
                ? 'name-error'
                : ''
            }
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'email')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="email">
              Email address
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <span
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input className={`govuk-input ${
              props.errors?.some(e => e.field === 'email')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck="false"
              defaultValue={props.values?.email}
              aria-describedby={
                props.errors?.some(e => e.field === 'email')
                  ? 'email-error'
                  : ''
              }
               />
          </div>
          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="paas_organisation_name">
              Your GOV.UK PaaS organisation name (optional)
            </label>
            <input
            className="govuk-input"
            id="paas_organisation_name"
            name="paas_organisation_name"
            type="text"
            defaultValue={props.values?.paas_organisation_name}
            spellCheck="false"
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'message')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="message">
            Tell us a bit more about what you’re trying to do
            </label>
            {props.errors
              ?.filter(error => error.field === 'message')
              .map((error, index) => (
                <span
                  key={index}
                  id="message-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <textarea
              className={`govuk-textarea ${
                props.errors?.some(e => e.field === 'message')
                    ? 'govuk-textarea--error'
                    : ''
                }`}
              id="message"
              name="message"
              rows={5}
              aria-describedby={
                props.errors?.some(e => e.field === 'message')
                  ? 'message-error'
                  : ''
              }
              defaultValue={props.values?.message}
              >

            </textarea>
          </div>
          <button data-prevent-double-click="true" className="govuk-button" data-module="govuk-button">
            Submit
          </button>
        </form>
        <h2 className="govuk-heading-m">Other help you can get</h2>
        <p className="govuk-body">
          We publish our guidance on how to use the platform in
          our <a className="govuk-link" href="https://docs.cloud.service.gov.uk">documentation</a>.
        </p>
        <p className="govuk-body">
          You can also talk to us via the cross-government Slack
          channel <span className="govuk-!-font-weight-bold">#govuk-paas</span> on the UK Government Digital workspace,
          or the <span className="govuk-!-font-weight-bold">#paas</span> channel on the GDS workspace.
        </p>
      </div>
    </div>
  );
}

export function FindOutMorePage(props: IFindOutMoreFormProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
      {props.errors && props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}
        <h1 className="govuk-heading-l">I&apos;d like to find out more about GOV.UK PaaS</h1>
        <div className="govuk-inset-text">
          <p className="govuk-body">
            Contact us if you have a question about GOV.UK PaaS or you want to find out whether it&apos;s the right
            solution for your service.
          </p>
        </div>
        <form noValidate method="post">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'name')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="name">
              Full name
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <span
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
           className={`govuk-input ${
            props.errors?.some(e => e.field === 'name')
                ? 'govuk-input--error'
                : ''
            }`}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            spellCheck="false"
            defaultValue={props.values?.name}
            aria-describedby={
              props.errors?.some(e => e.field === 'name')
                ? 'name-error'
                : ''
            }
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'email')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="email">
              Email address
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <span
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input className={`govuk-input ${
              props.errors?.some(e => e.field === 'email')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck="false"
              defaultValue={props.values?.email}
              aria-describedby={
                props.errors?.some(e => e.field === 'email')
                  ? 'email-error'
                  : ''
              }
               />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'gov_organisation_name')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="gov_organisation_name">
              Your government organisation&apos;s name
            </label>
            {props.errors
              ?.filter(error => error.field === 'gov_organisation_name')
              .map((error, index) => (
                <span
                  key={index}
                  id="gov_organisation_name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
              className={`govuk-input ${
                props.errors?.some(e => e.field === 'gov_organisation_name')
                    ? 'govuk-input--error'
                    : ''
                }`
              }
              id="gov_organisation_name"
              name="gov_organisation_name"
              type="text"
              defaultValue={props.values?.gov_organisation_name}
              spellCheck="false"
              aria-describedby={
                props.errors?.some(e => e.field === 'gov_organisation_name')
                  ? 'gov_organisation_name-error'
                  : ''
              }
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'message')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="message">
            Tell us a bit more about what you need to know and we’ll be in contact to discuss it
            </label>
            {props.errors
              ?.filter(error => error.field === 'message')
              .map((error, index) => (
                <span
                  key={index}
                  id="message-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <textarea
              className={`govuk-textarea ${
                props.errors?.some(e => e.field === 'message')
                    ? 'govuk-textarea--error'
                    : ''
                }`}
              id="message"
              name="message"
              rows={5}
              aria-describedby={
                props.errors?.some(e => e.field === 'message')
                  ? 'message-error'
                  : ''
              }
              defaultValue={props.values?.message}
              >

            </textarea>
          </div>
          <button data-prevent-double-click="true" className="govuk-button" data-module="govuk-button">
            Submit
          </button>
        </form>
        <h2 className="govuk-heading-m">More information</h2>
        <p className="govuk-body">
          Our documentation lists
          the <a className="govuk-link" href="https://docs.cloud.service.gov.uk/#before-you-start">requirements for an
          app to run on GOV.UK PaaS</a>.
        </p>
        <p className="govuk-body">
          Read more about our <a className="govuk-link" href="https://www.cloud.service.gov.uk/features">features and
          roadmap</a>.
        </p>
        <p className="govuk-body">
          All the data we collect is processed in accordance with our <a className="govuk-link" href="https://www.cloud.service.gov.uk/privacy-notice">privacy notice</a>.
        </p>
      </div>
    </div>
  );
}

export function ContactUsPage(props: IContactUsFormProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        {props.errors && props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}
        <h1 className="govuk-heading-l">Contact us</h1>
        <form noValidate method="post">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'name')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="name">
              Full name
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <span
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
           className={`govuk-input ${
            props.errors?.some(e => e.field === 'name')
                ? 'govuk-input--error'
                : ''
            }`}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            spellCheck="false"
            defaultValue={props.values?.name}
            aria-describedby={
              props.errors?.some(e => e.field === 'name')
                ? 'name-error'
                : ''
            }
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'email')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="email">
              Email address
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <span
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input className={`govuk-input ${
              props.errors?.some(e => e.field === 'email')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck="false"
              defaultValue={props.values?.email}
              aria-describedby={
                props.errors?.some(e => e.field === 'email')
                  ? 'email-error'
                  : ''
              }
               />
          </div>
          <div className={`govuk-form-group ${
              props.errors?.some(e => e.field === 'department_agency')
                ? 'govuk-form-group--error'
                : ''
            }`}>
            <label className="govuk-label" htmlFor="department_agency">
              Department or agency
            </label>
            {props.errors
              ?.filter(error => error.field === 'department_agency')
              .map((error, index) => (
                <span
                  key={index}
                  id="department_agency-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
              className={`govuk-input ${
                props.errors?.some(e => e.field === 'department_agency')
                    ? 'govuk-input--error'
                    : ''
                }`}
              id="department_agency"
              name="department_agency"
              type="text"
              spellCheck="false"
              defaultValue={props.values?.department_agency}
              aria-describedby={
                props.errors?.some(e => e.field === 'department_agency')
                  ? 'department_agency-error'
                  : ''
              }
            />
          </div>
          <div className={`govuk-form-group ${
              props.errors?.some(e => e.field === 'service_team')
                ? 'govuk-form-group--error'
                : ''
            }`}>
            <label className="govuk-label" htmlFor="service_team">
              Service or team you work on
            </label>
            {props.errors
              ?.filter(error => error.field === 'service_team')
              .map((error, index) => (
                <span
                  key={index}
                  id="service_team-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
              className={`govuk-input ${
                props.errors?.some(e => e.field === 'service_team')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="service_team"
              name="service_team"
              type="text"
              spellCheck="false"
              defaultValue={props.values?.service_team}
              aria-describedby={
                props.errors?.some(e => e.field === 'service_team')
                  ? 'service_team-error'
                  : ''
              }
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'message')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="message">
            Message
            </label>
            {props.errors
              ?.filter(error => error.field === 'message')
              .map((error, index) => (
                <span
                  key={index}
                  id="message-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <textarea
              className={`govuk-textarea ${
                props.errors?.some(e => e.field === 'message')
                    ? 'govuk-textarea--error'
                    : ''
                }`}
              id="message"
              name="message"
              rows={5}
              aria-describedby={
                props.errors?.some(e => e.field === 'message')
                  ? 'message-error'
                  : ''
              }
              defaultValue={props.values?.message}
              >
            </textarea>
          </div>
          <button data-prevent-double-click="true" className="govuk-button" data-module="govuk-button">
            Submit enquiry
          </button>
        </form>
      </div>
    </div>
  );
}

export function RequestAnAccountPage(props: IFormProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <h1 className="govuk-heading-l">Request a GOV.UK PaaS account</h1>

        <p className="govuk-body">
          Service teams on GOV.UK PaaS own and use an account called an `organisation.`
        </p>

        <p className="govuk-body">
          New accounts are created on our London platform. If you require hosting in Ireland
          please <a className="govuk-link" href="/support/contact-us">get in contact</a>.
        </p>
        <form noValidate method="post">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <div className="govuk-form-group">
            <fieldset className="govuk-fieldset" aria-describedby="create-an-org-hint">
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">
                <h1 className="govuk-fieldset__heading">
                  Do you want to create an organisation?
                </h1>
              </legend>
              <span id="create-an-org-hint" className="govuk-hint">
                An organisation typically represents the government department, agency or team you work for.
              </span>
              <div className="govuk-radios">
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="create-an-org"
                    name="create-an-org"
                    type="radio"
                    defaultChecked={true}
                    value="yes"
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="create-an-org">
                    Yes, I&apos;m new to PaaS and want to create an organisation
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="create-an-org-1"
                    name="create-an-org"
                    type="radio"
                    value="no"
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="create-an-org-1">
                    No, I&apos;d like to join an existing organisation
                  </label>
                </div>
              </div>
            </fieldset>
          </div>
          <button data-prevent-double-click="true" className="govuk-button" data-module="govuk-button">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export function JoiningExistingOrganisationPage(): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
      <h1 className="govuk-heading-l">Joining an existing organisation</h1>
      <p className="govuk-body">
        If your team is already using GOV.UK PaaS and you would like a user account, ask your org manager
        to <a href="https://docs.cloud.service.gov.uk/orgs_spaces_users.html#managing-organisations-spaces-and-users">
          send you an account invitation
        </a>.
      </p>
      <p className="govuk-body">
        Org managers administer the account and assign roles and permissions.
      </p>
      <p className="govuk-body">
        Users with non-government email addresses can be added to an account at the request of an org manager.
      </p>
      <p className="govuk-body">
        If you don&apos;t know who the org manager is please contact support.
      </p>
      <a className="govuk-button" href="/support/contact-us">Contact support</a>
      </div>
    </div>
  );
}

export function SignUpPage(props: ISignupFormProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        {props.errors && props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              There is a problem
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}
        <h1 className="govuk-heading-l">Request a GOV.UK PaaS account</h1>
        <form noValidate method="post">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <h2 className="govuk-heading-m">Your details</h2>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'name')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="name">
              Full name
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <span
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
            className={`govuk-input ${
            props.errors?.some(e => e.field === 'name')
                ? 'govuk-input--error'
                : ''
            }`}
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            spellCheck="false"
            defaultValue={props.values?.name}
            aria-describedby={
              props.errors?.some(e => e.field === 'name')
                ? 'name-error'
                : ''
            }
            />
          </div>
          <div className={`govuk-form-group ${
                props.errors?.some(e => e.field === 'email')
                  ? 'govuk-form-group--error'
                  : ''
              }`}>
            <label className="govuk-label" htmlFor="email">
              Email address
            </label>
            <span id="email-hint" className="govuk-hint">
              Must be from a government organisation or public body
            </span>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <span
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                  {error.messageExtra ?
                  <span
                    className="govuk-!-display-block"
                  // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{ __html: error.messageExtra }} /> : ''
                  }
                </span>
              ))}
            <input className={`govuk-input ${
              props.errors?.some(e => e.field === 'email')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              spellCheck="false"
              defaultValue={props.values?.email}
              aria-describedby={
                props.errors?.some(e => e.field === 'email')
                  ? 'email-hint email-error'
                  : 'email-hint'
              }
            />
          </div>

          <h2 className="govuk-heading-m">Your organisation</h2>
          <div className={`govuk-form-group ${
              props.errors?.some(e => e.field === 'department_agency')
                ? 'govuk-form-group--error'
                : ''
            }`}>
            <label className="govuk-label" htmlFor="department_agency">
              Department or agency
            </label>
            {props.errors
              ?.filter(error => error.field === 'department_agency')
              .map((error, index) => (
                <span
                  key={index}
                  id="department_agency-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
              className={`govuk-input ${
                props.errors?.some(e => e.field === 'department_agency')
                    ? 'govuk-input--error'
                    : ''
                }`}
              id="department_agency"
              name="department_agency"
              type="text"
              spellCheck="false"
              defaultValue={props.values?.department_agency}
              aria-describedby={
                props.errors?.some(e => e.field === 'department_agency')
                  ? 'department_agency-error'
                  : ''
              }
            />
          </div>
          <div className={`govuk-form-group ${
              props.errors?.some(e => e.field === 'service_team')
                ? 'govuk-form-group--error'
                : ''
            }`}>
            <label className="govuk-label" htmlFor="service_team">
              Service or team you work on
            </label>
            {props.errors
              ?.filter(error => error.field === 'service_team')
              .map((error, index) => (
                <span
                  key={index}
                  id="service_team-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
              className={`govuk-input ${
                props.errors?.some(e => e.field === 'service_team')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="service_team"
              name="service_team"
              type="text"
              spellCheck="false"
              defaultValue={props.values?.service_team}
              aria-describedby={
                props.errors?.some(e => e.field === 'service_team')
                  ? 'service_team-error'
                  : ''
              }
            />
          </div>
          <div className={`govuk-form-group ${
              props.errors?.some(e => e.field === 'person_is_manager')
                ? 'govuk-form-group--error'
                : ''
            }`}>
            <fieldset className="govuk-fieldset"
              aria-describedby={
                props.errors?.some(e => e.field === 'person_is_manager')
                  ? 'person_is_manager-error person_is_manager-hint'
                  : 'person_is_manager-hint'
              }
            >
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                Will you be a manager of this organisation?
              </legend>
              <span id="person_is_manager-hint" className="govuk-hint">
                Organisations are controlled by ‘org managers’ who are responsible for administering the account and
                assigning roles and permissions to users within the organisation
              </span>
              {props.errors
              ?.filter(error => error.field === 'person_is_manager')
              .map((error, index) => (
                <span
                  key={index}
                  id="person_is_manager-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
              <div className="govuk-radios">
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="person_is_manager"
                    name="person_is_manager"
                    type="radio"
                    value="yes"
                    defaultChecked={props.values?.person_is_manager === 'yes'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="person_is_manager">
                    Yes, I will be an org manager for this organisation
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="person_is_manager-1"
                    name="person_is_manager"
                    type="radio"
                    value="no"
                    aria-describedby="person_is_manager-1-item-hint"
                    defaultChecked={props.values?.person_is_manager === 'no'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="person_is_manager-1">
                    No, I will nominate someone else to be an org manager
                  </label>
                  <div id="person_is_manager-1-item-hint" className="govuk-hint govuk-radios__hint">
                    You will need to specify at least one ‘org manager’ in order for us to set up your organisation.
                    If you do not intend to manage the organisation yourself you can invite your nominated manager in
                    the following section.
                  </div>
                </div>
              </div>
            </fieldset>
          </div>

          <h2>Invite users to your organisation</h2>
          <p className="govuk-body">
            Users who aren&apos;t org managers can deploy code but won&apos;t be able to administer the account.
          </p>
          <div className={`govuk-form-group ${
              props.errors?.some(e =>
                  e.field === 'invite_users' ||
                  e.field === 'additional_users-0' ||
                  e.field === 'additional_users-1' ||
                  e.field === 'additional_users-2'
                )
                ? 'govuk-form-group--error'
                : ''
            }`}>

            <fieldset className="govuk-fieldset"
              aria-describedby={
                ['invite_users-hint',
                  (props.errors?.some(e => e.field === 'invite_users') ? 'invite_users-error' : ''),
                ].concat(
                  (props.errors || []).filter(e => e.field.includes('additional_users')).map(e =>`${e.field}-error`),
                ).filter(x => x).join(' ')
              }
            >
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                Would you like to invite additional users now?
              </legend>
              <span id="invite_users-hint" className="govuk-hint">
                We recommend each &apos;organisation&apos; has at least two &apos;org managers&apos;
              </span>
              {props.errors
              ?.filter(error => error.field === 'invite_users')
              .map((error, index) => (
                <span
                  key={index}
                  id="invite_users-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
              <div className="govuk-radios govuk-radios--conditional" data-module="govuk-radios">
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="invite_users"
                    name="invite_users"
                    type="radio"
                    value="yes"
                    defaultChecked={props.values?.invite_users === 'yes'}
                    data-aria-controls="invite_users-conditional"
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="invite_users">
                    Yes, I&apos;d like to invite users to my organisation
                  </label>
                </div>
                <div className="govuk-radios__conditional" id="invite_users-conditional">
                  <table className="govuk-table">
                    <thead className="govuk-table__head">
                      <tr className="govuk-table__row">
                        <th scope="col" className="govuk-table__header">Email address</th>
                        <th scope="col" className="govuk-table__header">Org manager?</th>
                      </tr>
                    </thead>
                    <tbody className="govuk-table__body">
                      <tr className="govuk-table__row">
                            <td className="govuk-table__cell">
                              <div className="govuk-form-group">
                                <label className="govuk-label govuk-visually-hidden" htmlFor="additional_users-0">
                                  User 1 email address
                                </label>
                                {props.errors
                                  ?.filter(error => error.field === 'additional_users-0')
                                  .map((error, index) => (
                                    <span
                                      key={index}
                                      id="additional_users-0-error"
                                      className="govuk-error-message"
                                    >
                                      <span className="govuk-visually-hidden">Error:</span>{' '}
                                      {error.message}
                                    </span>
                                  ))}
                                <input
                                  className={`govuk-input ${
                                    props.errors?.some(e => e.field === 'additional_users-0')
                                      ? 'govuk-input--error'
                                      : ''
                                    }`
                                  }
                                  id="additional_users-0"
                                  name="additional_users[0][email]"
                                  type="text"
                                  defaultValue={props.values?.additional_users && props.values!.additional_users[0].email}
                                  aria-describedby={
                                    props.errors?.some(e => e.field === 'additional_users-0')
                                      ? 'additional_users-0-error' : ''
                                  }
                              />
                              </div>
                            </td>
                            <td className="govuk-table__cell">
                              <div className="govuk-checkboxes">
                                <div className="govuk-checkboxes__item">
                                  <input className="govuk-checkboxes__input"
                                    id="additional_users-0-is-manager"
                                    name="additional_users[0][person_is_manager]"
                                    type="checkbox"
                                    value="yes"
                                    defaultChecked={props.values?.additional_users && props.values!.additional_users[0].person_is_manager === 'yes'}
                                  />
                                  <label className="govuk-label govuk-checkboxes__label" htmlFor="additional_users-0-is-manager">
                                    <span className="govuk-visually-hidden">Assign org manager role to User 1?</span>
                                  </label>
                                </div>
                              </div>
                            </td>
                          </tr>
                      <tr className="govuk-table__row">
                        <td className="govuk-table__cell">
                          <div className="govuk-form-group">
                            <label className="govuk-label govuk-visually-hidden" htmlFor="additional_users-1">
                              User 2 email address
                            </label>
                            {props.errors
                              ?.filter(error => error.field === 'additional_users-1')
                              .map((error, index) => (
                                <span
                                  key={index}
                                  id="additional_users-1-error"
                                  className="govuk-error-message"
                                >
                                  <span className="govuk-visually-hidden">Error:</span>{' '}
                                  {error.message}
                                </span>
                              ))}
                            <input
                              className={`govuk-input ${
                                props.errors?.some(e => e.field === 'additional_users-1')
                                  ? 'govuk-input--error'
                                  : ''
                                }`
                              }
                              id="additional_users-1"
                              name="additional_users[1][email]"
                              type="text"
                              defaultValue={ props.values?.additional_users && props.values!.additional_users[1].email}
                              aria-describedby={
                                props.errors?.some(e => e.field === 'additional_users-1')
                                  ? 'additional_users-1-error' : ''
                              }
                            />
                          </div>
                        </td>
                        <td className="govuk-table__cell">
                          <div className="govuk-checkboxes">
                            <div className="govuk-checkboxes__item">
                              <input className="govuk-checkboxes__input"
                                id="additional_users-1-is-manager"
                                name="additional_users[1][person_is_manager]"
                                type="checkbox"
                                value="yes"
                                defaultChecked={props.values?.additional_users && props.values!.additional_users[1].person_is_manager === 'yes'}
                              />
                              <label className="govuk-label govuk-checkboxes__label" htmlFor="additional_users-1-is-manager">
                                <span className="govuk-visually-hidden">Assign org manager role to User 2?</span>
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr className="govuk-table__row">
                        <td className="govuk-table__cell">
                        <div className="govuk-form-group">
                            <label className="govuk-label govuk-visually-hidden" htmlFor="additional_users-2">
                              User 3 email address
                            </label>
                            {props.errors
                              ?.filter(error => error.field === 'additional_users-2')
                              .map((error, index) => (
                                <span
                                  key={index}
                                  id="additional_users-2-error"
                                  className="govuk-error-message"
                                >
                                  <span className="govuk-visually-hidden">Error:</span>{' '}
                                  {error.message}
                                </span>
                              ))}
                            <input
                              className={`govuk-input ${
                                props.errors?.some(e => e.field === 'additional_users-2')
                                  ? 'govuk-input--error'
                                  : ''
                                }`
                              }
                              id="additional_users-2"
                              name="additional_users[2][email]"
                              type="text"
                              defaultValue={ props.values?.additional_users && props.values!.additional_users[2].email}
                              aria-describedby={
                                props.errors?.some(e => e.field === 'additional_users-2')
                                  ? 'additional_users-2-error' : ''
                              }
                            />
                          </div>
                        </td>
                        <td className="govuk-table__cell">
                          <div className="govuk-checkboxes">
                            <div className="govuk-checkboxes__item">
                              <input className="govuk-checkboxes__input"
                                id="additional_users-2-is-manager"
                                name="additional_users[2][person_is_manager]"
                                type="checkbox"
                                value="yes"
                                defaultChecked={props.values?.additional_users && props.values!.additional_users[2].person_is_manager === 'yes'}
                              />
                              <label className="govuk-label govuk-checkboxes__label" htmlFor="additional_users-2-is-manager">
                                <span className="govuk-visually-hidden">Assign org manager role to User 3?</span>
                              </label>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="invite_users-1"
                    name="invite_users"
                    type="radio"
                    value="no"
                    defaultChecked={props.values?.invite_users === 'no'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="invite_users-1">
                    No, I&apos;ll do this later
                  </label>
                </div>
              </div>
            </fieldset>
          </div>

          <button data-prevent-double-click="true" className="govuk-button" data-module="govuk-button">
            Submit request
          </button>
        </form>
      </div>
    </div>
  );
}

export function StaticIPs(): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <h1 className="govuk-heading-xl">GOV.UK PaaS Static IPs</h1>

      <p className="govuk-body">GOV.UK PaaS has three static IPs per region</p>

      <dl className="govuk-summary-list">
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">London</dt>
          <dd className="govuk-summary-list__value">
            <ul className="govuk-list">
              <li>35.178.62.180</li>
              <li>18.130.41.69</li>
              <li>35.177.73.214</li>
            </ul>
          </dd>
        </div>

        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Ireland</dt>
          <dd className="govuk-summary-list__value">
            <ul className="govuk-list">
              <li>52.208.24.161</li>
              <li>52.208.1.143</li>
              <li>52.51.250.21</li>
            </ul>
          </dd>
        </div>
      </dl>
    </div>
  </div>;
}

export function DocumentsCrownMoU(): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <h1 className="govuk-heading-xl">Crown body Memorandum of Understanding</h1>

      <p className="govuk-body">
        If you&apos;re a crown body the memorandum of understanding terms apply when you use GOV.UK PaaS.
      </p>

      <p className="govuk-body">
        Download the:
      </p>

      <ul className="govuk-list govuk-list--bullet">
        <li>
          <a href="/downloads/crown-mou.pdf" className="govuk-link" download={true}>
            GOV.UK PaaS memorandum of understanding
          </a>
        </li>
      </ul>

      <p className="govuk-body">
        These terms are confidential, and should not be shared outside of your organisation.
      </p>
    </div>
  </div>;
}

export function DocumentsNonCrownMoU(): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <h1 className="govuk-heading-xl">non-Crown Memorandum of Understanding</h1>

      <p className="govuk-body">
        If you&apos;re not a crown body but you use GOV.UK PaaS the memorandum of understanding terms apply to you.
      </p>

      <p className="govuk-body">
        Download the:
      </p>

      <ul className="govuk-list govuk-list--bullet">
        <li>
          <a href="/downloads/non-crown-mou.pdf" className="govuk-link" download={true}>
            GOV.UK PaaS memorandum of understanding
          </a>
        </li>
      </ul>

      <p className="govuk-body">
        These terms are confidential, and should not be shared outside of your organisation.
      </p>
    </div>
  </div>;
}
