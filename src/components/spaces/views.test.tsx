import cheerio from 'cheerio';
import { shallow } from 'enzyme';
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
    const markup = shallow(
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

    const $ = cheerio.load(markup.html());
    expect($('table tbody tr')).toHaveLength(3);
    expect($('table tbody .actor').text()).toContain(
      actorEmails.ACCOUNTS_USER_GUID_1,
    );
    expect($('table tbody .actor').text()).not.toContain(event.actor.name);
    expect($('table tbody .actor').text()).not.toContain(event.actor.guid);
    expect($('table tbody .target').text()).toContain(event.target.name);
    expect($('table tbody .target').text()).not.toContain(event.target.guid);
    expect($('table tbody .description').text()).toContain('Created space');

    expect($('table tbody .actor').text()).toContain('Charlie Chaplin');
    expect($('table tbody .actor').text()).not.toContain(
      'ACCOUNTS_USER_GUID_2',
    );
    expect($('table tbody .description').text()).toContain('tester.testing');
    expect($('table tbody .target code').text()).toContain(
      'ACCOUNTS_USER_GUID_3',
    );

    expect($('table tbody .actor code').text()).toContain(
      'ACCOUNTS_USER_GUID_3',
    );
    expect($('table tbody .target').text()).toContain(
      actorEmails.ACCOUNTS_USER_GUID_1,
    );
  });

  it('should not show the spaces events table if there are no events', () => {
    const markup = shallow(
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

    const $ = cheerio.load(markup.html());
    expect($('table')).toHaveLength(0);
  });

  it('should not show the spaces events table if there are no events', () => {
    const markup = shallow(
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

    const $ = cheerio.load(markup.html());
    expect($('.govuk-tabs__panel').text()).not.toContain('Event timestamps are in UTC format');
  });

  it('should not show pagination text/links if there is only 1 page of events', () => {
    const markup = shallow(
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

    const $ = cheerio.load(markup.html());
    expect($('.govuk-tabs__panel').text()).not.toContain('Previous page');
    expect($('.govuk-tabs__panel').text()).not.toContain('Next page');
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
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain('This space contains 1 application');
  });

  it('should print correct phrasing when single service listed', () => {
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain('This space contains 2 applications');
  });

  it('should not display a table of applications if there no applications', () => {
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('.govuk-table')).toHaveLength(0);
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
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain('This space contains 2 backing services');
    expect($('table tbody tr')).toHaveLength(2);
    expect($('table tbody th.name').text()).toContain(services[0].entity.name);
    expect($('table tbody th.name').text()).toContain(services[1].entity.name);
    expect($('table tbody .label').text()).toContain(
      services[0].definition.entity.label,
    );
    expect($('table tbody .label').text()).toContain('User Provided Service');
    expect($('table tbody .plan').text()).toContain(
      services[0].plan.entity.name,
    );
    expect($('table tbody .plan').text()).toContain('N/A');
    expect($('table tbody .status').text()).toContain(
      services[0].entity.last_operation.state,
    );
    expect($('table tbody .status').text()).toContain('N/A');
  });

  it('should print correct phrasing when single service listed', () => {
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain('This space contains 1 backing service');
  });

  it('should not display a table of backing service if there no backing services', () => {
    const noServices = ([] as unknown) as ReadonlyArray<
      IEnhancedServiceInstance | IStripedUserServices
    >;
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('.govuk-table')).toHaveLength(0);
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
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('table tbody tr')).toHaveLength(2);
    expect($('h1').text()).toContain(organization.entity.name);
    expect($('h2 + span').text()).toContain('20.0%');
    expect($('p').text()).toContain(
      'Using 1.00 GiB of memory out of a maximum of 5.00 GiB.',
    );
    expect($('a').text()).toContain('View  team members');
    expect($('span').text()).toContain('Trial');
    expect($('p').text()).toContain(
      'Trial organisations have limited access to backing services',
    );
    expect($('p').text()).toContain(
      `There are 2 spaces in ${organization.entity.name}.`,
    );
    expect($('table tbody tr').text()).toContain(space.entity.name);
    expect($('table tbody tr').text()).toContain(space.entity.name);
    expect($('table tbody tr').text()).toContain('1.00 GiB');
    expect($('table tbody tr').text()).toContain('no limit');
  });

  it('should correctly render the spaces page with single space', () => {
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('table tbody tr')).toHaveLength(1);
    expect($('p').text()).toContain('Manage this organization');
    expect($('p').text()).toContain(
      `There is 1 space in ${organization.entity.name}.`,
    );
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

    const markup = shallow(
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
    const $ = cheerio.load(markup.html());

    expect($('h1').text()).toContain('Status: Suspended');
  })

  it('should not display a table of spaces if there are no spaces', () => {
    const markup = shallow(
      <SpacesPage
        linkTo={route => `__LINKS_TO__${route}`}
        isAdmin={false}
        isManager={false}
        isBillingManager={false}
        organization={organization}
        spaces={[]}
        users={[null]}
      />)

    const $ = cheerio.load(markup.html());
    expect($('.govuk-table')).toHaveLength(0);
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

    const markup = shallow(
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

    const $ = cheerio.load(markup.html());
    expect($('p').text()).not.toContain(
      'Trial period',
    );
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

    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain(
      'Trial period has expired',
    );
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

    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain(
      'Trial period expires in 60 days',
    );
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

    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain(
      'Trial period expires in 1 day.',
    );
  });

});
