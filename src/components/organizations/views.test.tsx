import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { IOrganization, IOrganizationQuota, IV3OrganizationQuota, IV3OrganizationResource } from '../../lib/cf/types';

import { EditOrganization, OrganizationsPage } from './views';


function linker(_route: string, params: any): string {
  return params?.organizationGUID ? `/org/${params.organizationGUID}` : '/test';
}

describe(OrganizationsPage, () => {
  const orgA = ({
    entity: { name: 'A', quota_definition_guid: 'trial' },
    metadata: { guid: 'a' },
  } as unknown) as IOrganization;
  const orgB = ({
    entity: { name: 'B', quota_definition_guid: 'billable' },
    metadata: { guid: 'b' },
  } as unknown) as IOrganization;
  const suspendedOrg = ({
    entity: { name: 'Suspended', quota_definition_guid: 'billable', status: 'suspended' },
    metadata: { guid: 'c' },
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

  it('should highlight suspended organizations', () => {
    const markup = shallow(
      <OrganizationsPage
        organizations={[orgA, suspendedOrg]}
        linkTo={linker}
        quotas={quotas}
      />,
    );
    const $ = cheerio.load(markup.html());

    expect($('table tbody tr')).toHaveLength(2);

    expect($('table tbody tr:first-of-type th a.govuk-link').text()).toBe('Organisation name: A');
    expect($('table tbody tr:first-of-type th span.govuk-tag--grey').length).toEqual(0);

    expect($('table tbody tr:nth-of-type(2) th a.govuk-link').text()).toBe('Organisation name: Suspended');
    expect($('table tbody tr:nth-of-type(2) th span.govuk-tag--grey').text()).toBe(
      'Suspended',
    );
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

describe(EditOrganization, () => {
  it('should parse the page correctly', () => {
    const quota = {
      apps: { total_memory_in_mb: 2 },
      guid: '__QUOTA_1_GUID__',
      name: 'quota-1',
      routes: { total_routes: 2 },
      services: { total_service_instances: 2 },
    };

    const markup = shallow(<EditOrganization
      csrf="__CSRF_TOKEN__"
      organization={{
        guid: '__ORG_GUID__',
        name: 'org-name',
        relationships: {
          quota: {
            data: {
              guid: '__QUOTA_2_GUID__',
            },
          },
        },
        suspended: true,
      } as IV3OrganizationResource}
      quotas={[
        quota as IV3OrganizationQuota,
        { ...quota, guid: '__QUOTA_2_GUID__', name: 'quota-2' } as IV3OrganizationQuota,
      ]}
    />);

    expect(markup.render().find('table').text()).toContain('quota-1');
    expect(markup.render().find('table').text()).toContain('quota-2');

    expect(markup.render().find('input#name').val()).toContain('org-name');

    expect(markup.render().find('select#quota option').text()).toContain('quota-1');
    expect(markup.render().find('select#quota option').text()).toContain('quota-2');
    expect(markup.render().find('select#quota option[selected]').text()).toEqual('quota-2');

    expect(markup.render().find('select#suspended option').text()).toContain('Active');
    expect(markup.render().find('select#suspended option').text()).toContain('Suspended');
    expect(markup.render().find('select#suspended option[selected]').text()).toEqual('Suspended');

    expect(spacesMissingAroundInlineElements(markup.render().html()!)).toHaveLength(0);
  });
});
