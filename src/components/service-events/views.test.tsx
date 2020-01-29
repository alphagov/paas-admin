import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { IAuditEvent, IServiceInstance } from '../../lib/cf/types';
import { ServiceEventsPage } from './views';

describe(ServiceEventsPage, () => {
  const service = ({
    metadata: { guid: 'SERVICE_GUID' },
    entity: { name: 'service-name' },
  } as unknown) as IServiceInstance;
  const event = ({
    guid: 'EVENT_GUID',
    type: 'audit.space.create',
    updated_at: new Date(),
    actor: { guid: 'ACCOUNTS_USER_GUID_1', name: 'Jeff Jefferson' },
  } as unknown) as IAuditEvent;
  const actorEmails = { ACCOUNTS_USER_GUID_1: 'jeff@jefferson.com' };

  it('should parse service events page', () => {
    const markup = shallow(
      <ServiceEventsPage
        actorEmails={actorEmails}
        service={service}
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
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
        pagination={{ total_results: 5, total_pages: 1, page: 1 }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('table tbody tr')).toHaveLength(3);
    expect($('table tbody').text()).toContain(actorEmails.ACCOUNTS_USER_GUID_1);
    expect($('table tbody').text()).not.toContain(event.actor.name);
    expect($('table tbody').text()).not.toContain(event.actor.guid);
    expect($('table tbody').text()).toContain('Created space');
    expect($('table tbody').text()).toContain('Charlie Chaplin');
    expect($('table tbody').text()).not.toContain('ACCOUNTS_USER_GUID_2');
    expect($('table tbody').text()).toContain('tester.testing');
    expect($('table tbody').text()).toContain('ACCOUNTS_USER_GUID_3');
    expect(spacesMissingAroundInlineElements(markup.html())).toHaveLength(0);
  });
});
