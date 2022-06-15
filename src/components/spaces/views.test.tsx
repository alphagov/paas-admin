/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { GIBIBYTE, MEBIBYTE } from '../../layouts';
import {
  IAuditEvent,
  IAuditEventActorTarget,
  ISpace,
} from '../../lib/cf/types';

import {
  ApplicationsPage,
  BackingServicePage,
  EventsPage,
  IEnhancedApplication,
  IEnhancedOrganization,
  IEnhancedServiceInstance,
  IEnhancedSpace,
  IStripedUserServices,
  SpacesPage,
} from './views';

describe(EventsPage, () => {
  const event = ({
    guid: 'EVENT_GUID',
    type: 'audit.space.create',
    updated_at: new Date(),
    actor: { guid: 'ACCOUNTS_USER_GUID_1', name: 'Jeff Jefferson' },
    target: { guid: 'ACCOUNTS_USER_GUID_2', name: 'Charlie Chaplin' },
  } as unknown) as IAuditEvent;
  const actorEmails = { ACCOUNTS_USER_GUID_1: 'jeff@jefferson.com' };
  const space = ({
    metadata: { guid: 'SPACE_GUID' },
    entity: { name: 'SPACE_NAME' },
  } as unknown) as ISpace;

  it('should corretly print multiple events on the page', () => {
    const { container } = render(
      <EventsPage
        actorEmails={actorEmails}
        events={[
          event,
          {
            ...event,
            type: 'tester.testing',
            actor: {
              ...event.actor,
              guid: 'ACCOUNTS_USER_GUID_2',
              name: 'Charlie Chaplin',
            },
            target: ({
              guid: 'ACCOUNTS_USER_GUID_3',
            } as unknown) as IAuditEventActorTarget,
          },
          {
            ...event,
            type: 'tester.testing',
            actor: {
              ...event.actor,
              guid: 'ACCOUNTS_USER_GUID_3',
              name: undefined,
            },
            target: ({
              guid: 'ACCOUNTS_USER_GUID_1',
              name: 'Jeff Jefferson',
            } as unknown) as IAuditEventActorTarget,
          },
        ]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        space={space}
        pagination={{ total_results: 5, total_pages: 1, page: 1 }}
      />,
    );

    expect(container.querySelectorAll('table tbody tr')).toHaveLength(3);
    expect(container.querySelectorAll('table tbody .actor')[0]).toHaveTextContent(
      actorEmails.ACCOUNTS_USER_GUID_1,
    );
    expect(container.querySelectorAll('table tbody .actor')[0]).not.toHaveTextContent(event.actor.name);
    expect(container.querySelectorAll('table tbody .actor')[0]).not.toHaveTextContent(event.actor.guid);
    expect(container.querySelectorAll('table tbody .target')[0]).toHaveTextContent(event.target.name);
    expect(container.querySelectorAll('table tbody .target')[0]).not.toHaveTextContent(event.target.guid);
    expect(container.querySelector('table tbody .description')).toHaveTextContent('Created space');
    expect(container.querySelectorAll('table tbody .actor')[1]).toHaveTextContent('Charlie Chaplin');
    expect(container.querySelectorAll('table tbody .actor')[1]).not.toHaveTextContent('ACCOUNTS_USER_GUID_2');
    expect(container.querySelectorAll('table tbody .description')[1]).toHaveTextContent('tester.testing');
    expect(container.querySelectorAll('table tbody .target code')[0]).toHaveTextContent('ACCOUNTS_USER_GUID_3');
    expect(container.querySelectorAll('table tbody .actor code')[0]).toHaveTextContent('ACCOUNTS_USER_GUID_3');
    expect(container.querySelectorAll('table tbody .target')[2]).toHaveTextContent(actorEmails.ACCOUNTS_USER_GUID_1);
  });

  it('should not show the spaces events table if there are no events', () => {
    const { container } = render(
      <EventsPage
        actorEmails={actorEmails}
        events={[]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        space={space}
        pagination={{ total_results: 0, total_pages: 1, page: 1 }}
      />,
    );

    expect(container.querySelector('table')).toBeFalsy();
  });

  it('should not show the spaces events table if there are no events', () => {
    const { container } = render(
      <EventsPage
        actorEmails={actorEmails}
        events={[]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        space={space}
        pagination={{ total_results: 0, total_pages: 1, page: 1 }}
      />,
    );

    expect(container.querySelector('.govuk-tabs__panel')).not.toHaveTextContent('Event timestamps are in UTC format');
  });

  it('should not show pagination text/links if there is only 1 page of events', () => {
    const { container } = render(
      <EventsPage
        actorEmails={actorEmails}
        events={[
          event,
          {
            ...event,
            type: 'tester.testing',
            actor: {
              ...event.actor,
              guid: 'ACCOUNTS_USER_GUID_2',
              name: 'Charlie Chaplin',
            },
            target: ({
              guid: 'ACCOUNTS_USER_GUID_3',
            } as unknown) as IAuditEventActorTarget,
          },
          {
            ...event,
            type: 'tester.testing',
            actor: {
              ...event.actor,
              guid: 'ACCOUNTS_USER_GUID_3',
              name: undefined,
            },
            target: ({
              guid: 'ACCOUNTS_USER_GUID_1',
              name: 'Jeff Jefferson',
            } as unknown) as IAuditEventActorTarget,
          },
        ]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        space={space}
        pagination={{ total_results: 5, total_pages: 1, page: 1 }}
      />,
    );

    expect(container.querySelector('.govuk-tabs__panel')).not.toHaveTextContent('Previous page');
    expect(container.querySelector('.govuk-tabs__panel')).not.toHaveTextContent('Next page');
  });
});

describe(ApplicationsPage, () => {
  const space = ({
    metadata: { guid: 'SPACE_GUID' },
    entity: { name: 'SPACE_NAME' },
  } as unknown) as ISpace;
  const application = ({
    metadata: { guid: 'APPLICATION_GUID' },
    entity: { entity: 'APPLICATION_NAME' },
    summary: {
      running_instances: 1,
      instances: 2,
      memory: GIBIBYTE,
      disk_quota: GIBIBYTE,
      state: 'running',
    },
    urls: ['test.example.com'],
  } as unknown) as IEnhancedApplication;

  it('should print correct phrasing when single service listed', () => {
    const { container } = render(
      <ApplicationsPage
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        space={space}
        applications={[application]}
      />,
    );
    expect(container.querySelector('p')).toHaveTextContent('This space contains 1 application');
  });

  it('should print correct phrasing when single service listed', () => {
    const { container } = render(
      <ApplicationsPage
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        space={space}
        applications={[application, application]}
      />,
    );
    expect(container.querySelector('p')).toHaveTextContent('This space contains 2 applications');
  });

  it('should not display a table of applications if there no applications', () => {
    const { container } = render(
      <ApplicationsPage
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        space={space}
        applications={[]}
      />,
    );
    expect(container.querySelector('.govuk-table')).toBeFalsy();
  });
});

describe(BackingServicePage, () => {
  const space = ({
    metadata: { guid: 'SPACE_GUID' },
    entity: { name: 'SPACE_NAME' },
  } as unknown) as ISpace;
  const services = ([
    {
      metadata: { guid: 'SERVICE_GUID_1' },
      entity: { name: 'service-1', last_operation: { state: 'success' } },
      definition: { entity: { label: 'database' } },
      plan: { entity: { name: 'small' } },
    },
    { metadata: { guid: 'SERVICE_GUID_2' }, entity: { name: 'service-2' } },
  ] as unknown) as ReadonlyArray<
    IEnhancedServiceInstance | IStripedUserServices
  >;

  it('should correctly print the backing service page', () => {
    const { container } = render(
      <BackingServicePage
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        services={services}
        space={space}
      />,
    );
    expect(container.querySelector('p')).toHaveTextContent('This space contains 2 backing services');
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(2);
    expect(container.querySelectorAll('table tbody th.name')[0]).toHaveTextContent(services[0].entity.name);
    expect(container.querySelectorAll('table tbody th.name')[1]).toHaveTextContent(services[1].entity.name);
    expect(container.querySelectorAll('table tbody .label')[0]).toHaveTextContent(services[0].definition.entity.label);
    expect(container.querySelectorAll('table tbody .label')[1]).toHaveTextContent('User Provided Service');
    expect(container.querySelectorAll('table tbody .plan')[0]).toHaveTextContent(services[0].plan.entity.name);
    expect(container.querySelectorAll('table tbody .plan')[1]).toHaveTextContent('N/A');
    expect(container.querySelectorAll('table tbody .status')[0]).toHaveTextContent(services[0].entity.last_operation.state);
    expect(container.querySelectorAll('table tbody .status')[1]).toHaveTextContent('N/A');
  });

  it('should print correct phrasing when single service listed', () => {
    const { container } = render(
      <BackingServicePage
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        services={[services[0]]}
        space={space}
      />,
    );
    expect(container.querySelector('p')).toHaveTextContent('This space contains 1 backing service');
  });

  it('should not display a table of backing service if there no backing services', () => {
    const noServices = ([] as unknown) as ReadonlyArray<
      IEnhancedServiceInstance | IStripedUserServices
    >;
    const { container } = render(
      <BackingServicePage
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        services={noServices}
        space={space}
      />,
    );
    expect(container.querySelector('.govuk-table')).toBeFalsy();
  });
});

describe(SpacesPage, () => {
  const organization = ({
    metadata: { guid: 'ORG_GUID' },
    entity: { name: 'org-name' },
    memory_allocated: GIBIBYTE / MEBIBYTE,
    quota: {
      entity: { name: 'default', memory_limit: (5 * GIBIBYTE) / MEBIBYTE },
    },
  } as unknown) as IEnhancedOrganization;
  const space = ({
    metadata: { guid: 'SPACE_GUID_1' },
    entity: { name: 'space-name' },
    memory_allocated: GIBIBYTE / MEBIBYTE,
    quota: { entity: { memory_limit: (5 * GIBIBYTE) / MEBIBYTE } },
    running_apps: [null],
    stopped_apps: [null],
    serviceInstances: [null],
  } as unknown) as IEnhancedSpace;

  it('should correctly render the spaces page', () => {
    const { container, queryByText } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={organization}
        spaces={[space, { ...space, quota: undefined }]}
        users={[null]}
      />,
    );
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(2);
    expect(container.querySelector('h1')).toHaveTextContent(organization.entity.name);
    expect(container.querySelector('h2 + span')).toHaveTextContent('20.0%');
    expect(container.querySelector('p')).toHaveTextContent(
      'Using 1.00 GiB of memory out of a maximum of 5.00 GiB.',
    );
    expect(queryByText('View team members')).toBeTruthy();
    expect(queryByText('Trial')).toBeTruthy();
    expect(queryByText('Trial organisations have limited access to backing services')).toBeTruthy();
    expect(queryByText(`There are 2 spaces in ${organization.entity.name}.`)).toBeTruthy();
    expect(container.querySelectorAll('table tbody tr')[0]).toHaveTextContent(space.entity.name);
    expect(container.querySelectorAll('table tbody tr')[1]).toHaveTextContent(space.entity.name);
    expect(container.querySelectorAll('table tbody tr')[0]).toHaveTextContent('1.00 GiB');
    expect(container.querySelectorAll('table tbody tr')[1]).toHaveTextContent('no limit');
  });

  it('should correctly render the spaces page with single space', () => {
    const { container, queryByText } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={true}
        isManager={true}
        isBillingManager={false}
        organization={organization}
        spaces={[space]}
        users={[null]}
      />,
    );
    expect(container.querySelector('table tbody tr')).toBeTruthy();
    expect(queryByText('Manage this organization')).toBeTruthy();
    expect(queryByText(`There is 1 space in ${organization.entity.name}.`)).toBeTruthy();
  });

  it('should highlight suspended state in main heading', () => {

    const suspendedOrganization = ({
      metadata: { guid: 'ORG_GUID' },
      entity: { name: 'org-name', status: 'suspended' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: {
        entity: { name: 'default', memory_limit: (5 * GIBIBYTE) / MEBIBYTE },
      },
    } as unknown) as IEnhancedOrganization;

    const { container } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={suspendedOrganization}
        spaces={[space, { ...space, quota: undefined }]}
        users={[null]}
      />,
    );

    expect(container.querySelector('h1')).toHaveTextContent('Status: Suspended');
  })

  it('should not display a table of spaces if there are no spaces', () => {
    const { container } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={organization}
        spaces={[]}
        users={[null]}
      />)

    expect(container.querySelector('.govuk-table')).toBeFalsy();
  });

  it('should not show expiration notice / count if the organisation is of type billable', () => {

    const organization = ({
      metadata: { guid: 'ORG_GUID' },
      entity: { name: 'org-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: {
        entity: { name: 'name', memory_limit: (5 * GIBIBYTE) / MEBIBYTE },
      },
    } as unknown) as IEnhancedOrganization;
    const space = ({
      metadata: { guid: 'SPACE_GUID_1' },
      entity: { name: 'space-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: { entity: { memory_limit: (5 * GIBIBYTE) / MEBIBYTE } },
      running_apps: [null],
      stopped_apps: [null],
      serviceInstances: [null],
    } as unknown) as IEnhancedSpace;

    const { container } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={organization}
        spaces={[space, { ...space, quota: undefined }]}
        users={[null]}
        daysLeftInTrialPeriod={null}
      />,
    );

    expect(container).not.toHaveTextContent('Trial period');
  });

  it('should show expiration notice if the trial org is more than 90 days old', () => {

    const organization = ({
      metadata: { guid: 'ORG_GUID' },
      entity: { name: 'org-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: {
        entity: { name: 'default', memory_limit: (5 * GIBIBYTE) / MEBIBYTE },
      },
    } as unknown) as IEnhancedOrganization;
    const space = ({
      metadata: { guid: 'SPACE_GUID_1' },
      entity: { name: 'space-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: { entity: { memory_limit: (5 * GIBIBYTE) / MEBIBYTE } },
      running_apps: [null],
      stopped_apps: [null],
      serviceInstances: [null],
    } as unknown) as IEnhancedSpace;

    const { container } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={organization}
        spaces={[space, { ...space, quota: undefined }]}
        users={[null]}
        daysLeftInTrialPeriod={-2}
      />,
    );
    expect(container).toHaveTextContent('Trial period has expired');
  });

  it('should show count of days until trial period expires', () => {

    const organization = ({
      metadata: { guid: 'ORG_GUID' },
      entity: { name: 'org-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: {
        entity: { name: 'default', memory_limit: (5 * GIBIBYTE) / MEBIBYTE },
      },
    } as unknown) as IEnhancedOrganization;
    const space = ({
      metadata: { guid: 'SPACE_GUID_1' },
      entity: { name: 'space-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: { entity: { memory_limit: (5 * GIBIBYTE) / MEBIBYTE } },
      running_apps: [null],
      stopped_apps: [null],
      serviceInstances: [null],
    } as unknown) as IEnhancedSpace;

    const { container } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={organization}
        spaces={[space, { ...space, quota: undefined }]}
        users={[null]}
        daysLeftInTrialPeriod={60}
      />,
    );
    expect(container).toHaveTextContent('Trial period expires in 60 days');
  });

  it('should show count of 1 day until trial period expires', () => {

    const organization = ({
      metadata: { guid: 'ORG_GUID' },
      entity: { name: 'org-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: {
        entity: { name: 'default', memory_limit: (5 * GIBIBYTE) / MEBIBYTE },
      },
    } as unknown) as IEnhancedOrganization;
    const space = ({
      metadata: { guid: 'SPACE_GUID_1' },
      entity: { name: 'space-name' },
      memory_allocated: GIBIBYTE / MEBIBYTE,
      quota: { entity: { memory_limit: (5 * GIBIBYTE) / MEBIBYTE } },
      running_apps: [null],
      stopped_apps: [null],
      serviceInstances: [null],
    } as unknown) as IEnhancedSpace;

    const { container } = render(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={organization}
        spaces={[space, { ...space, quota: undefined }]}
        users={[null]}
        daysLeftInTrialPeriod={1}
      />,
    );
    expect(container).toHaveTextContent('Trial period expires in 1 day.');
  });

});
