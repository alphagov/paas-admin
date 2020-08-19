import React, { ReactElement, ReactNode } from 'react';

import { KIBIBYTE, MEBIBYTE } from '../../layouts';
import * as help from '../../layouts/helpers';
import { IAccountsUser } from '../../lib/accounts';
import { eventTypeDescriptions } from '../../lib/cf';
import {
  IApplication,
  IApplicationSummary,
  IAuditEvent,
  IOrganization,
  IOrganizationQuota,
  IService,
  IServiceInstance,
  IServicePlan,
  ISpace,
  ISpaceQuota,
  IUser,
} from '../../lib/cf/types';
import { RouteActiveChecker, RouteLinker } from '../app';
import { AppLink, Tab } from '../applications/views';
import {
  Details,
  TargetedEvent,
  TargetedEventListItem,
  Totals,
  EventTimestamps,
} from '../events';

export interface IEnchancedApplication extends IApplication {
  readonly summary: IApplicationSummary;
  readonly urls: ReadonlyArray<string>;
}

export interface IEnchancedOrganization extends IOrganization {
  readonly memory_allocated: number;
  readonly quota: IOrganizationQuota;
}

export interface IEnchancedSpace extends ISpace {
  readonly memory_allocated: number;
  readonly quota?: ISpaceQuota;
  readonly running_apps: ReadonlyArray<IApplication>;
  readonly stopped_apps: ReadonlyArray<IApplication>;
}

interface ISpacesPageProperties {
  readonly linkTo: RouteLinker;
  readonly isAdmin: boolean;
  readonly isManager: boolean;
  readonly isBillingManager: boolean;
  readonly organization: IEnchancedOrganization;
  readonly spaces: ReadonlyArray<IEnchancedSpace>;
  readonly users: ReadonlyArray<IUser>;
}

interface IApplicationPageProperties {
  readonly applications: ReadonlyArray<IEnchancedApplication>;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly space: ISpace;
}

interface ISpaceTabProperties {
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly space: ISpace;
}

export interface IEnchancedServiceInstance extends IServiceInstance {
  readonly definition: IService;
  readonly plan: IServicePlan;
}

export interface IStripedUserServices {
  readonly definition: undefined;
  readonly plan: undefined;
  readonly metadata: { readonly guid: string };
  readonly entity: {
    readonly name: string;
    readonly last_operation: undefined;
  };
}

interface IBackingServicePageProperties {
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly space: ISpace;
  readonly services: ReadonlyArray<
    IEnchancedServiceInstance | IStripedUserServices
  >;
}

interface IEventPageProperties {
  readonly actor?: IAccountsUser;
  readonly event: IAuditEvent;
  readonly space: ISpace;
}

interface IEventsPageProperties {
  readonly actorEmails: { readonly [key: string]: string };
  readonly events: ReadonlyArray<IAuditEvent>;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly space: ISpace;
  readonly pagination: {
    readonly total_results: number;
    readonly total_pages: number;
    readonly page: number;
  };
}

interface ILinkProperties {
  readonly href?: string;
  readonly disabled?: boolean;
  readonly children: string;
}

interface IPaginationProperties {
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly space: ISpace;
  readonly pagination: {
    readonly total_results: number;
    readonly total_pages: number;
    readonly page: number;
  };
}

function Link(props: ILinkProperties): ReactElement {
  if (props.disabled) {
    return <span>{props.children}</span>;
  }

  return <a className="govuk-link" href={props.href}>{props.children}</a>;
}

function Pagination(props: IPaginationProperties): ReactElement {
  return (
    <>
    {props.pagination.total_pages > 1 ?
      <p className="govuk-body">
        <Link
          href={props.linkTo('admin.organizations.spaces.events.view', {
            organizationGUID: props.organizationGUID,
            page: props.pagination.page - 1,
            spaceGUID: props.space.metadata.guid,
          })}
          disabled={props.pagination.page <= 1}
        >
          Previous page
        </Link>{' '}
        <Link
          href={props.linkTo('admin.organizations.spaces.events.view', {
            organizationGUID: props.organizationGUID,
            page: props.pagination.page + 1,
            spaceGUID: props.space.metadata.guid,
          })}
          disabled={props.pagination.page >= props.pagination.total_pages}
        >
          Next page
        </Link>
      </p>
    : <></> }
    </>
  );
}

