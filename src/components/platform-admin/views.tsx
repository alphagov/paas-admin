import React, { ReactElement } from 'react';

import { RouteLinker } from '../app';
import { IValidationError } from '../errors/types';
import { SLUG_REGEX } from '../../layouts';
import { SuccessPage } from '../org-users/views';

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
  readonly values?: INewOrganizationUserBody;
}

interface ICreateOrganizationPageProperties extends IFormProperties {
  readonly owners: ReadonlyArray<{
    readonly name: string;
    readonly owner: string;
  }>;
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
                  type="number"
                  defaultValue={new Date().getFullYear()}
                  pattern="20[123][0-9]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="govuk-form-group">
          <label className="govuk-label govuk-date-input__label">Format</label>
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
        ? <div className="govuk-error-summary" aria-labelledby="error-summary-title"
            role="alert" tabIndex={-1} data-module="govuk-error-summary">
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
        <span id="organization-hint" className="govuk-hint">
          This needs to be all lowercase and hyphen separated meaningful name of the organisation.
          You can also refer to the section on the side for some examples.
        </span>
        <input id="organization" name="organization" className="govuk-input" aria-describedby="organization-hint"
          type="text" defaultValue={props.values?.organization} required={true} pattern={SLUG_REGEX} />
      </div>

      <div className="govuk-form-group">
        <label className="govuk-label" htmlFor="owner">
          Owner
        </label>
        <span id="owner-hint" className="govuk-hint">
          The name of a party owning that organisation. You can also refer to the section on the side for some examples.
        </span>
        <input id="owner" name="owner" className="govuk-input" aria-describedby="owner-hint" type="text"
          defaultValue={props.values?.owner} required={true} />
      </div>

      <button className="govuk-button" data-module="govuk-button" data-prevent-double-click="true">
        Create Organisation
      </button>
    </form>

    <div className="govuk-grid-column-one-half">
      <table className="govuk-table">
        <caption className="govuk-table__caption">Existing owners</caption>
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th scope="col" className="govuk-table__header">Name</th>
            <th scope="col" className="govuk-table__header">Owner</th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.owners.map((org, index) => <tr key={index} className="govuk-table__row">
              <td className="govuk-table__cell">{org.name}</td>
              <td className="govuk-table__cell">{org.owner}</td>
            </tr>)}
        </tbody>
      </table>
    </div>
  </div>);
}

export function CreateOrganizationSuccessPage(props: ICreateOrganizationSuccessPageProperties): ReactElement {
  return (<SuccessPage linkTo={props.linkTo} organizationGUID={props.organizationGUID}>
    We have created a new organisation!
    <br />
    You still need to invite people and assign permissions.
  </SuccessPage>);
}
