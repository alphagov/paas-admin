/**
 * @jest-environment jsdom
 */
 import { render, screen } from '@testing-library/react';
import React from 'react';

import { IApplication, IAuditEvent } from '../../lib/cf/types';

import { ApplicationEventsPage } from './views';

describe(ApplicationEventsPage, () => {
  const application = ({
    metadata: { guid: 'APPLICATION_GUID' },
    entity: { name: 'test-app' },
  } as unknown) as IApplication;
  const event = ({
    guid: 'EVENT_GUID',
    type: 'audit.space.create',
    updated_at: new Date(),
    actor: { guid: 'ACCOUNTS_USER_GUID_1', name: 'Jeff Jefferson' },
  } as unknown) as IAuditEvent;
  const actorEmails = { ACCOUNTS_USER_GUID_1: 'jeff@jefferson.com' };

  it('should parse application events page', () => {
    render(
      <ApplicationEventsPage
        actorEmails={actorEmails}
        application={application}
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
          },
          {
            ...event,
            type: 'tester.testing',
            actor: {
              ...event.actor,
              guid: 'ACCOUNTS_USER_GUID_3',
              name: undefined,
            },
          },
        ]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
        pagination={{ total_results: 5, total_pages: 1, page: 1 }}
      />,
    );
    const eventsTable = screen.getByRole('table')
    expect(eventsTable.querySelectorAll('tbody tr')).toHaveLength(3)
    expect(eventsTable).toHaveTextContent(actorEmails.ACCOUNTS_USER_GUID_1);
    expect(eventsTable).not.toHaveTextContent(event.actor.name);
    expect(eventsTable).not.toHaveTextContent(event.actor.guid);
    expect(eventsTable).toHaveTextContent('Created space');
    expect(eventsTable).toHaveTextContent('Charlie Chaplin');
    expect(eventsTable).not.toHaveTextContent('ACCOUNTS_USER_GUID_2');
    expect(eventsTable).toHaveTextContent('tester.testing');
    expect(eventsTable).toHaveTextContent('ACCOUNTS_USER_GUID_3');
  });

  it('should not show the application events table if there are no events', () => {
    const { queryByRole } = render(
      <ApplicationEventsPage
        actorEmails={actorEmails}
        application={application}
        events={[]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
        pagination={{ total_results: 0, total_pages: 1, page: 1 }}
      />,
    );
    expect(queryByRole('table')).toBeNull();
  });

  it('should not show the timestamp text if there are no events', () => {
    const { queryByText } = render(
      <ApplicationEventsPage
        actorEmails={actorEmails}
        application={application}
        events={[]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
        pagination={{ total_results: 0, total_pages: 1, page: 1 }}
      />,
    );
    expect(queryByText('Event timestamps are in UTC format')).toBeNull();
  });

  it('should not show pagination text/links if there is only 1 page of events', () => {
    const { queryByText } = render(
      <ApplicationEventsPage
        actorEmails={actorEmails}
        application={application}
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
          },
          {
            ...event,
            type: 'tester.testing',
            actor: {
              ...event.actor,
              guid: 'ACCOUNTS_USER_GUID_3',
              name: undefined,
            },
          },
        ]}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.applications.events.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
        pagination={{ total_results: 5, total_pages: 1, page: 1 }}
      />,
    );
    expect(queryByText('Previous page')).toBeNull();
    expect(queryByText('Next page')).toBeNull();
  });

});
