import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { IService, IServiceInstance, IServicePlan } from '../../lib/cf/types';

import { ServicePage, ServiceTab } from './views';

describe(ServiceTab, () => {
  it('should produce service tab', () => {
    const service = ({
      metadata: { guid: 'SERVICE_GUID' },
      entity: { name: 'service-name' },
    } as unknown) as IServiceInstance;
    const markup = shallow(
      <ServiceTab
        service={service}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
      >
        <p>TEST</p>
      </ServiceTab>,
    );
    const $ = cheerio.load(markup.html());
    expect($('h1').text()).toContain('service-name');
    expect($('section.govuk-tabs__panel').text()).toEqual('TEST');
    expect($('ul li:first-of-type a').prop('href')).toEqual(
      '__LINKS_TO__admin.organizations.spaces.services.view',
    );
    expect(
      $('ul li:first-of-type').hasClass('govuk-tabs__list-item--selected'),
    ).toBe(true);
    expect($('ul li:last-of-type a').prop('href')).toEqual(
      '__LINKS_TO__admin.organizations.spaces.services.events.view',
    );
    expect(
      $('ul li:last-of-type').hasClass('govuk-tabs__list-item--selected'),
    ).toBe(false);
  });
});

describe(ServicePage, () => {
  it('should not display default values', () => {
    const service = ({
      metadata: { guid: 'SERVICE_GUID' },
      entity: {
        last_operation: { state: 'success' },
        name: 'service-name',
        tags: [],
      },
    } as unknown) as IServiceInstance;
    const markup = shallow(
      <ServicePage
        service={{
          ...service,
          service_plan: ({
            entity: { name: 'service-plan-name' },
          } as unknown) as IServicePlan,
          service: ({
            entity: { label: 'service-label' },
          } as unknown) as IService,
        }}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('td.label').text()).toContain('service-label');
    expect($('td.plan').text()).toContain('service-plan-name');
    expect($('td.status').text()).toContain('success');
  });

  it('should fallback to default values', () => {
    const service = ({
      metadata: { guid: 'SERVICE_GUID' },
      entity: { name: 'service-name', tags: [] },
    } as unknown) as IServiceInstance;
    const markup = shallow(
      <ServicePage
        service={service}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'
        }
        organizationGUID="ORG_GUID"
        spaceGUID="SPACE_GUID"
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('td.label').text()).toContain('User Provided Service');
    expect($('td.plan').text()).toContain('N/A');
    expect($('td.status').text()).toContain('N/A');
  });
});
