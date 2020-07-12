import React, { ReactElement } from 'react';

import { RouteLinker } from '../app';
import { IValidationError } from '../errors/types';

interface IProperties {
  readonly linkTo: RouteLinker;
}
interface IFormProperties extends IProperties {
  readonly csrf: string;
  readonly errors?: ReadonlyArray<IValidationError>;
}

export interface ISupportSelectionFormProperties extends IFormProperties {
  readonly support_type: string;
  readonly values?: {
    readonly support_type: string;
  };
}

export interface ISomethingWrongWithServiceForm extends IFormProperties {
  readonly name: string;
  readonly email: string;
  readonly message: string;
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

export function SomethingWrongWithServicePage(props: ISomethingWrongWithServiceForm): ReactElement {
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
          <p className="govuk-body">If you have a critical issue, <a className="govuk-link" href="https://status.cloud.service.gov.uk/">start by checking the system status page</a>: if it&apos;s a known issue with the platform, it will show there and we&apos;ll keep our users updated on the progression of the incident.</p>
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
        <p className="govuk-body">If you have already sent your request for support and you think we’re not handling it in the way you would expect, please contact a member of the product team, who will reply during working hours.</p>
        <p className="govuk-body">To escalate an issue about a production service in or outside working hours, please use the emergency contact details you have been sent.</p>
      </div>
    </div>
  );
}