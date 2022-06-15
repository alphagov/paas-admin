/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import {
  IOrganization,
  IOrganizationUserRoles,
  ISpace,
} from '../../lib/cf/types';

import {
  DeleteConfirmationPage,
  IUserRoles,
  OrganizationUsersPage,
  Permission,
  PermissionBlock,
  SuccessPage,
} from './views';

import { format } from 'date-fns';
import { DATE_TIME } from '../../layouts';

describe(Permission, () => {
  it('should produce a checkbox with appropriate values provided', () => {
    const { container } = render(
      <Permission
        checked={false}
        disabled={true}
        name="Permission"
        namespace="permission"
        state={{ current: true, desired: false }}
      />,
    );
    expect(container
      .querySelectorAll('input[type="hidden"][name="permission[current]"]'))
      .toHaveLength(1);
    expect(container
      .querySelector('input[type="hidden"][name="permission[current]"]'))
      .toHaveAttribute('value', expect.stringContaining('1'));
    expect(container
      .querySelectorAll('input[type="hidden"][name="permission[desired]"]'))
      .toHaveLength(1);
    expect(container
      .querySelector('input[type="hidden"][name="permission[desired]"]'))
      .toHaveAttribute('value', expect.stringContaining('0'));
    expect(container
      .querySelectorAll('input[type="checkbox"][name="permission[desired]"]:checked'))
      .toHaveLength(0);
    expect(container
      .querySelectorAll('input[type="checkbox"][name="permission[desired]"]:disabled'))
      .toHaveLength(1);
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});

describe(PermissionBlock, () => {
  const organization = ({
    entity: { name: 'org-name' },
    metadata: { guid: 'ORG_GUID' },
  } as unknown) as IOrganization;
  const spaces = ([
    { entity: { name: 'space-name-1' }, metadata: { guid: 'SPACE_GUID_1' } },
    { entity: { name: 'space-name-2' }, metadata: { guid: 'SPACE_GUID_2' } },
    { entity: { name: 'space-name-3' }, metadata: { guid: 'SPACE_GUID_3' } },
  ] as unknown) as ReadonlyArray<ISpace>;

  it('should display correctly permissions block element', () => {
    const { container } = render(
      <PermissionBlock
        billingManagers={2}
        managers={2}
        organization={organization}
        spaces={spaces}
        values={{
          org_roles: {
            ORG_GUID: {
              auditors: { current: false, desired: false },
              billing_managers: { current: true, desired: true },
              managers: { current: true, desired: true },
            },
          },
          space_roles: {
            SPACE_GUID_1: {
              auditors: { current: false, desired: false },
              developers: { current: false, desired: false },
              managers: { current: true, desired: true },
            },
            SPACE_GUID_2: {
              auditors: { current: false, desired: false },
              developers: { current: true, desired: true },
              managers: { current: false, desired: false },
            },
            SPACE_GUID_3: {
              auditors: { current: true, desired: true },
              developers: { current: false, desired: false },
              managers: { current: false, desired: false },
            },
          },
        }}
      />,
    );
    expect(container.querySelectorAll('.user-permission-block')).toHaveLength(4);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:checked'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:disabled'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:checked'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:disabled'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][auditors]"]:checked'))
      .toHaveLength(0);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_1][managers][desired]"]:checked'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_1][developers][desired]"]:checked'))
      .toHaveLength(0)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_1][auditors][desired]"]:checked'))
      .toHaveLength(0)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_2][managers][desired]"]:checked'))
      .toHaveLength(0)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_2][developers][desired]"]:checked'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_2][auditors][desired]"]:checked'))
      .toHaveLength(0)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_3][managers][desired]"]:checked'))
      .toHaveLength(0)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_3][developers][desired]"]:checked'))
      .toHaveLength(0)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="space_roles[SPACE_GUID_3][auditors][desired]"]:checked'))
      .toHaveLength(1);
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should display correctly with disabled checked manager boxes when not enough managers', () => {
    const { container } = render(
      <PermissionBlock
        billingManagers={1}
        managers={1}
        organization={organization}
        spaces={[]}
        values={{
          org_roles: {
            ORG_GUID: {
              auditors: { current: true, desired: true },
              billing_managers: { current: true, desired: true },
              managers: { current: true, desired: true },
            },
          },
          space_roles: {},
        }}
      />,
    );
    expect(container.querySelectorAll('.user-permission-block')).toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:checked'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:disabled'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="hidden"][name^="org_roles[ORG_GUID][managers][desired]"]'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:checked'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:disabled'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="hidden"][name^="org_roles[ORG_GUID][billing_managers][desired]"]'))
      .toHaveLength(1);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][auditors]"]:checked'))
      .toHaveLength(1);
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should display correctly with enabled unchecked manager boxes when not enough managers', () => {
    const { container } = render(
      <PermissionBlock
        billingManagers={1}
        managers={1}
        organization={organization}
        spaces={[]}
        values={{
          org_roles: {
            ORG_GUID: {
              auditors: { current: true, desired: true },
              billing_managers: { current: false, desired: false },
              managers: { current: false, desired: false },
            },
          },
          space_roles: {},
        }}
      />,
    );
    expect(container.querySelectorAll('.user-permission-block')).toHaveLength(1);

    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:checked'))
      .toHaveLength(0);
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:disabled'))
      .toHaveLength(1)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:checked'))
      .toHaveLength(0)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:disabled'))
      .toHaveLength(1)
    expect(container
      .querySelectorAll('input[type="checkbox"][name^="org_roles[ORG_GUID][auditors]"]:checked'))
      .toHaveLength(1);
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});

