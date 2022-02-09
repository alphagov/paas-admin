import React, { ReactElement, ReactNode } from 'react';

import { SLUG_REGEX } from '../../layouts';
import {
  OrganizationUserRoles,
} from '../../lib/cf/types';
import { RouteLinker } from '../app';
import { IValidationError } from '../errors/types';
import { SuccessPage } from '../org-users/views';
import { owners } from '../organizations/owners';


interface IProperties {
  readonly linkTo: RouteLinker;
}

interface ICreateOrganizationSuccessPageProperties extends IProperties {
  readonly organizationGUID: string;
}

export interface INewOrganizationUserBody {
  readonly organization?: string;
  readonly owner?: string;
}

interface IFormProperties extends IProperties {
  readonly csrf: string;
  readonly errors?: ReadonlyArray<IValidationError>;
}

interface ICreateOrganizationPageProperties extends IFormProperties {
  readonly values?: INewOrganizationUserBody;
  readonly owners: ReadonlyArray<{
    readonly name: string;
    readonly owner: string;
  }>;
}

export interface IContactOrganisationManagersPageValues {
  readonly organisation: string;
  readonly message: string;
  readonly managerRole: OrganizationUserRoles;
}

interface IContactOrganisationManagersPageProperties extends IFormProperties {
  readonly orgs: ReadonlyArray<{
    readonly guid: string;
    readonly name: string;
    readonly suspended: boolean;
  }>;
  readonly values?: IContactOrganisationManagersPageValues;
}

interface ContactOrganisationManagersConfirmationPageProperties {
  readonly heading: string;
  readonly text: string;
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
}


