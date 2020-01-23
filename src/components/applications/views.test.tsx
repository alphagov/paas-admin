import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { IApplication } from '../../lib/cf/types';
import { ApplicationTab, AppLink } from './views';

describe(ApplicationTab, () => {
  it('should produce path of items', () => {
    const application = {metadata: {guid: 'APPLICATION_GUID'}, entity: {name: 'test-app'}} as unknown as IApplication;
    const markup = shallow(<ApplicationTab
      application={application}
      linkTo={route => `__LINKS_TO__${route}`}
      routePartOf={route => route === 'admin.organizations.spaces.applications.events.view'}
      organizationGUID="ORG_GUID"
      spaceGUID="SPACE_GUID"
    >
      <p>TEST</p>
    </ApplicationTab>);
    const $ = cheerio.load(markup.html());
    expect($('h1').text()).toContain('test-app');
    expect($('section.govuk-tabs__panel').text()).toEqual('TEST');
    expect($('ul li:first-of-type a').prop('href')).toEqual('__LINKS_TO__admin.organizations.spaces.applications.view');
    expect($('ul li:first-of-type').hasClass('govuk-tabs__list-item--selected')).toBe(false);
    expect($('ul li:last-of-type a').prop('href')).toEqual('__LINKS_TO__admin.organizations.spaces.applications.events.view');
    expect($('ul li:last-of-type').hasClass('govuk-tabs__list-item--selected')).toBe(true);
  });
});

describe(AppLink, () => {
  const external = 'https://example.com';
  const internal = 'example.apps.internal';

  it('should resolve with a link', () => {
    const markup = shallow(<AppLink href={external} />);
    expect(markup.find('a')).toHaveLength(1);
    expect(markup.find('a').prop('href')).toEqual(external);
  });

  it('should resolve with a text only', () => {
    const markup = shallow(<AppLink href={internal} />);
    expect(markup.find('a')).toHaveLength(0);
    expect(markup.text()).toEqual(internal);
  });
});