describe(DeleteConfirmationPage, () => {
  const user = ({
    entity: { username: 'user-name' },
    metadata: { guid: 'USER_GUID' },
  } as unknown) as IOrganizationUserRoles;

  it('should ask user to confirm another user deleton', () => {
    const { container } = render(
      <DeleteConfirmationPage
        csrf="CSRF_TOKEN"
        linkTo={route => `__LINKS_TO__${route}`}
        organizationName="ORG_NAME"
        organizationGUID="ORG_GUID"
        user={user}
      />,
    );
    expect(container.querySelector('h2')).toHaveTextContent(
      'Are you sure you\'d like to remove the following user?',
    );
    expect(container.querySelector('.govuk-summary-list')).toHaveTextContent('user-name');
    expect(container.querySelector('.govuk-summary-list')).toHaveTextContent('ORG_NAME');
  });
});

describe(OrganizationUsersPage, () => {
  const space = ({
    entity: { name: 'space-name' },
    metadata: { guid: 'SPACE_GUID' },
  } as unknown) as ISpace;
  const users = {
    USER_GUID: ({
      orgRoles: [],
      spaces: [space],
      username: 'user-name',
    } as unknown) as IUserRoles,
    USER_GUID_2: ({
      orgRoles: ['org_manager', 'billing_manager'],
      spaces: [],
      username: 'user-name-2',
    } as unknown) as IUserRoles,
  };

  const lastLogonTime = + new Date()
  const lastLogonTimeFormatted = format(lastLogonTime, DATE_TIME)

  it('should produce the org users view', () => {
    const { container } = render(
      <OrganizationUsersPage
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        privileged={false}
        users={users}
        userExtraInfo={{
          "USER_GUID": { origin: 'origin-name', lastLogonTime: undefined },
          "USER_GUID_2": { origin: 'uaa', lastLogonTime: lastLogonTime },
        }}
      />,
    );
    expect(container.querySelector('tbody th:first-of-type')).toHaveTextContent('user-name');
    expect(container.querySelectorAll('tbody th:first-of-type a')).toHaveLength(0);
    expect(container.querySelectorAll('tbody tr td')[1]).not.toHaveTextContent('Origin-name');
    expect(container.querySelector('td')).not.toHaveTextContent('Password');
    expect(container.querySelector('li')).toHaveTextContent(space.entity.name);
    expect(container.querySelectorAll('.tick-symbol')).toHaveLength(2);
    expect(container.querySelector('.govuk-table__body td:nth-child(4)')).toHaveTextContent('no');
    expect(container).not.toHaveTextContent('Last login');
  });

  it('should produce the org users view when being privileged', () => {
    const { container } = render(
      <OrganizationUsersPage
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        privileged={true}
        users={users}
        userExtraInfo={{
          "USER_GUID": { origin: 'origin-name', lastLogonTime: undefined },
          "USER_GUID_2": { origin: 'uaa', lastLogonTime: lastLogonTime },
        }}
      />,
    );

    

    expect(container.querySelector('tbody th:first-of-type')).toHaveTextContent('user-name');
    expect(container.querySelectorAll('tbody th:first-of-type a')).toHaveLength(2);
    expect(container.querySelector('tbody tr:nth-child(1) td:nth-child(2)')).toHaveTextContent('Origin-name');
    expect(container.querySelector('tbody tr:nth-child(2) td:nth-child(2)')).toHaveTextContent('Password');
    expect(container.querySelector('thead th:nth-child(7)')).toHaveTextContent('Last login');
    expect(container.querySelector('tbody tr:nth-child(1) td:nth-child(7)')).toHaveTextContent('No login');
    expect(container.querySelector('tbody tr:nth-child(2) td:nth-child(7)')).toHaveTextContent(lastLogonTimeFormatted);
    
  });

  it('should not show a table of users if there are no users', () => {
    const NoUsers = {};
    const { container } = render(
      <OrganizationUsersPage
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        privileged={false}
        users={NoUsers}
        userExtraInfo={{}}
      />,
    );
    expect(container.querySelectorAll('table')).toHaveLength(0);
    expect(container).toHaveTextContent('There are currently no team members');
  });
});

describe(SuccessPage, () => {
  it('should render provided text', () => {
    const { container } = render(
      <SuccessPage
          linkTo={route => `__LINKS_TO__${route}`}
          organizationGUID="ORG_GUID"
          heading={'confirmation panel heading'}
          text={'confirmation panel text'}
        >
          children text
        </SuccessPage>,
    );
    expect(container.querySelector('.govuk-panel__title')).toHaveTextContent('confirmation panel heading');
    expect(container.querySelector('.govuk-panel__body')).toHaveTextContent('confirmation panel text');
    expect(container.querySelector('.govuk-body')).toHaveTextContent('children text');
  });
});