function Costs(props: IFormProperties): ReactElement {
  return (
    <>
      <h2 className="govuk-heading-m">Costs</h2>

      <h3 className="govuk-heading-s">View costs for a month</h3>

      <form action={props.linkTo('platform-admin.redirect')} method="POST">
        <input type="hidden" name="_csrf" value={props.csrf} />

        <input type="hidden" name="action" value="view-costs" />

        <div className="govuk-form-group">
          <div className="govuk-date-input" id="passport-issued">
            <div className="govuk-date-input__item">
              <div className="govuk-form-group">
                <label
                  className="govuk-label govuk-date-input__label"
                  htmlFor="view-costs-month"
                >
                  Month
                </label>
                <select
                  className="govuk-select"
                  id="view-costs-month"
                  name="month"
                >
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                  <option value="04">April</option>
                  <option value="05">May</option>
                  <option value="06">June</option>
                  <option value="07">July</option>
                  <option value="08">August</option>
                  <option value="09">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
            </div>
            <div className="govuk-date-input__item">
              <div className="govuk-form-group">
                <label
                  className="govuk-label govuk-date-input__label"
                  htmlFor="view-costs-year"
                >
                  Year
                </label>
                <input
                  className="govuk-input govuk-date-input__input govuk-input--width-4"
                  id="view-costs-year"
                  name="year"
                  inputMode="numeric"
                  defaultValue={new Date().getFullYear()}
                  pattern="20[123][0-9]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="govuk-form-group">
          <label className="govuk-label govuk-date-input__label" htmlFor="view-costs-format">Format</label>
          <div className="govuk-radios govuk-radios--small">
            {[
              { label: 'Overall costs', value: 'cost' },
              { label: 'Costs by service', value: 'costbyservice' },
              {
                label: 'Spend for PMO team in CSV format',
                value: 'pmo-org-spend-csv',
              },
              { label: 'Sankey diagram', value: 'visualisation' },
            ].map((format, index) => (
              <div key={index} className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id={`view-costs-format-${format.value}`}
                  name="format"
                  type="radio"
                  defaultChecked={index === 0}
                  value={format.value}
                />

                <label
                  className="govuk-label govuk-radios__label"
                  htmlFor={`view-costs-format-${format.value}`}
                >
                  {format.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button className="govuk-button" type="submit">
          View costs
        </button>
      </form>
    </>
  );
}

function Organizations(props: IProperties): ReactElement {
  return (
    <>
      <h2 className="govuk-heading-m">Organisation management</h2>

      <ul className="govuk-list">
        <li>
          <a className="govuk-link" href={props.linkTo('platform-admin.create-organization.form')}>
            Create new organisation
          </a>
        </li>
        <li>
          <a className="govuk-link" href={props.linkTo('admin.reports.organizations')}>
            View trial and billable organisations
          </a>
        </li>
        <li>
          <a className="govuk-link" href={props.linkTo('platform-admin.contact-organization-managers')}>
            Contact organisation managers
          </a>
        </li>
      </ul>
    </>
  );
}

function Users(props: IFormProperties): ReactElement {
  return (
    <>
      <h2 className="govuk-heading-m">User management</h2>

      <h3 className="govuk-heading-s">Find a user</h3>

      <form action={props.linkTo('platform-admin.redirect')} method="POST">
        <input type="hidden" name="_csrf" value={props.csrf} />

        <input type="hidden" name="action" value="find-user" />

        <div className="govuk-form-group">
          <label className="govuk-label" htmlFor="find-user-email-or-user-guid">
            Email address or GUID
          </label>

          <input
            className="govuk-input"
            id="find-user-email-or-user-guid"
            name="email-or-user-guid"
            type="text"
          />
        </div>

        <button className="govuk-button">Find user</button>
      </form>
    </>
  );
}

export function PlatformAdministratorPage(
  props: IFormProperties,
): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">Platform Admin</h1>

      <div className="govuk-grid-row govuk-grid-row-vertically-separated">
        <div className="govuk-grid-column-full govuk-grid-column-one-third-from-desktop">
          <Costs {...props} />
        </div>
        <div className="govuk-grid-column-full govuk-grid-column-one-third-from-desktop">
          <Users {...props} />
        </div>
        <div className="govuk-grid-column-full govuk-grid-column-one-third-from-desktop">
          <Organizations {...props} />
        </div>
      </div>
    </>
  );
}

export function CreateOrganizationPage(props: ICreateOrganizationPageProperties): ReactElement {
  return (<div className="govuk-grid-row">
    <form method="post" className="govuk-grid-column-one-half">
      <h1 className="govuk-heading-xl">Create an Organisation</h1>

      <input type="hidden" name="_csrf" value={props.csrf} />

      {props.errors
        ? <div 
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
                  <li key={index}><a href={`#${error.field}`}>{error.message}</a></li>
                ))}
              </ul>
            </div>
          </div>
        : null}

      <p className="govuk-body">
        This form will only create the organisation and add annotation to the new entity.
        {' '}
        <strong>You will need to invite members of the organisation separately.</strong>
      </p>

      <div className="govuk-form-group">
        <label className="govuk-label" htmlFor="organization">
          Organisation name
        </label>
        <div id="organization-hint" className="govuk-hint">
          This needs to be all lowercase and hyphen separated meaningful name of the organisation.
          You can also refer to the section on the side for some examples.
        </div>
        <input id="organization" name="organization" className="govuk-input" aria-describedby="organization-hint"
          type="text" defaultValue={props.values?.organization} required={true} pattern={SLUG_REGEX} />
      </div>

      <div className="govuk-form-group">
        <label className="govuk-label" htmlFor="owner">
          Owner
        </label>
        <div id="owner-hint" className="govuk-hint">
          Choose an owner from the list. If one you are looking for does not exist, set it to <code>Unknown</code>,
          and ask person on support to add one in place.
        </div>
        <select className="govuk-select" id="owner" name="owner" aria-describedby="owner-hint" required={true}>
          <option selected={props.values?.owner === 'Unknown'}>Unknown</option>
          {owners.map(owner => <option key={owner} selected={props.values?.owner === owner}>{owner}</option>)}
        </select>
      </div>

      <button className="govuk-button" data-module="govuk-button" data-prevent-double-click="true">
        Create Organisation
      </button>
    </form>
  </div>);
}

