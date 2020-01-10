import React, { ReactElement, ReactNode } from 'react';

import { IApplication } from '../../lib/cf/types';
import { RouteActiveChecker, RouteLinker } from '../app';

interface IApplicationTabProperties {
  readonly application: IApplication;
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly routePartOf: RouteActiveChecker;
  readonly spaceGUID: string;
}

interface IApplicationPageProperties {
  readonly additionalRuntimeInfo: ReadonlyArray<ReadonlyArray<{ readonly text: string | null; }>>;
  readonly application: IApplication;
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

function Tab(props: ITabProperties) {
  const classess = ['govuk-tabs__list-item'];
  if (props.active) {
    classess.push('govuk-tabs__list-item--selected');
  }

  return (<li className={classess.join(' ')}><a href={props.href} className="govuk-link">{props.children}</a></li>);
}

export function ApplicationTab(props: IApplicationTabProperties): ReactElement {
  return (<>
    <h1 className="govuk-heading-l">
      <span className="govuk-caption-l">Application</span>
      {' '}
      {props.application.entity.name}
    </h1>

    <div className="govuk-tabs" data-module="govuk-tabs">
      <h2 className="govuk-tabs__title">
        Contents
      </h2>

      <ul className="govuk-tabs__list">
        <Tab
          active={props.routePartOf('admin.organizations.spaces.applications.view')}
          href={props.linkTo('admin.organizations.spaces.applications.view', {
            organizationGUID: props.organizationGUID,
            spaceGUID: props.spaceGUID,
            applicationGUID: props.application.metadata.guid,
          })}>
          Overview
        </Tab>
        <Tab
          active={props.routePartOf('admin.organizations.spaces.applications.events.view')}
          href={props.linkTo('admin.organizations.spaces.applications.events.view', {
            organizationGUID: props.organizationGUID,
            spaceGUID: props.spaceGUID,
            applicationGUID: props.application.metadata.guid,
          })}>
          Events
        </Tab>
      </ul>

      <section className="govuk-tabs__panel">
        {props.children}
      </section>
    </div>
  </>);
}

export function AppLink(props: IAppLinkProperties): ReactElement {
  if (props.href.match(/apps[.]internal/)) {
    return (<>{props.href}<br /></>);
  }

  const protocolOrEmpty = props.href.match(/^https?:/) ? '' : 'https://';

  return (<><a href={protocolOrEmpty + props.href} className="govuk-link">{props.href}</a><br /></>);
}

export function ApplicationPage(props: IApplicationPageProperties): ReactElement {
  return (
    <ApplicationTab
      application={props.application}
      linkTo={props.linkTo}
      routePartOf={props.routePartOf}
      organizationGUID={props.organizationGUID}
      spaceGUID={props.spaceGUID}
    >
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <h1 className="govuk-heading-l">
            <span className="govuk-caption-l">Application</span>
            {' '}
            {props.application.entity.name}
          </h1>

          <table className="govuk-table">
            <caption className="govuk-table__caption">Application details</caption>
            <tbody className="govuk-table__body">
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">Name</th>
                <td className="govuk-table__cell">{props.application.entity.name}</td>
              </tr>
              {props.additionalRuntimeInfo.map((info, index) => (
                <tr key={index} className="govuk-table__row">
                  <th scope="row" className="govuk-table__header">{info[0].text}</th>
                  <td className="govuk-table__cell">{info[1].text}</td>
                </tr>
              ))}
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">Instances</th>
                <td className="govuk-table__cell">
                  {`${props.application.entity.running_instances}/${props.application.entity.instances}`}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">Memory</th>
                <td className="govuk-table__cell">{`${(props.application.entity.memory / 1024).toFixed(2)}GiB`}</td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">Disk quota</th>
                <td className="govuk-table__cell">{`${(props.application.entity.disk_quota / 1024).toFixed(2)}GiB`}</td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">Status</th>
                <td className="govuk-table__cell">{props.application.entity.state}</td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">SSH</th>
                <td className="govuk-table__cell">{props.application.entity.enable_ssh}</td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">URLs</th>
                <td className="govuk-table__cell">
                  {props.application.entity.urls.map((url, index) => (<AppLink key={index} href={url} />))}
                </td>
              </tr>
              <tr className="govuk-table__row">
                <th scope="row" className="govuk-table__header">Ports</th>
                <td className="govuk-table__cell">{props.application.entity.ports}</td>
              </tr>
            </tbody>
          </table>

          <h4 className="govuk-heading-s">On the commandline</h4>

          <p>You can also view the same information on the commandline, to see details for all of your apps use:</p>

          <p>
            <code>cf apps</code>
          </p>

          <a href="https://docs.cloud.service.gov.uk/get_started.html#set-up-the-cloud-foundry-command-line" className="govuk-link">
            Read more about using PaaS on the commandline.
          </a>
        </div>
      </div>
    </ApplicationTab>
  );
}
