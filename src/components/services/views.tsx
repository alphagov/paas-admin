import React, { ReactElement, ReactNode } from 'react';

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

export function Tab(props: ITabProperties) {
  const classess = ['govuk-tabs__list-item'];
  if (props.active) {
    classess.push('govuk-tabs__list-item--selected');
  }

  return (
    <li className={classess.join(' ')}>
      <a href={props.href} className="govuk-link">
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
              spaceGUID: props.spaceGUID,
              serviceGUID: props.service.metadata.guid,
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
                spaceGUID: props.spaceGUID,
                serviceGUID: props.service.metadata.guid,
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
                spaceGUID: props.spaceGUID,
                serviceGUID: props.service.metadata.guid,
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

export function ServicePage(props: IServicePageProperties): ReactElement {
  return (
    <ServiceTab {...props}>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
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

          <h4 className="govuk-heading-s">On the commandline</h4>

          <p className="govuk-body">
            You can also view the same information on the commandline, to see
            details for all of your services use:
          </p>

          <p className="govuk-body">
            <code>cf services</code>
          </p>

          <a
            href="https://docs.cloud.service.gov.uk/get_started.html#set-up-the-cloud-foundry-command-line"
            className="govuk-link"
          >
            Read more about using PaaS on the commandline.
          </a>
        </div>
      </div>
    </ServiceTab>
  );
}
