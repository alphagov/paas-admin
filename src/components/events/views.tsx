import moment from 'moment';
import React, { ReactElement, ReactNode } from 'react';
import { DATE_TIME } from '../../layouts';
import { IAccountsUser } from '../../lib/accounts';
import { eventTypeDescriptions } from '../../lib/cf';
import { IAuditEvent } from '../../lib/cf/types';

interface IEventProperties {
  readonly event: IAuditEvent;
  readonly actor?: IAccountsUser;
}

interface ITotalsProperties {
  readonly page: number;
  readonly pages: number;
  readonly results: number;
}

interface IEventListItemProperties {
  readonly actor: ReactNode;
  readonly date: string;
  readonly href: string;
  readonly target?: ReactNode;
  readonly type: ReactNode;
}

export function Details(): ReactElement {
  return (
    <details className="govuk-details" role="group">
      <summary className="govuk-details__summary" role="button" aria-controls="details-content-0" aria-expanded="false">
        <span className="govuk-details__summary-text">
          What are events?
        </span>
      </summary>

      <div className="govuk-details__text" aria-hidden="true">
        <p className="govuk-body">
          Events are a log of actions made by actors against targets.
        </p>

        <p className="govuk-body">
          <span className="govuk-!-font-weight-bold">
            Actors
          </span>
          {' '}
          are users making API requests, or other APIs acting on behalf of users.
        </p>

        <p className="govuk-body">
          <span className="govuk-!-font-weight-bold">
            Targets
          </span>
          {' '}
          are resources being acted upon. For example:
          {' '}
          <ul className="govuk-list govuk-list--bullet">
            <li>apps</li>
            <li>services</li>
            <li>spaces</li>
            <li>other users</li>
          </ul>
        </p>
      </div>
    </details>
  );
}

export function Event(props: IEventProperties): ReactElement {
  return (
    <dl className="govuk-summary-list">
      <div className="govuk-summary-list__row">
        <dt className="govuk-summary-list__key">
          Date
        </dt>
        <dd className="govuk-summary-list__value datetime">
          {moment(props.event.updated_at).format(DATE_TIME)}
        </dd>
      </div>
      <div className="govuk-summary-list__row">
        <dt className="govuk-summary-list__key">
          Actor
        </dt>
        <dd className="govuk-summary-list__value actor">
          {props.actor?.email || props.event.actor.name || <code>{props.event.actor.guid}</code>}
        </dd>
      </div>
      <div className="govuk-summary-list__row">
        <dt className="govuk-summary-list__key">
          Description
        </dt>
        <dd className="govuk-summary-list__value description">
          {eventTypeDescriptions[props.event.type] || <code>{props.event.type}</code>}
        </dd>
      </div>
      <div className="govuk-summary-list__row">
        <dt className="govuk-summary-list__key">
          Metadata
        </dt>
        <dd className="govuk-summary-list__value metadata">
          <code className="code-block">{JSON.stringify(props.event.data, null, 2)}</code>
        </dd>
      </div>
    </dl>
  );
}

export function EventListItem(props: IEventListItemProperties): ReactElement {
  return(<tr className="govuk-table__row">
    <td className="govuk-table__cell datetime">
      {moment(props.date).format(DATE_TIME)}
    </td>
    <td className="govuk-table__cell actor">
      {props.actor}
    </td>
    <td className="govuk-table__cell description">
      {props.type}
    </td>
    <td className="govuk-table__cell details">
      <a className="govuk-link" href={props.href}>Details</a>
    </td>
  </tr>);
}

export function Totals(props: ITotalsProperties): ReactElement {
  return (
    <p className="govuk-body">
      There are {props.results} total events. Displaying page {props.page} of {props.pages}.
    </p>
  );
}
