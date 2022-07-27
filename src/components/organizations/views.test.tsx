/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
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
    const { container } = render(
      <OrganizationsPage
        organizations={[orgA, orgB]}
        linkTo={linker}
        quotas={quotas}
      />,
    );
    expect(container.querySelector('h1 + .govuk-body:first-of-type')).toHaveTextContent(
      'There are 2 organisations which you can access.',
    );
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(2);
    expect(container
      .querySelectorAll('table .govuk-link')[0])
      .toHaveTextContent('Organisation name: A');
    expect(container
      .querySelectorAll('table .govuk-link')[0])
      .toHaveAttribute('href', expect.stringContaining('/org/a'));
    expect(container.querySelector('table tbody tr:first-of-type td:last-of-type')).toHaveTextContent(
      'Trial',
    );
    expect(container
      .querySelectorAll('table .govuk-link')[1])
      .toHaveTextContent('Organisation name: B');
    expect(container
      .querySelectorAll('table .govuk-link')[1])
      .toHaveAttribute('href', expect.stringContaining('/org/b'));
    expect(container.querySelector('table tr:last-of-type td:last-of-type')).toHaveTextContent('Billable');
  });

  it('should highlight suspended organizations', () => {
    const { container } = render(
      <OrganizationsPage
        organizations={[orgA, suspendedOrg]}
        linkTo={linker}
        quotas={quotas}
      />,
    );
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(2);

    expect(container
      .querySelectorAll('table .govuk-link')[0])
      .toHaveTextContent('Organisation name: A');
    expect(container.querySelector('table tr:first-of-type .govuk-tag')).toBeNull();

    expect(container
      .querySelectorAll('table .govuk-link')[1])
      .toHaveTextContent('Organisation name: Suspended');
    expect(container
      .querySelector('table tr:last-of-type .govuk-tag'))
      .toHaveTextContent('Suspended');
  });

  it('should display list of organizations with single item', () => {
    const { container } = render(
      <OrganizationsPage
        organizations={[orgA]}
        linkTo={linker}
        quotas={quotas}
      />,
    );
    expect(container.querySelector('h1 + .govuk-body:first-of-type')).toHaveTextContent(
      'There is 1 organisation which you can access.',
    );
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(1);
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

    const { container } = render(<EditOrganization
      csrf="__CSRF_TOKEN__"
      organization={{
        guid: '__ORG_GUID__',
        metadata: { annotations: { owner: 'Testing Departament' } },
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

    expect(container.querySelector('table')).toHaveTextContent('quota-1');
    expect(container.querySelector('table')).toHaveTextContent('quota-2');

    expect(container.querySelector('input#name')).toHaveValue('org-name');

    expect(container.querySelectorAll('select#quota option')[0]).toHaveTextContent('quota-1');
    expect(container.querySelectorAll('select#quota option')[1]).toHaveTextContent('quota-2');
    expect(container.querySelector('select#quota option:checked')).toHaveTextContent('quota-2');

    expect(container.querySelectorAll('select#suspended option')[0]).toHaveTextContent('Active');
    expect(container.querySelectorAll('select#suspended option')[1]).toHaveTextContent('Suspended');
    expect(container.querySelector('select#suspended option:checked')).toHaveTextContent('Suspended');

    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});
