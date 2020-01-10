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

  return (<li className={classess.join(' ')}><a href={props.href}>{props.children}</a></li>);
}

export function ApplicationTab(props: IApplicationTabProperties): ReactElement {
  return (<>
    <h1 className="govuk-heading-l">
      <span className="govuk-caption-l">Application</span>
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
