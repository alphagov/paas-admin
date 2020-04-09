import { DescribeDBLogFilesDetails } from 'aws-sdk/clients/rds';
import moment from 'moment';
import React, { ReactElement, ReactNode } from 'react';

import { DATE_TIME } from '../../layouts/constants';
import { bytesToHuman } from '../../layouts/helpers';
import { CommandLineAlternative } from '../../layouts/partials';
import { IService, IServiceInstance, IServicePlan } from '../../lib/cf/types';
import { RouteActiveChecker, RouteLinker } from '../app';

interface IEnchancedServiceInstance extends IServiceInstance {
  readonly service?: IService;
  readonly service_plan?: IServicePlan;
}

interface IServicePageProperties {
  readonly service: IEnchancedServiceInstance;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly spaceGUID: string;
}

interface IServiceTabProperties extends IServicePageProperties {
  readonly children: ReactNode;
}

interface ITabProperties {
  readonly active: boolean;
  readonly href: string;
  readonly children: string;
}

export interface IServiceLogItem extends DescribeDBLogFilesDetails {
  readonly LogFileName: string;
  readonly LastWritten: number;
  readonly Size: number;
}

interface IServiceLogsPageProperties extends IServicePageProperties {
  readonly files: ReadonlyArray<IServiceLogItem>;
}

interface IFileListingItemProperties {
  readonly date: Date;
  readonly link: string;
  readonly name: string;
  readonly size: number;
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

export function ServiceTab(props: IServiceTabProperties): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">
        <span className="govuk-caption-l">Service</span>{' '}
        {props.service.entity.name}
      </h1>

      <div className="govuk-tabs" data-module="govuk-tabs">
        <h2 className="govuk-tabs__title">Contents</h2>

        <ul className="govuk-tabs__list">
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.services.view',
            )}
            href={props.linkTo('admin.organizations.spaces.services.view', {
              organizationGUID: props.organizationGUID,
              serviceGUID: props.service.metadata.guid,
              spaceGUID: props.spaceGUID,
            })}
          >
            Overview
          </Tab>
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.services.metrics.view',
            )}
            href={props.linkTo(
              'admin.organizations.spaces.services.metrics.view',
              {
                organizationGUID: props.organizationGUID,
                serviceGUID: props.service.metadata.guid,
                spaceGUID: props.spaceGUID,
              },
            )}
          >
            Metrics
          </Tab>
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.services.events.view',
            )}
            href={props.linkTo(
              'admin.organizations.spaces.services.events.view',
              {
                organizationGUID: props.organizationGUID,
                serviceGUID: props.service.metadata.guid,
                spaceGUID: props.spaceGUID,
              },
            )}
          >
            Events
          </Tab>
          <Tab
            active={props.routePartOf(
              'admin.organizations.spaces.services.logs.view',
            )}
            href={props.linkTo(
              'admin.organizations.spaces.services.logs.view',
              {
                organizationGUID: props.organizationGUID,
                serviceGUID: props.service.metadata.guid,
                spaceGUID: props.spaceGUID,
              },
            )}
          >
            Logs
          </Tab>
        </ul>

        <section className="govuk-tabs__panel">{props.children}</section>
      </div>
    </>
  );
}

export function ServicePage(props: IServicePageProperties): ReactElement {
  return (
    <ServiceTab {...props}>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <div className="scrollable-table-container">
            <table className="govuk-table">
            <caption className="govuk-table__caption">Service details</caption>
            <tbody className="govuk-table__body">
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Name
                </th>
                <td className="govuk-table__cell name">
                  {props.service.entity.name}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Type
                </th>
                <td className="govuk-table__cell label">
                  {props.service.service?.entity.label ||
                    'User Provided Service'}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Plan
                </th>
                <td className="govuk-table__cell plan">
                  {props.service.service_plan?.entity.name || 'N/A'}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  State
                </th>
                <td className="govuk-table__cell status">
                  {props.service.entity.last_operation?.state || 'N/A'}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">
                  Tags
                </th>
                <td className="govuk-table__cell tags">
                  {props.service.entity.tags.join(', ')}
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <CommandLineAlternative context="for all of your services">
            cf services
          </CommandLineAlternative>
        </div>
      </div>
    </ServiceTab>
  );
}

function FileListingItem(props: IFileListingItemProperties): ReactElement {
  return <li className="service-log-list-item">
    <a className="govuk-link" download href={props.link} aria-describedby={`download-${props.date.getTime()}`}>
      {props.name}
    </a>

    <p className="govuk-body" id={`download-${props.date.getTime()}`}>
      <span className="govuk-visually-hidden">file type </span>
      <span className="service-log-list-item__attribute"><abbr title="record of events">LOG</abbr></span>,
      {' '}
      <span className="govuk-visually-hidden">file size </span>
      <span className="service-log-list-item__attribute">{bytesToHuman(props.size)}</span>
      <span className="service-log-list-item__attribute">Last written: {moment(props.date).format(DATE_TIME)}</span>
    </p>
  </li>;
}

export function ServiceLogsPage(props: IServiceLogsPageProperties): ReactElement {
  return <>
  <ServiceTab {...props}>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <p className="govuk-body">
            The following are hourly chunks of downloadable logs for this service.
          </p>
          <p className="govuk-body">
            At the moment, we provide only the 72 most recent log files.
            Please get in touch if you need a larger range of data.
          </p>
          <p className="govuk-body">
            Log timestamps are in UTC format.
          </p>

          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible" />

          {props.files.length > 0
            ? <ul className="govuk-list service-log-list">
                {props.files.map(file => <FileListingItem
                  date={new Date(file.LastWritten)}
                  key={file.LogFileName}
                  link={props.linkTo('admin.organizations.spaces.services.logs.download', {
                    filename: file.LogFileName,
                    organizationGUID: props.organizationGUID,
                    serviceGUID: props.service.metadata.guid,
                    spaceGUID: props.spaceGUID,
                  })}
                  name={file.LogFileName}
                  size={file.Size}
                />)}
              </ul>
            : <p className="govuk-body">There are no log files available at this time.</p>
          }
        </div>
      </div>
    </ServiceTab>
  </>;
}
