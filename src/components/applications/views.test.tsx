import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { IApplication } from '../../lib/cf/types';
import { ApplicationTab } from './views';

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