export function SpacesPage(props: ISpacesPageProperties): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">
        <span className="govuk-caption-l">Organisation</span>{' '}
        {props.organization.entity.name}
      </h1>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-third">
          <div className="org-summary-stat">
            <h2 className="org-summary-stat__heading">Quota usage</h2>

            <span className="org-summary-stat__figure">
              {help.percentage(
                props.organization.memory_allocated,
                props.organization.quota.entity.memory_limit,
              )}
            </span>
          </div>

          <p className="org-summary-stat__context govuk-body">
            Using{' '}
            {help.bytesToHuman(props.organization.memory_allocated * MEBIBYTE)}{' '}
            of memory out of a maximum of{' '}
            {help.bytesToHuman(
              props.organization.quota.entity.memory_limit * MEBIBYTE,
            )}
            .
          </p>

          {props.isAdmin ? <p className="govuk-body">
            <a
              href={props.linkTo('admin.organizations.quota.edit', { organizationGUID: props.organization.metadata.guid })}
              className="govuk-link"
            >
              Manage quota for this organization
            </a>
          </p> : <></>}

          <p className="govuk-body">
            <a
              href="https://docs.cloud.service.gov.uk/managing_apps.html#quotas"
              className="govuk-link"
            >
              Learn more about quotas
            </a>
          </p>
        </div>

        <div className="govuk-grid-column-one-third">
          <div className="org-summary-stat">
            <h2 className="org-summary-stat__heading">Team members</h2>

            <span className="org-summary-stat__figure">
              {props.users.length}
            </span>
          </div>

          <p className="govuk-body">
            Org managers can invite new users and manage permissions
          </p>

          <p className="govuk-body">
            <a
              href={props.linkTo('admin.organizations.users', {
                organizationGUID: props.organization.metadata.guid,
              })}
              className="govuk-link"
            >
              View {props.isAdmin || props.isManager ? 'and manage' : ''} team
              members
            </a>
          </p>
        </div>

        <div className="govuk-grid-column-one-third">
          <div className="org-summary-stat">
            <h2 className="org-summary-stat__heading">Billing</h2>

            <span className="org-summary-stat__figure">
              {props.organization.quota.entity.name === 'default'
                ? 'Trial'
                : 'Billable'}
            </span>
          </div>

          <p className="govuk-body">
            {props.organization.quota.entity.name === 'default'
              ? 'Trial organisations have limited access to backing services'
              : 'Billable organisations have full access to backing services'}
          </p>

          {help.conditionallyDisplay(
            props.isAdmin || props.isManager || props.isBillingManager,
            <p className="govuk-body">
              <a
                href={props.linkTo('admin.statement.dispatcher', {
                  organizationGUID: props.organization.metadata.guid,
                })}
                className="govuk-link"
              >
                Explore your costs and usage
              </a>
            </p>,
          )}
        </div>
      </div>

      <h2 className="govuk-heading-l">Spaces</h2>

      <p className="govuk-body">
        There {props.spaces.length === 1 ? 'is' : 'are'} {props.spaces.length}{' '}
        {props.spaces.length === 1 ? 'space' : 'spaces'} in{' '}
        {props.organization.entity.name}.
      </p>

      <details className="govuk-details"  data-module="govuk-details">
        <summary className="govuk-details__summary">
          <span className="govuk-details__summary-text">What are spaces?</span>
        </summary>

        <div className="govuk-details__text">
          <p>
            Each organisation contains one or more spaces, which are used to
            organise app development, deployment, and maintenance. Organisation
            managers can create and delete spaces.
          </p>

          <a
            href="https://docs.cloud.service.gov.uk/orgs_spaces_users.html#spaces"
            className="govuk-link"
          >
            Read more about Spaces
          </a>
        </div>
      </details>
      <div className="scrollable-table-container">
        <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th
              scope="col"
              className="govuk-table__header govuk-!-width-one-half"
            >
              Space name
            </th>
            <th scope="col" className="govuk-table__header">
              Memory usage
            </th>
            <th
              scope="col"
              className="govuk-table__header govuk-table__header--numeric"
            >
              Running apps
            </th>
            <th
              scope="col"
              className="govuk-table__header govuk-table__header--numeric"
            >
              Stopped apps
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.spaces.map(space => (
            <tr key={space.metadata.guid} className="govuk-table__row">
              <th scope="row" className="govuk-table__header govuk-table__header--non-bold">
                <a
                  href={props.linkTo(
                    'admin.organizations.spaces.applications.list',
                    {
                      organizationGUID: props.organization.metadata.guid,
                      spaceGUID: space.metadata.guid,
                    },
                  )}
                  className="govuk-link"
                >
                  <span className="govuk-visually-hidden">Space name:</span> {space.entity.name}
                </a>
              </th>
              <td className="govuk-table__cell">
                {help.bytesToHuman(space.memory_allocated * MEBIBYTE)} of{' '}
                {space.quota
                  ? help.bytesToHuman(
                      space.quota.entity.memory_limit * MEBIBYTE,
                    )
                  : 'no limit'}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                {space.running_apps.length}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                {space.stopped_apps.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

export function SpaceTab(props: ISpaceTabProperties): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">
        <span className="govuk-caption-l">Space</span> {props.space.entity.name}
      </h1>

      <div className="govuk-tabs">
        <h2 className="govuk-tabs__title">Contents</h2>

        <ul className="govuk-tabs__list">
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.applications.list',
            )}
            href={props.linkTo('admin.organizations.spaces.applications.list', {
              organizationGUID: props.organizationGUID,
              spaceGUID: props.space.metadata.guid,
            })}
          >
            Applications
          </Tab>
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.services.list',
            )}
            href={props.linkTo('admin.organizations.spaces.services.list', {
              organizationGUID: props.organizationGUID,
              spaceGUID: props.space.metadata.guid,
            })}
          >
            Backing services
          </Tab>
          <Tab
            active={props.routePartOf('admin.organizations.spaces.events.view')}
            href={props.linkTo('admin.organizations.spaces.events.view', {
              organizationGUID: props.organizationGUID,
              spaceGUID: props.space.metadata.guid,
            })}
          >
            Events
          </Tab>
        </ul>

        <section className="govuk-tabs__panel">{props.children}</section>
      </div>
    </>
  );
}

