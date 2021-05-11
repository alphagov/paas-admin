import moment from 'moment'
import React, { ReactElement, ReactNode } from 'react'

import { DATE_TIME } from '../../layouts'
import { IAccountsUser } from '../../lib/accounts'
import { eventTypeDescriptions } from '../../lib/cf'
import { IAuditEvent } from '../../lib/cf/types'

interface IEventProperties {
  readonly event: IAuditEvent
  readonly actor?: IAccountsUser
}

interface ITotalsProperties {
  readonly page: number
  readonly pages: number
  readonly results: number
}

interface IEventListItemProperties {
  readonly actor: ReactNode
  readonly date: string
  readonly href: string
  readonly type: ReactNode
}

interface IEventSummaryItemProperties {
  readonly children: ReactNode
  readonly title: string
}

interface ITargetedEventListItemProperties extends IEventListItemProperties {
  readonly target: ReactNode
}

export function Details (): ReactElement {
  return (
    <details className='govuk-details' data-module='govuk-details'>
      <summary className='govuk-details__summary'>
        <span className='govuk-details__summary-text'>What are events?</span>
      </summary>

      <div className='govuk-details__text'>
        <p className='govuk-body'>
          Events are a log of actions made by actors against targets.
        </p>

        <p className='govuk-body'>
          <span className='govuk-!-font-weight-bold'>Actors</span> are users
          making API requests, or other APIs acting on behalf of users.
        </p>

        <p className='govuk-body'>
          <span className='govuk-!-font-weight-bold'>Targets</span> are
          resources being acted upon. For example:{' '}
          <ul className='govuk-list govuk-list--bullet'>
            <li>apps</li>
            <li>services</li>
            <li>spaces</li>
            <li>other users</li>
          </ul>
        </p>
      </div>
    </details>
  )
}

function EventSummaryItem (props: IEventSummaryItemProperties): ReactElement {
  return (
    <div className={`govuk-summary-list__row ${props.title.toLowerCase()}`}>
      <dt className='govuk-summary-list__key'>{props.title}</dt>
      <dd className='govuk-summary-list__value'>{props.children}</dd>
    </div>
  )
}

export function Event (props: IEventProperties): ReactElement {
  return (
    <dl className='govuk-summary-list'>
      <EventSummaryItem title='Date'>
        {moment(props.event.updated_at).format(DATE_TIME)}
      </EventSummaryItem>
      <EventSummaryItem title='Actor'>
        {props.actor?.email || props.event.actor.name || (
          <code>{props.event.actor.guid}</code>
        )}
      </EventSummaryItem>
      <EventSummaryItem title='Description'>
        {eventTypeDescriptions[props.event.type] || (
          <code>{props.event.type}</code>
        )}
      </EventSummaryItem>
      <EventSummaryItem title='Metadata'>
        <code className='code-block'>
          {JSON.stringify(props.event.data, null, 2)}
        </code>
      </EventSummaryItem>
    </dl>
  )
}

export function TargetedEvent (props: IEventProperties): ReactElement {
  return (
    <dl className='govuk-summary-list'>
      <EventSummaryItem title='Date'>
        {moment(props.event.updated_at).format(DATE_TIME)}
      </EventSummaryItem>
      <EventSummaryItem title='Actor'>
        {props.actor?.email || props.event.actor.name || (
          <code>{props.event.actor.guid}</code>
        )}
      </EventSummaryItem>
      <EventSummaryItem title='Target'>
        {props.event.target.name || <code>{props.event.target.guid}</code>}
      </EventSummaryItem>
      <EventSummaryItem title='Description'>
        {eventTypeDescriptions[props.event.type] || (
          <code>{props.event.type}</code>
        )}
      </EventSummaryItem>
      <EventSummaryItem title='Metadata'>
        <code className='code-block'>
          {JSON.stringify(props.event.data, null, 2)}
        </code>
      </EventSummaryItem>
    </dl>
  )
}

export function EventListItem (props: IEventListItemProperties): ReactElement {
  return (
    <tr className='govuk-table__row'>
      <td className='govuk-table__cell datetime'>
        {moment(props.date).format(DATE_TIME)}
      </td>
      <td className='govuk-table__cell actor'>{props.actor}</td>
      <td className='govuk-table__cell description'>{props.type}</td>
      <td className='govuk-table__cell details'>
        <a className='govuk-link' href={props.href}>
          <span className='govuk-visually-hidden'>Event</span> Details
        </a>
      </td>
    </tr>
  )
}

export function TargetedEventListItem (
  props: ITargetedEventListItemProperties
): ReactElement {
  return (
    <tr className='govuk-table__row'>
      <td className='govuk-table__cell datetime'>
        {moment(props.date).format(DATE_TIME)}
      </td>
      <td className='govuk-table__cell actor'>{props.actor}</td>
      <td className='govuk-table__cell target'>{props.target}</td>
      <td className='govuk-table__cell description'>{props.type}</td>
      <td className='govuk-table__cell details'>
        <a className='govuk-link' href={props.href}>
          <span className='govuk-visually-hidden'>Event</span> Details
        </a>
      </td>
    </tr>
  )
}

export function Totals (props: ITotalsProperties): ReactElement {
  return (
    <p className='govuk-body'>
      There are {props.results} total events.
      {props.pages > 1
        ? `${' '}Displaying page ${props.page} of${' '}${props.pages}.`
        : <></>}
    </p>
  )
}

export function EventTimestamps (): ReactElement {
  return (
    <p className='govuk-body'>
      Event timestamps are in UTC format.
    </p>
  )
}
