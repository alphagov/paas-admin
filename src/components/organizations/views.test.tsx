import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { IOrganization, IOrganizationQuota, IV3OrganizationQuota } from '../../lib/cf/types';

import { OrganizationsPage, EditOrganizationQuota } from './views';
import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';

function linker(_route: string, params: any): string {
  return params?.organizationGUID ? `/org/${params.organizationGUID}` : '/test';
}

describe(OrganizationsPage, () => {
  const orgA = ({
    metadata: { guid: 'a' },
    entity: { name: 'A', quota_definition_guid: 'trial' },
  } as unknown) as IOrganization;
  const orgB = ({
    metadata: { guid: 'b' },
    entity: { name: 'B', quota_definition_guid: 'billable' },
  } as unknown) as IOrganization;
  const quotaBillable = ({
    entity: { name: 'not-default' },
  } as unknown) as IOrganizationQuota;
  const quotaFree = ({
    entity: { name: 'default' },
  } as unknown) as IOrganizationQuota;
  const quotas = { billable: quotaBillable, trial: quotaFree };

  it('should display list of organizations', () => {
    const markup = shallow(
      <OrganizationsPage
        organizations={[orgA, orgB]}
        linkTo={linker}
        quotas={quotas}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('p.govuk-body:first-of-type').text()).toContain(
      'There are 2 organisations which you can access.',
    );
    expect($('table tbody tr')).toHaveLength(2);

    expect($('table tbody tr:first-of-type th a.govuk-link').text()).toBe('Organisation name: A');
    expect($('table tbody tr:first-of-type th a.govuk-link').prop('href')).toBe(
      '/org/a',
    );
    expect($('table tbody tr:first-of-type td:last-of-type').text()).toBe(
      'Trial',
    );

    expect($('table tr:last-of-type th a.govuk-link').text()).toBe('Organisation name: B');
    expect($('table tr:last-of-type th a.govuk-link').prop('href')).toBe('/org/b');
    expect($('table tr:last-of-type td:last-of-type').text()).toBe('Billable');
  });

  it('should display list of organizations with single item', () => {
    const markup = shallow(
      <OrganizationsPage
        organizations={[orgA]}
        linkTo={linker}
        quotas={quotas}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('p.govuk-body:first-of-type').text()).toContain(
      'There is 1 organisation which you can access.',
    );
    expect($('table tbody tr')).toHaveLength(1);
  });
});

describe(EditOrganizationQuota, () => {
  it('should parse the page correctly', () => {
    const quota = {
      guid: '__QUOTA_1_GUID__',
      name: 'quota-1',
      apps: { total_memory_in_mb: 2 },
      routes: { total_routes: 2 },
      services: { total_service_instances: 2 },
    };

    const markup = shallow(<EditOrganizationQuota
      csrf="__CSRF_TOKEN__"
      organization={{
        entity: { name: 'org-name', quota_definition_guid: '__QUOTA_2_GUID__' },
        metadata: { guid: '__ORG_GUID__' },
      } as IOrganization}
      quotas={[
        quota as IV3OrganizationQuota,
        { ...quota, guid: '__QUOTA_2_GUID__', name: 'quota-2' } as IV3OrganizationQuota,
      ]}
    />);

    expect(markup.render().find('table').text()).toContain('quota-1');
    expect(markup.render().find('table').text()).toContain('quota-2');

    expect(markup.render().find('select option').text()).toContain('quota-1');
    expect(markup.render().find('select option').text()).toContain('quota-2');
    expect(markup.render().find('select option[selected]').text()).toEqual('quota-2');

    expect(spacesMissingAroundInlineElements(markup.render().html()!)).toHaveLength(0);
  });
});
