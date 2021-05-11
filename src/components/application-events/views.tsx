import React, { ReactElement } from 'react'

import { IAccountsUser } from '../../lib/accounts'
import { eventTypeDescriptions } from '../../lib/cf'
import { IApplication, IAuditEvent } from '../../lib/cf/types'
import { RouteActiveChecker, RouteLinker } from '../app/context'
import { ApplicationTab } from '../applications/views'
import { Details, Event, EventListItem, Totals, EventTimestamps } from '../events'

interface IApplicationEventDetailPageProperties {
  readonly actor?: IAccountsUser
  readonly application: IApplication
  readonly event: IAuditEvent
}

interface IApplicationEventsPageProperties {
  readonly actorEmails: { readonly [key: string]: string }
  readonly application: IApplication
  readonly events: readonly IAuditEvent[]
  readonly linkTo: RouteLinker
  readonly organizationGUID: string
  readonly routePartOf: RouteActiveChecker
  readonly spaceGUID: string
  readonly pagination: {
    readonly total_results: number
    readonly total_pages: number
    readonly page: number
  }
}

interface ILinkProperties {
  readonly href?: string
  readonly disabled?: boolean
  readonly children: string
}

interface IPaginationProperties {
  readonly application: IApplication
  readonly linkTo: RouteLinker
  readonly organizationGUID: string
  readonly spaceGUID: string
  readonly pagination: {
    readonly total_results: number
    readonly total_pages: number
    readonly page: number
  }
}

function Link (props: ILinkProperties): ReactElement {
  if (props.disabled) {
    return <span>{props.children}</span>
  }

  return <a className='govuk-link' href={props.href}>{props.children}</a>
}

function Pagination (props: IPaginationProperties): ReactElement {
  return (
    <>
      {props.pagination.total_pages > 1
        ? <p className='govuk-body'>
          <Link
            href={props.linkTo(
              'admin.organizations.spaces.applications.events.view',
              {
                applicationGUID: props.application.metadata.guid,
                organizationGUID: props.organizationGUID,
                page: props.pagination.page - 1,
                spaceGUID: props.spaceGUID
              }
            )}
            disabled={props.pagination.page <= 1}
          >
            Previous page
          </Link>{' '}
          <Link
            href={props.linkTo(
              'admin.organizations.spaces.applications.events.view',
              {
                applicationGUID: props.application.metadata.guid,
                organizationGUID: props.organizationGUID,
                page: props.pagination.page + 1,
                spaceGUID: props.spaceGUID
              }
            )}
            disabled={props.pagination.page >= props.pagination.total_pages}
          >
            Next page
          </Link>
          </p>
        : <></>}
    </>
  )
}

export function ApplicationEventDetailPage (
  props: IApplicationEventDetailPageProperties
): ReactElement {
  return (
    <>
      <h1 className='govuk-heading-l'>
        <span className='govuk-caption-l'>
          <span className='govuk-visually-hidden'>Application</span>{' '}
          {props.application.entity.name}
        </span>{' '}
        Event details
      </h1>

      <Event event={props.event} actor={props.actor} />
    </>
  )
}

export function ApplicationEventsPage (
  props: IApplicationEventsPageProperties
): ReactElement {
  return (
    <ApplicationTab
      application={props.application}
      organizationGUID={props.organizationGUID}
      spaceGUID={props.spaceGUID}
      linkTo={props.linkTo}
      routePartOf={props.routePartOf}
      pageTitle='Events'
    >
      <Totals
        results={props.pagination.total_results}
        page={props.pagination.page}
        pages={props.pagination.total_pages}
      />

      {props.pagination.total_results > 0
        ? <EventTimestamps />
        : <></>}

      <Details />

      <Pagination
        application={props.application}
        linkTo={props.linkTo}
        organizationGUID={props.organizationGUID}
        spaceGUID={props.spaceGUID}
        pagination={props.pagination}
      />
      {props.events.length > 0
        ? <div className='scrollable-table-container'>
          <table className='govuk-table'>
            <thead className='govuk-table__head'>
              <tr className='govuk-table__row'>
                <th className='govuk-table__header'>Date</th>
                <th className='govuk-table__header'>Actor</th>
                <th className='govuk-table__header'>Event</th>
                <th className='govuk-table__header'>Details</th>
              </tr>
            </thead>
            <tbody className='govuk-table__body'>
              {props.events.map(event => (
                <EventListItem
                  key={event.guid}
                  actor={
                    props.actorEmails[event.actor.guid] ||
                    event.actor.name || <code>{event.actor.guid}</code>
                  }
                  date={event.updated_at}
                  href={props.linkTo(
                    'admin.organizations.spaces.applications.event.view',
                    {
                      applicationGUID: props.application.metadata.guid,
                      eventGUID: event.guid,
                      organizationGUID: props.organizationGUID,
                      spaceGUID: props.spaceGUID
                    }
                  )}
                  type={
                    eventTypeDescriptions[event.type] || <code>{event.type}</code>
                  }
                />
              ))}
            </tbody>
          </table>
          </div>
        : <></>}

      <Pagination
        application={props.application}
        linkTo={props.linkTo}
        organizationGUID={props.organizationGUID}
        spaceGUID={props.spaceGUID}
        pagination={props.pagination}
      />
    </ApplicationTab>
  )
}
