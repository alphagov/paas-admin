/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { IService, IServiceInstance, IServicePlan } from '../../lib/cf/types';

import { ServiceLogsPage, ServicePage, ServiceTab } from './views';

describe(ServiceTab, () => {
  it('should produce service tab', () => {
    const service = ({
      entity: { name: 'service-name' },
      metadata: { guid: 'SERVICE_GUID' },
      service: { entity: { label: 'postgres' } },
    } as unknown) as IServiceInstance;
    const { container } = render(
      <ServiceTab
        service={service}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        pageTitle="test"
        spaceGUID="SPACE_GUID"
      >
        <p>TEST</p>
      </ServiceTab>,
    );
    expect(container.querySelector('h1')).toHaveTextContent('service-name');
    expect(container.querySelector('section.govuk-tabs__panel')).toHaveTextContent('TEST');
    expect(container
      .querySelector('ul li:first-of-type a'))
      .toHaveAttribute('href', expect.stringContaining('__LINKS_TO__admin.organizations.spaces.services.view'));
    expect(container
      .querySelector('ul li:first-of-type'))
      .toHaveClass('govuk-tabs__list-item--selected');
    expect(container
      .querySelector('ul li:last-of-type a'))
      .toHaveAttribute('href', expect.stringContaining('__LINKS_TO__admin.organizations.spaces.services.logs.view'));
    expect(container
      .querySelector('ul li:last-of-type'))
      .not.toHaveClass('govuk-tabs__list-item--selected');
  });


  it('should produce service tab without logs tab', () => {
    const service = ({
      entity: { name: 'service-name', type: 'not-approved' },
      metadata: { guid: 'SERVICE_GUID' },
    } as unknown) as IServiceInstance;

    const { container } = render(
      <ServiceTab
        service={service}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        pageTitle="test"
        spaceGUID="SPACE_GUID"
      >
        <p>TEST</p>
      </ServiceTab>,
    );

    expect(container.querySelector('h1')).toHaveTextContent('service-name');
    expect(container.querySelector('section.govuk-tabs__panel')).toHaveTextContent('TEST');
    expect(container
      .querySelector('ul li:first-of-type a'))
      .toHaveAttribute('href', expect.stringContaining('__LINKS_TO__admin.organizations.spaces.services.view'));
    expect(container
      .querySelector('ul li:first-of-type'))
      .toHaveClass('govuk-tabs__list-item--selected');
    expect(container
      .querySelector('ul li:last-of-type a'))
      .not.toHaveAttribute('href', expect.stringContaining('__LINKS_TO__admin.organizations.spaces.services.logs.view'));
    expect(container
      .querySelector('ul li:last-of-type'))
      .not.toHaveClass('govuk-tabs__list-item--selected');
  });
});

