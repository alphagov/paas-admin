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