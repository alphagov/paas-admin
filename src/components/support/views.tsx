import React, { ReactElement, ReactNode } from 'react';

import { RouteLinker } from '../app';
import { IValidationError } from '../errors/types';

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

interface ISupportConfirmationPageProperties {
  readonly heading: string;
  readonly text: string;
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
}


export const supportFormFieldsText = {
  name: 'Full name',
  email_address: 'Email address',
  message: 'Message',
  affected_paas_organisation: 'The name of the organisation affected',
  optional_paas_organisation: 'GOV.UK PaaS organisation name (optional)',
  gov_organisation_name: 'government organisation\'s name',
  department_agency: 'Department or agency',
  service_team: 'Service or team',
  severity: {
    heading: 'How severely is this impacting your service?',
    service_down:'Live service is not available to end users',
    service_downgraded: 'End users are experiencing a degraded live service',
    cannot_operate_live: 'Can\'t make a critical change to live applications',
    cannot_operate_dev: 'Can\'t make changes to development applications',
    other: 'Other',
  },
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
      <div className="govuk-inset-text">
      <p className="govuk-body">GDS is <a href="https://gds.blog.gov.uk/2022/07/12/why-weve-decided-to-decommission-gov-uk-paas-platform-as-a-service/" className="govuk-link"> decommissioning GOV.UK PaaS</a> by 23 December 2023. We&apos;re no longer accepting new trial accounts.</p>
      <p className="govuk-body">Read our <a href="https://www.cloud.service.gov.uk/migration-guidance/" className="govuk-link">migration guidance</a> for tenants.</p>
      </div>
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
                <p
                  key={index}
                  id="support_type-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
        <p className="govuk-body">
          All the data we collect is processed in accordance with our <a className="govuk-link" href="https://www.cloud.service.gov.uk/privacy-notice/">privacy notice</a>.
        </p>
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
            Check the <a className="govuk-link" href="https://status.cloud.service.gov.uk/">GOV.UK PaaS status page </a> for known issues and to subscribe to updates on active incidents.
          </p>
          <p className="govuk-body">
            If there’s a critical issue with your live service, use the emergency contact details you have been sent.
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
              {supportFormFieldsText.name}
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <p
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
              {supportFormFieldsText.email_address}
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <p
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
              {supportFormFieldsText.affected_paas_organisation}
            </label>
            {props.errors
            ?.filter(error => error.field === 'affected_paas_organisation')
            .map((error, index) => (
              <p
                key={index}
                id="affected_paas_organisation-error"
                className="govuk-error-message"
              >
                <span className="govuk-visually-hidden">Error:</span>{' '}
                {error.message}
              </p>
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
                {supportFormFieldsText.severity.heading}
              </legend>
              {props.errors
              ?.filter(error => error.field === 'impact_severity')
              .map((error, index) => (
                <p
                  key={index}
                  id="impact_severity-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
              ))}
              <div className="govuk-radios">
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="impact_severity"
                    name="impact_severity"
                    type="radio"
                    value="service_down"
                    defaultChecked={props.values?.impact_severity === 'service_down'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="impact_severity">
                    {supportFormFieldsText.severity.service_down}
                  </label>
                </div>
                <div className="govuk-radios__item">
                  <input
                    className="govuk-radios__input"
                    id="impact_severity-1"
                    name="impact_severity"
                    type="radio"
                    value="service_downgraded"
                    defaultChecked={props.values?.impact_severity === 'service_downgraded'}
                  />
                  <label className="govuk-label govuk-radios__label" htmlFor="impact_severity-1">
                    {supportFormFieldsText.severity.service_downgraded}
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
                      {supportFormFieldsText.severity.cannot_operate_live}
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
                    Can&apos;t make changes to development applications
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
            {supportFormFieldsText.message}
            </label>
            {props.errors
              ?.filter(error => error.field === 'message')
              .map((error, index) => (
                <p
                  key={index}
                  id="message-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
        <h2 className="govuk-heading-m">Response times</h2>
        <p className="govuk-body">
          Our response times vary depending on:
        </p>
        <ul className="govuk-list govuk-list--bullet">
          <li>the nature of the request - we prioritise issues over queries</li>
          <li>the severity of the issue</li>
          <li>if a live service is affected</li>
          <li>if the request was raised in or outside of working hours</li>
        </ul>
        <p className="govuk-body">
          Working hours are between 9am and 5pm on weekdays, excluding bank holidays.
        </p>
        <p className="govuk-body">
        Outside of working hours we provide emergency support for critical incidents affecting live production services.
        </p>
        <p className="govuk-body">
          Read more about how we support <a href="https://www.cloud.service.gov.uk/support-and-response-times/">GOV.UK PaaS and our response times</a>. 
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
              {supportFormFieldsText.name}
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <p
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
              {supportFormFieldsText.email_address}
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <p
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
              Your {supportFormFieldsText.optional_paas_organisation}
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
            {supportFormFieldsText.message}
            </label>
            {props.errors
              ?.filter(error => error.field === 'message')
              .map((error, index) => (
                <p
                  key={index}
                  id="message-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
        <h2 className="govuk-heading-m">Other ways to get help</h2>
        <p className="govuk-body">
          You can:
        </p>
        <ul className="govuk-list govuk-list--bullet">
          <li>read the <a className="govuk-link" href="https://docs.cloud.service.gov.uk">GOV.UK PaaS documentation</a></li>
          <li>ask for help on the <a className="govuk-link" href="https://ukgovernmentdigital.slack.com/messages/govuk-paas">#govuk-paas UK Government Digital Slack channel</a> - you’ll need a government email address</li>
        </ul>
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
              {supportFormFieldsText.name}
            </label>
            {props.errors
              ?.filter(error => error.field === 'name')
              .map((error, index) => (
                <p
                  key={index}
                  id="name-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
              {supportFormFieldsText.email_address}
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <p
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
              {supportFormFieldsText.department_agency}
            </label>
            {props.errors
              ?.filter(error => error.field === 'department_agency')
              .map((error, index) => (
                <p
                  key={index}
                  id="department_agency-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
              {supportFormFieldsText.service_team} you work on
            </label>
            {props.errors
              ?.filter(error => error.field === 'service_team')
              .map((error, index) => (
                <p
                  key={index}
                  id="service_team-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
            {supportFormFieldsText.message}
            </label>
            {props.errors
              ?.filter(error => error.field === 'message')
              .map((error, index) => (
                <p
                  key={index}
                  id="message-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
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
      </div>
    </div>
  );
}

export function StaticIPs(): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <h1 className="govuk-heading-xl">GOV.UK PaaS Static IPs</h1>

      <p className="govuk-body">GOV.UK PaaS has 3 static egress IPs per region</p>

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
      <h1 className="govuk-heading-xl">GOV.UK PaaS memorandum of understanding for Crown bodies</h1>

      <p className="govuk-body">
        If you&apos;re a Crown body the memorandum of understanding terms apply when you use GOV.UK PaaS.
      </p>

      <p className="govuk-body">
        Download the:
      </p>

      <ul className="govuk-list govuk-list--bullet">
        <li>
          <a href="/downloads/govuk-paas-crown-mou.pdf" className="govuk-link" download={true}>
            GOV.UK PaaS memorandum of understanding for Crown bodies [PDF]
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
      <h1 className="govuk-heading-xl">GOV.UK PaaS memorandum of understanding for non-Crown bodies</h1>

      <p className="govuk-body">
        If you&apos;re not a Crown body but you use GOV.UK PaaS the memorandum of understanding terms apply to you.
      </p>

      <p className="govuk-body">
        Download the:
      </p>

      <ul className="govuk-list govuk-list--bullet">
        <li>
          <a href="/downloads/govuk-paas-noncrown-mou.pdf" className="govuk-link" download={true}>
            GOV.UK PaaS memorandum of understanding for non-Crown bodies [PDF]
          </a>
        </li>
      </ul>

      <p className="govuk-body">
        These terms are confidential, and should not be shared outside of your organisation.
      </p>
    </div>
  </div>;
}