export function CreateOrganizationSuccessPage(props: ICreateOrganizationSuccessPageProperties): ReactElement {
  return (
    <SuccessPage
    linkTo={props.linkTo}
    organizationGUID={props.organizationGUID}
    heading={'New organisation successfully created'}
    text={'You still need to invite people and assign permissions.'}
    >
  </SuccessPage>);
}

export function ContactOrganisationManagersPage(props: IContactOrganisationManagersPageProperties): ReactElement {
  return (<div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <form method="post" noValidate>
        <h1 className="govuk-heading-xl">Contact organisation managers</h1>

        <input type="hidden" name="_csrf" value={props.csrf} />

        {props.errors
          ? <div 
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
                    <li key={index}><a href={`#${error.field}`}>{error.message}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          : null
        }

        <p className="govuk-body">
        This form will create a Zendesk ticket and send an email to all selected managers of an organisation.
        </p>

        <div className={`govuk-form-group ${
            props.errors?.some(e => e.field === 'organisation')
              ? 'govuk-form-group--error'
              : ''
          }`}>
          <label className="govuk-label" htmlFor="organisation">
            Organisation name
          </label>
          {props.errors
            ?.filter(error => error.field === 'organisation')
            .map((error, index) => (
              <p
                key={index}
                id="organisation-error"
                className="govuk-error-message"
              >
                <span className="govuk-visually-hidden">Error:</span>{' '}
                {error.message}
              </p>
            ))}
          <select
            className={`govuk-select ${
              props.errors?.some(e => e.field === 'organisation')
                  ? 'govuk-select--error'
                  : ''
              }`}
            id="organisation"
            name="organisation"
            aria-describedby={
              props.errors?.some(e => e.field === 'organisation')
                ? 'organisation-error'
                : ''
            }
          >
            <option value="">Select an organisation</option>
            {props.orgs.map(org => (
              <option key={org.guid} selected={org.guid === props.values?.organisation} value={org.guid}>{org.name} { org.suspended ? '(suspended)' : null }</option>
            ))},
          </select>
        </div>

        <div className={`govuk-form-group ${
            props.errors?.some(e => e.field === 'managerRole')
              ? 'govuk-form-group--error'
              : ''
          }`}>
          <label className="govuk-label" htmlFor="managerRole">
            Manager role
          </label>
          {props.errors
            ?.filter(error => error.field === 'managerRole')
            .map((error, index) => (
              <p
                key={index}
                id="managerRole-error"
                className="govuk-error-message"
              >
                <span className="govuk-visually-hidden">Error:</span>{' '}
                {error.message}
              </p>
            ))}
          <select
            className={`govuk-select ${
              props.errors?.some(e => e.field === 'managerRole')
                  ? 'govuk-select--error'
                  : ''
              }`}
            id="managerRole"
            name="managerRole"
            aria-describedby={
              props.errors?.some(e => e.field === 'managerRole')
                ? 'managerRole-error'
                : ''
            }
          >
            <option value="">Select manager role</option>
            <option value="billing_manager" selected={props.values?.managerRole === 'billing_manager'}>Billing manager</option>
            <option value="org_manager" selected={props.values?.managerRole === 'org_manager'}>Organisation manager</option>
          </select>
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
            aria-describedby={
              props.errors?.some(e => e.field === 'message')
                ? 'message-error message-hint'
                : 'message-hint'
            }
            rows={8}
            defaultValue={props.values?.message}
          />
        </div>

        <p className="govuk-body">
        Message will automatically include the following:
        <div id="message-hint" className="govuk-hint">
          You are receiving this email as you are listed as a [manager_role] manager of the [organisation_name] organisation in our [paas_region] region.<br /><br />
          Thank you,<br />
          GOV.UK PaaS
          </div>
        </p>

        <button className="govuk-button" data-module="govuk-button" data-prevent-double-click="true">
          Send
        </button>
      </form>
    </div>

  </div>);
}

export function ContactOrganisationManagersConfirmationPage(props: ContactOrganisationManagersConfirmationPageProperties): ReactElement {
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