export function ApplicationsPage(
  props: IApplicationPageProperties,
): ReactElement {
  return (
    <SpaceTab
      linkTo={props.linkTo}
      organizationGUID={props.organizationGUID}
      routePartOf={props.routePartOf}
      space={props.space}
    >
      <p className="govuk-body">
        This space contains {props.applications.length}{' '}
        {props.applications.length === 1 ? 'application' : 'applications'}
      </p>
      {props.applications.length > 0 ? (
        <div className="scrollable-table-container">
          <table className="govuk-table">
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th className="govuk-table__header name" scope="col">
                Application name
              </th>
              <th className="govuk-table__header" scope="col">
                Instances
              </th>
              <th className="govuk-table__header" scope="col">
                Memory
              </th>
              <th className="govuk-table__header" scope="col">
                Disk
              </th>
              <th className="govuk-table__header" scope="col">
                Status
              </th>
              <th className="govuk-table__header" scope="col">
                URLs
              </th>
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            {props.applications.map(application => (
              <tr key={application.metadata.guid} className="govuk-table__row">
                <th scope="row" className="govuk-table__header govuk-table__header--non-bold">
                  <a
                    href={props.linkTo(
                      'admin.organizations.spaces.applications.view',
                      {
                        applicationGUID: application.metadata.guid,
                        organizationGUID: props.organizationGUID,
                        spaceGUID: props.space.metadata.guid,
                      },
                    )}
                    className="govuk-link"
                  >
                    <span className="govuk-visually-hidden">Application name:</span> {application.entity.name}
                  </a>
                </th>
                <td
                  className="govuk-table__cell"
                  title={`${application.summary.running_instances} running / ${application.summary.instances} desired`}
                >
                  {application.summary.running_instances} /{' '}
                  {application.summary.instances}
                </td>
                <td
                  className="govuk-table__cell"
                  title={`Total: ${(application.summary.memory *
                    application.summary.instances) /
                    KIBIBYTE}GiB`}
                >
                  {application.summary.instances} &times;{' '}
                  {help.bytesToHuman(application.summary.memory * MEBIBYTE)}
                </td>
                <td
                  className="govuk-table__cell"
                  title={`Total: ${(application.summary.disk_quota *
                    application.summary.instances) /
                    KIBIBYTE}GiB`}
                >
                  {application.summary.instances} &times;{' '}
                  {help.bytesToHuman(application.summary.disk_quota * MEBIBYTE)}
                </td>
                <td className="govuk-table__cell">
                  {application.summary.state.toLowerCase()}
                </td>
                <td className="govuk-table__cell">
                  {application.urls.map((url, index) => (
                    <AppLink key={index} href={url} />
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        ) : (
          <></>
        )
      }
    </SpaceTab>
  );
}

export function BackingServicePage(
  props: IBackingServicePageProperties,
): ReactElement {
  return (
    <SpaceTab
      linkTo={props.linkTo}
      organizationGUID={props.organizationGUID}
      routePartOf={props.routePartOf}
      space={props.space}
    >
      <p className="govuk-body">
        This space contains {props.services.length} backing{' '}
        {props.services.length === 1 ? 'service' : 'services'}
      </p>

      {props.services.length > 0 ? (
        <div className="scrollable-table-container">
          <table className="govuk-table">
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th className="govuk-table__header name" scope="col">
                Service name
              </th>
              <th className="govuk-table__header" scope="col">
                Type
              </th>
              <th className="govuk-table__header" scope="col">
                Plan
              </th>
              <th className="govuk-table__header" scope="col">
                State
              </th>
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            {props.services.map(service => (
              <tr key={service.metadata.guid} className="govuk-table__row">
                <th scope="row" className="govuk-table__header govuk-table__header--non-bold name">
                  <a
                    href={props.linkTo(
                      'admin.organizations.spaces.services.view',
                      {
                        organizationGUID: props.organizationGUID,
                        serviceGUID: service.metadata.guid,
                        spaceGUID: props.space.metadata.guid,
                      },
                    )}
                    className="govuk-link"
                  >
                    <span className="govuk-visually-hidden">Service name:</span> {service.entity.name}
                  </a>
                </th>
                <td className="govuk-table__cell label">
                  {service.definition?.entity.label || 'User Provided Service'}
                </td>
                <td className="govuk-table__cell plan">
                  {service.plan?.entity.name || 'N/A'}
                </td>
                <td className="govuk-table__cell status">
                  {service.entity.last_operation?.state || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        ) : (
          <></>
        )
      }
    </SpaceTab>
  );
}

export function EventPage(props: IEventPageProperties): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">
        <span className="govuk-caption-l">Space Event</span>{' '}
        {props.space.entity.name}
      </h1>

      <TargetedEvent actor={props.actor} event={props.event} />
    </>
  );
}

export function EventsPage(props: IEventsPageProperties): ReactElement {
  return (
    <SpaceTab {...props}>
      <Totals
        results={props.pagination.total_results}
        page={props.pagination.page}
        pages={props.pagination.total_pages}
      />

      {props.pagination.total_results > 0 ? 
        <EventTimestamps /> : 
        <></>
      }

      <Details />

      <Pagination
        space={props.space}
        linkTo={props.linkTo}
        organizationGUID={props.organizationGUID}
        pagination={props.pagination}
      />
      
      {props.events.length > 0 ?
        <div className="scrollable-table-container">
          <table className="govuk-table">
            <thead className="govuk-table__head">
              <tr className="govuk-table__row">
                <th className="govuk-table__header">Date</th>
                <th className="govuk-table__header">Actor</th>
                <th className="govuk-table__header">Target</th>
                <th className="govuk-table__header">Event</th>
                <th className="govuk-table__header">Details</th>
              </tr>
            </thead>
            <tbody className="govuk-table__body">
              {props.events.map(event => (
                <TargetedEventListItem
                  key={event.guid}
                  actor={
                    props.actorEmails[event.actor.guid] ||
                    event.actor.name || <code>{event.actor.guid}</code>
                  }
                  date={event.updated_at}
                  href={props.linkTo('admin.organizations.spaces.event.view', {
                    eventGUID: event.guid,
                    organizationGUID: props.organizationGUID,
                    spaceGUID: props.space.metadata.guid,
                  })}
                  target={
                    props.actorEmails[event.target.guid] ||
                    event.target.name || <code>{event.target.guid}</code>
                  }
                  type={
                    eventTypeDescriptions[event.type] || <code>{event.type}</code>
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
        : <></> 
      }

      <Pagination
        space={props.space}
        linkTo={props.linkTo}
        organizationGUID={props.organizationGUID}
        pagination={props.pagination}
      />
    </SpaceTab>
  );
}
