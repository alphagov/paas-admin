/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import { format } from 'date-fns';
import React from 'react';

import { DATE_TIME } from '../../layouts';
import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { IAccountsUser } from '../../lib/accounts';
import { IAuditEvent, IAuditEventActorTarget } from '../../lib/cf/types';

import { Details, Event, EventTimestamps, TargetedEvent, Totals } from './views';

describe(Details, () => {
  it('should display details element', () => {
    const { container } = render(<Details />);
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});

describe(Event, () => {
  const actor = ({ email: 'jeff@jefferson.com' } as unknown) as IAccountsUser;
  const updatedAt = new Date();
  const event = ({
    actor: { guid: 'AUDIT_EVENT_ACTOR_GUID', name: 'Jeff Jefferson' },
    data: {
      droplet_guid: 'DROPLET_GUID',
      package_guid: 'PACKAGE_GUID',
    },
    type: 'tester.testing',
    updated_at: updatedAt,
  } as unknown) as IAuditEvent;

  it('should display event element', () => {
    const { container } = render(<Event event={event} />);
    expect(container.querySelector('.date dd')).toHaveTextContent(format(updatedAt, DATE_TIME));
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(actor.email);
    expect(container.querySelector('.actor dd')).toHaveTextContent(event.actor.name);
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(event.actor.guid);
    expect(container.querySelector('.description dd')).toHaveTextContent(event.type);
    expect(container.querySelector('.metadata dd')).toHaveTextContent(
      '"droplet_guid": "DROPLET_GUID"',
    );
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should display event element when actors name is missing', () => {
    const { container } = render(
      <Event
        event={{
          ...event,
          // @ts-ignore This is deliberate to test out the case when the name is not provided.
          actor: { ...event.actor, name: undefined },
          type: 'audit.space.create',
        }}
      />,
    );
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(actor.email);
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(event.actor.name);
    expect(container.querySelector('.actor dd')).toHaveTextContent(event.actor.guid);
    expect(container.querySelector('.description dd')).not.toHaveTextContent(event.type);
    expect(container.querySelector('.description dd')).not.toHaveTextContent('audit.space.create');
    expect(container.querySelector('.description dd')).toHaveTextContent('Created space');
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should display event element when actor separately provided', () => {
    const { container } = render(<Event event={event} actor={actor} />);
    expect(container.querySelector('.actor dd')).toHaveTextContent(actor.email);
    expect(container.querySelector('.actor dd')).toHaveTextContent('jeff');
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});

describe(TargetedEvent, () => {
  const actor = ({ email: 'jeff@jefferson.com' } as unknown) as IAccountsUser;
  const target = ({ guid: 'TAGET_GUID' } as unknown) as IAuditEventActorTarget;
  const updatedAt = new Date();
  const event = ({
    actor: { guid: 'AUDIT_EVENT_ACTOR_GUID', name: 'Jeff Jefferson' },
    data: {
      droplet_guid: 'DROPLET_GUID',
      package_guid: 'PACKAGE_GUID',
    },
    target,
    type: 'tester.testing',
    updated_at: updatedAt,
  } as unknown) as IAuditEvent;

  it('should display targeted event element', () => {
    const { container } = render(<TargetedEvent event={event} />);
    expect(container.querySelector('.date dd')).toHaveTextContent(format(updatedAt, DATE_TIME));
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(actor.email);
    expect(container.querySelector('.actor dd')).toHaveTextContent(event.actor.name);
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(event.actor.guid);
    expect(container.querySelector('.target dd code')).toHaveTextContent(target.guid);
    expect(container.querySelector('.description dd')).toHaveTextContent(event.type);
    expect(container.querySelector('.metadata dd')).toHaveTextContent(
      '"droplet_guid": "DROPLET_GUID"',
    );
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should display targeted event element when actors name is missing', () => {
    const { container } = render(
      <TargetedEvent
        event={{
          ...event,
          // @ts-ignore This is deliberate to test out the case when the name is not provided.
          actor: { ...event.actor, name: undefined },
          type: 'audit.space.create',
        }}
      />,
    );
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(actor.email);
    expect(container.querySelector('.actor dd')).not.toHaveTextContent(event.actor.name);
    expect(container.querySelector('.actor dd')).toHaveTextContent(event.actor.guid);
    expect(container.querySelector('.target dd code')).toHaveTextContent(target.guid);
    expect(container.querySelector('.description dd')).not.toHaveTextContent(event.type);
    expect(container.querySelector('.description dd')).not.toHaveTextContent('audit.space.create');
    expect(container.querySelector('.description dd')).toHaveTextContent('Created space');
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should display targeted event element when actor separately provided', () => {
    const { container } = render(
      <TargetedEvent
        event={{ ...event, target: { ...target, name: 'jeff' } }}
        actor={actor}
      />,
    );
    expect(container.querySelector('.actor dd')).toHaveTextContent(actor.email);
    expect(container.querySelector('.target dd')).toHaveTextContent('jeff');
    expect(container.querySelector('.target dd')).not.toHaveTextContent(target.guid);
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});

describe(Totals, () => {
  it('should display totals element', () => {
    const { queryByText, container } = render(<Totals results={5} page={1} pages={2} />);
    expect(queryByText('There are 5 total events. Displaying page 1 of 2.')).toBeTruthy();
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should not display "Displaying page 1 of 1" totals text if there is only 1 page', () => {
    const { queryByText, container } = render(<Totals results={5} page={1} pages={1} />);
    expect(queryByText('Displaying page 1 of 1.')).toBeFalsy();
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});

describe(EventTimestamps, () => {
  it('should display EventTimestamp element', () => {
    const { queryByText, container } = render(<EventTimestamps />);
    expect(queryByText('Event timestamps are in UTC format.')).toBeTruthy();
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});