describe(ServicePage, () => {
  it('should not display default values', () => {
    const service = ({
      entity: {
        last_operation: { state: 'success' },
        name: 'service-name',
        tags: [],
      },
      metadata: { guid: 'SERVICE_GUID' },
    } as unknown) as IServiceInstance;
    const { container } = render(
      <ServicePage
        service={{
          ...service,
          service: ({
            entity: { label: 'service-label' },
          } as unknown) as IService,
          service_plan: ({
            entity: { name: 'service-plan-name' },
          } as unknown) as IServicePlan,
        }}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        pageTitle="test"
        spaceGUID="SPACE_GUID"
      />,
    );
    expect(container.querySelector('td.label')).toHaveTextContent('service-label');
    expect(container.querySelector('td.plan')).toHaveTextContent('service-plan-name');
    expect(container.querySelector('td.status')).toHaveTextContent('success');
  });

  it('should display SHARED TO data if the service has been shared to other spaces and/or orgs', () => {
    const service = ({
      entity: {
        last_operation: { state: 'success' },
        name: 'service-name',
        tags: [],
      },
      metadata: { guid: 'SERVICE_GUID' },
      shared_from: {
        space_guid: 'SPACE_GUID',
        space_name: 'test space',
        organization_name: 'test org',
      },
      shared_to: {
        resources: [
          {
            space_guid: '3310e016-2276-40c3-92a8-af7552444bbd',
            space_name: 'test space',
            organization_name: 'test org',
          },
        ],
      },
    } as unknown) as IServiceInstance;
    const { container } = render(
      <ServicePage
        service={{
          ...service,
          service: ({
            entity: { label: 'service-label' },
          } as unknown) as IService,
          service_plan: ({
            entity: { name: 'service-plan-name' },
          } as unknown) as IServicePlan,
        }}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        pageTitle="test"
        spaceGUID="SPACE_GUID"
      />,
    );
    expect(container.querySelector('td.label')).toHaveTextContent('service-label');
    expect(container.querySelector('td.plan')).toHaveTextContent('service-plan-name');
    expect(container.querySelector('td.status')).toHaveTextContent('success');
    expect(container.querySelector('td.sharedTo')).toHaveTextContent('space test space in organisation test org');
    expect(container.querySelector('td.sharedFrom')).toBeFalsy();
  });

  it('should display SHARED FROM data if the service has been shared from another spaces and/or orgs', () => {
    const service = ({
      entity: {
        last_operation: { state: 'success' },
        name: 'service-name',
        tags: [],
      },
      metadata: { guid: 'SERVICE_GUID' },
      shared_from: {
        space_guid: 'guid',
        space_name: 'test space',
        organization_name: 'test org',
      },
      shared_to: {
        resources: [
          {
            space_guid: '3310e016-2276-40c3-92a8-af7552444bbd',
            space_name: 'test space',
            organization_name: 'test org',
          },
        ],
      },
    } as unknown) as IServiceInstance;
    const { container } = render(
      <ServicePage
        service={{
          ...service,
          service: ({
            entity: { label: 'service-label' },
          } as unknown) as IService,
          service_plan: ({
            entity: { name: 'service-plan-name' },
          } as unknown) as IServicePlan,
        }}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        pageTitle="test"
        spaceGUID="SPACE_GUID"
      />,
    );
    expect(container.querySelector('td.label')).toHaveTextContent('service-label');
    expect(container.querySelector('td.plan')).toHaveTextContent('service-plan-name');
    expect(container.querySelector('td.status')).toHaveTextContent('success');
    expect(container.querySelector('td.sharedFrom')).toHaveTextContent('space test space in organisation test org');
    expect(container.querySelector('td.sharedTo')).toBeFalsy();
  });

});

describe(ServiceLogsPage, () => {
  const files = [
    { LastWritten: 1578837540000, LogFileName: 'file-one', Size: 73728 },
    { LastWritten: 1578841140000, LogFileName: 'file-two', Size: 1488978 },
    { LastWritten: 1578844740000, LogFileName: 'file-three', Size: 0 },
  ];
  const service = ({
    entity: { name: 'service-name' },
    metadata: { guid: 'SERVICE_GUID' },
  } as unknown) as IServiceInstance;

  it('should print out the list of downloadable files', () => {
    const { container } = render(<ServiceLogsPage
      files={files}
      service={service}
      linkTo={route => `__LINKS_TO__${route}`}
      routePartOf={route => route === 'admin.organizations.spaces.services.logs.view'}
      organizationGUID="ORG_GUID"
      pageTitle="test"
      spaceGUID="SPACE_GUID"
    />);

    expect(container.querySelectorAll('li.service-log-list-item')).toHaveLength(3);

    expect(container.querySelectorAll('li.service-log-list-item')[0]).toHaveTextContent('file-one');
    expect(container.querySelectorAll('li.service-log-list-item')[0]).toHaveTextContent('72.00 KiB');
    expect(container.querySelectorAll('li.service-log-list-item')[0]).toHaveTextContent('1:59pm, 12 January 2020');

    expect(container.querySelectorAll('li.service-log-list-item')[1]).toHaveTextContent('file-two');
    expect(container.querySelectorAll('li.service-log-list-item')[1]).toHaveTextContent('1.42 MiB');
    expect(container.querySelectorAll('li.service-log-list-item')[1]).toHaveTextContent('2:59pm, 12 January 2020');

    expect(container.querySelectorAll('li.service-log-list-item')[2]).toHaveTextContent('file-three');
    expect(container.querySelectorAll('li.service-log-list-item')[2]).toHaveTextContent('0 B');
    expect(container.querySelectorAll('li.service-log-list-item')[2]).toHaveTextContent('3:59pm, 12 January 2020');
  });

  it('should mention that there are no files available for download', () => {
    const { container } = render(<ServiceLogsPage
      files={[]}
      service={service}
      linkTo={route => `__LINKS_TO__${route}`}
      routePartOf={route => route === 'admin.organizations.spaces.services.logs.view'}
      organizationGUID="ORG_GUID"
      pageTitle="test"
      spaceGUID="SPACE_GUID"
    />);

    expect(container.querySelectorAll('li.service-log-list-item')).toHaveLength(0);

    expect(container).toHaveTextContent('There are no log files available at this time.');
  });
});
