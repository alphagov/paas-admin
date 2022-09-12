/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { IOrganization, IOrganizationQuota, IV3OrganizationQuota, IV3OrganizationResource } from '../../lib/cf/types';

import { EditOrganization, EmailManagers, EmailManagersConfirmationPage, OrganizationsPage } from './views';

import { org as defaultOrg } from '../../lib/cf/test-data/org';

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

describe(EmailManagers, () => {
  const spaces = [
    {
      metadata: { guid: 'eef38913-071c-40ae-bbd8-2be7402aa9a8' },
      entity: { name:'test-space' },
    },
  ] as any;
  it('should correctly render the form', () => {
    const {container } = render (<EmailManagers
      csrf="CSRF_TOKEN"
      linkTo={linker}
      organisation={defaultOrg()}
      spaces={spaces}
    />);

    expect(container).toHaveTextContent(defaultOrg.name);
    expect(container).toHaveTextContent('Email organisation managers');
    expect(container).toHaveTextContent('Email billing managers');
    expect(container).toHaveTextContent('Email space managers');
    expect(container.querySelector('#space')).toHaveTextContent('test-space');
  });

  it('should correctly render the form errors', () => {
    const {container } = render (<EmailManagers
      csrf="CSRF_TOKEN"
      linkTo={linker}
      organisation={defaultOrg()}
      spaces={spaces}
      errors={
        [
          { field: 'managerType', message: 'Select a manager role' },
          { field: 'message', message: 'Enter your message' },
          { field: 'space', message: 'Select a space' },
        ]
      }
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(3);
    expect(container.querySelectorAll('.govuk-error-message')).toHaveLength(3);
    expect(container.querySelector('#managerType-error')).toHaveTextContent('Select a manager role');
    expect(container.querySelector('#message-error')).toHaveTextContent('Enter your message');
    expect(container.querySelector('#space-error')).toHaveTextContent('Select a space');
  });

  it('should use provided form values on resubmission', () => {
    const {container } = render (<EmailManagers
      csrf="CSRF_TOKEN"
      linkTo={linker}
      organisation={defaultOrg()}
      spaces={spaces}
      values={{
        managerType: 'space_manager',
        message: 'Text message',
        space: 'eef38913-071c-40ae-bbd8-2be7402aa9a8',
      }}
    />);

    expect(container.querySelector('#space option:checked')).toHaveTextContent('test-space');
    expect(container.querySelector('#managerType-2')).toBeChecked();
    expect(container.querySelector('#message')).toHaveValue('Text message');
  });
});

describe(EmailManagersConfirmationPage, () => {
  it('should render the page with all provided properties', () => {
    const {container } = render (
      <EmailManagersConfirmationPage
          linkTo={route => `__LINKS_TO__${route}`}
          heading={'confirmation panel heading'}
          text={'confirmation panel text'}
        >
          children text
        </EmailManagersConfirmationPage>,
    );

    expect(container.querySelector('.govuk-panel__title')).toHaveTextContent('confirmation panel heading');
    expect(container.querySelector('.govuk-panel__body')).toHaveTextContent('confirmation panel text');
    expect(container.querySelector('.govuk-body')).toHaveTextContent('children text');
  });
});

