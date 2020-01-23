import React, { ReactElement } from 'react';

import { RouteLinker } from '../app';

interface IProperties {
  readonly linkTo: RouteLinker;
}

interface IFormProperties extends IProperties {
  readonly csrf: string;
}

function Costs(props: IFormProperties): ReactElement {
  return (<>
    <h2 className="govuk-heading-m">Costs</h2>

    <h3 className="govuk-heading-s">View costs for a month</h3>

    <form action={props.linkTo('platform-admin.redirect')} method="POST">
      <input type="hidden" name="_csrf" value={props.csrf} />

      <input type="hidden" name="action" value="view-costs" />

      <div className="govuk-form-group">
        <div className="govuk-date-input" id="passport-issued">
          <div className="govuk-date-input__item">
            <div className="govuk-form-group">
              <label className="govuk-label govuk-date-input__label" htmlFor="view-costs-month">
                Month
              </label>
              <select className="govuk-select" id="view-costs-month" name="month">
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
              <label className="govuk-label govuk-date-input__label" htmlFor="view-costs-year">
                Year
              </label>
              <input className="govuk-input govuk-date-input__input govuk-input--width-4"
                    id="view-costs-year"
                    name="year"
                    type="number"
                    defaultValue={(new Date()).getFullYear()}
                    pattern="20[123][0-9]"/>
            </div>
          </div>
        </div>
      </div>

      <div className="govuk-form-group">
        <label className="govuk-label govuk-date-input__label">Format</label>
        <div className="govuk-radios govuk-radios--small">
          {[
            { label: 'Overall costs',                    value: 'cost' },
            { label: 'Costs by service',                 value: 'costbyservice' },
            { label: 'Spend for PMO team in CSV format', value: 'pmo-org-spend-csv' },
            { label: 'Sankey diagram',                   value: 'visualisation' },
          ].map((format, index) => (
            <div key={index} className="govuk-radios__item">
              <input className="govuk-radios__input"
                    id={`view-costs-format-${format.value}`}
                    name="format" type="radio"
                    defaultChecked={index === 0}
                    value={format.value} />

              <label className="govuk-label govuk-radios__label" htmlFor={`view-costs-format-${format.value}`}>
                {format.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <button className="govuk-button" type="submit">View costs</button>
    </form>
  </>);
}

function Organizations(props: IProperties): ReactElement {
  return (<>
    <h2 className="govuk-heading-m">
      Organisation management
    </h2>

    <p className="govuk-body">
      <a className="govuk-link" href={props.linkTo('admin.reports.organizations')}>
        View trial and billable organisations
      </a>
    </p>
  </>);
}

function Users(props: IFormProperties): ReactElement {
  return (<>
    <h2 className="govuk-heading-m">User management</h2>

    <h3 className="govuk-heading-s">Find a user</h3>

    <form action={props.linkTo('platform-admin.redirect')} method="POST">
      <input type="hidden" name="_csrf" value={props.csrf} />

      <input type="hidden" name="action" value="find-user" />

      <div className="govuk-form-group">
        <label className="govuk-label" htmlFor="find-user-email-or-user-guid">
          Email address or GUID
        </label>

        <input className="govuk-input" id="find-user-email-or-user-guid" name="email-or-user-guid" type="text" />
      </div>

      <button className="govuk-button">
        Find user
      </button>
    </form>
  </>);
}

export function PlatformAdministratorPage(props: IFormProperties): ReactElement {
  return (<>
    <h1 className="govuk-heading-l">
      Platform Admin
    </h1>

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
  </>);
}
