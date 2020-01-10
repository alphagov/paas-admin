import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import moment from 'moment';
import React from 'react';

import { DATE_TIME } from '../../layouts';
import { testSpacing } from '../../layouts/react-spacing.test';
import { IAccountsUser } from '../../lib/accounts';
import { IAuditEvent } from '../../lib/cf/types';
import { Details, Event, Totals } from './views';

describe(Details, () => {
  it('should display details element', () => {
    const markup = shallow(<Details />);
    expect(testSpacing(markup.html())).toHaveLength(0);
  });
});

describe(Event, () => {
  const actor = {email: 'jeff@jefferson.com'} as unknown as IAccountsUser;
  const event = {
    type: 'tester.testing',
    actor: {guid: 'AUDIT_EVENT_ACTOR_GUID', name: 'Jeff Jefferson'},
    data: {
      droplet_guid: 'DROPLET_GUID',
      package_guid: 'PACKAGE_GUID',
    },
  } as unknown as IAuditEvent;
  const updatedAt = new Date();

  it('should display event element', () => {
    const markup = shallow(<Event event={event} />);
    const $ = cheerio.load(markup.html());
    expect($('dd').text()).toContain(moment(updatedAt).format(DATE_TIME));
    expect($('dd').text()).not.toContain(actor.email);
    expect($('dd').text()).toContain(event.actor.name);
    expect($('dd').text()).not.toContain(event.actor.guid);
    expect($('dd').text()).toContain(event.type);
    expect($('dd').text()).toContain('\"droplet_guid\": \"DROPLET_GUID\"');
    expect(testSpacing($.html())).toHaveLength(0);
  });

  it('should display event element when actors name is missing', () => {
    const markup = shallow(<Event
      event={{...event, actor: {...event.actor, name: undefined}, type: 'audit.space.create'}}
    />);
    const $ = cheerio.load(markup.html());
    expect($('dd').text()).not.toContain(actor.email);
    expect($('dd').text()).not.toContain(event.actor.name);
    expect($('dd').text()).toContain(event.actor.guid);
    expect($('dd').text()).not.toContain(event.type);
    expect($('dd').text()).not.toContain('audit.space.create');
    expect($('dd').text()).toContain('Created space');
    expect(testSpacing($.html())).toHaveLength(0);
  });

  it('should display event element when actor separately provided', () => {
    const markup = shallow(<Event event={event} actor={actor} />);
    const $ = cheerio.load(markup.html());
    expect($('dd').text()).toContain(actor.email);
    expect($('dd').text()).not.toContain(event.actor.name);
    expect(testSpacing($.html())).toHaveLength(0);
  });
});

describe(Totals, () => {
  it('should display totals element', () => {
    const markup = shallow(<Totals results={5} page={1} pages={1} />);
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain('There are 5 total events. Displaying page 1 of 1.');
    expect(testSpacing($.html())).toHaveLength(0);
  });
});
