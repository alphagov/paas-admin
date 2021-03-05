import React, { ReactElement, ReactNode } from 'react';

import { CommandLineAlternative } from '../../layouts/partials';
import { IApplication } from '../../lib/cf/types';
import { RouteActiveChecker, RouteLinker } from '../app';
import { IEnhancedApplication } from '../spaces/views';

interface IApplicationTabProperties {
  readonly application: IApplication;
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
  readonly pageTitle?: string;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly spaceGUID: string;
}

interface IApplicationPageProperties {
  readonly additionalRuntimeInfo: ReadonlyArray<
    ReadonlyArray<{ readonly text: string | null }>
  >;
  readonly application: IEnhancedApplication;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly spaceGUID: string;
}

interface IAppLinkProperties {
  readonly href: string;
}

interface ITabProperties {
  readonly active: boolean;
  readonly href: string;
  readonly children: string;
}

export function Tab(props: ITabProperties): ReactElement {
  const classess = ['govuk-tabs__list-item'];
  if (props.active) {
    classess.push('govuk-tabs__list-item--selected');
  }

  return (
    <li className={classess.join(' ')}>
      <a href={props.href} className="govuk-tabs__tab">
        {props.children}
      </a>
    </li>
  );
}

export function ApplicationTab(props: IApplicationTabProperties): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">
        <span className="govuk-caption-l">
          <span className="govuk-visually-hidden">Application</span>{' '}
          {props.application.entity.name}
        </span>{' '}
        {props.pageTitle}
      </h1>

      <div className="govuk-tabs">
        <h2 className="govuk-tabs__title">Contents</h2>

        <ul className="govuk-tabs__list">
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.applications.view',
            )}
            href={props.linkTo('admin.organizations.spaces.applications.view', {
              applicationGUID: props.application.metadata.guid,
              organizationGUID: props.organizationGUID,
              spaceGUID: props.spaceGUID,
            })}
          >
            Overview
          </Tab>
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.applications.events.view',
            )}
            href={props.linkTo(
              'admin.organizations.spaces.applications.events.view',
              {
                applicationGUID: props.application.metadata.guid,
                organizationGUID: props.organizationGUID,
                spaceGUID: props.spaceGUID,
              },
            )}
          >
            Events
          </Tab>
        </ul>

        <section className="govuk-tabs__panel">{props.children}</section>
      </div>
    </>
  );
}

export function AppLink(props: IAppLinkProperties): ReactElement {
  if (props.href.match(/apps[.]internal/)) {
    return (
      <>
        {props.href}
        <br />
      </>
    );
  }

  const protocolOrEmpty = props.href.match(/^https?:/) ? '' : 'https://';

  return (
    <>
      <a href={protocolOrEmpty + props.href} className="govuk-link">
      <span className="govuk-visually-hidden">Application URL:</span>{' '} {props.href}
      </a>
      <br />
    </>
  );
}

export function ApplicationPage(
  props: IApplicationPageProperties,
): ReactElement {
  return (
    <ApplicationTab
      application={props.application}
      linkTo={props.linkTo}
      routePartOf={props.routePartOf}
      organizationGUID={props.organizationGUID}
      spaceGUID={props.spaceGUID}
      pageTitle="Overview"
    >
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <div className="scrollable-table-container">
            <table className="govuk-table">
            <caption className="govuk-table__caption">
              Application details
            </caption>
            <tbody className="govuk-table__body">
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Name
                </th>
                <td className="govuk-table__cell">
                  {props.application.entity.name}
                </td>
              </tr>
              {props.additionalRuntimeInfo.map((info, index) => (
                <tr key={index} className="govuk-table__row">
                  <th scope="row" className="govuk-table__header">
                    {info[0].text}
                  </th>
                  <td className="govuk-table__cell">{info[1].text}</td>
                </tr>
              ))}
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Instances
                </th>
                <td className="govuk-table__cell">
                  {`${props.application.summary.running_instances}/${props.application.summary.instances}`}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Memory
                </th>
                <td className="govuk-table__cell">{`${(
                  props.application.summary.memory / 1024
                ).toFixed(2)}GiB`}</td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Disk quota
                </th>
                <td className="govuk-table__cell">
                  {`${(props.application.summary.disk_quota / 1024).toFixed(
                    2,
                  )}GiB`}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Status
                </th>
                <td className="govuk-table__cell">
                  {props.application.summary.state}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  SSH
                </th>
                <td className="govuk-table__cell">
                  {props.application.summary.enable_ssh}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  URLs
                </th>
                <td className="govuk-table__cell">
                  {props.application.urls.map((url, index) => (
                    <AppLink key={index} href={url} />
                  ))}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Ports
                </th>
                <td className="govuk-table__cell">
                  {props.application.summary.ports}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
          <CommandLineAlternative>{`cf app ${props.application.entity.name}`}</CommandLineAlternative>
        </div>
      </div>
    </ApplicationTab>
  );
}
