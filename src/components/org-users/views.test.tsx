import cheerio from 'cheerio';
import { shallow } from 'enzyme';
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

describe(Permission, () => {
  it('should produce a checkbox with appropriate values provided', () => {
    const markup = shallow(
      <Permission
        checked={false}
        disabled={true}
        name="Permission"
        namespace="permission"
        state={{ current: true, desired: false }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect(
      $('input[type="hidden"][name="permission[current]"]').length,
    ).toEqual(1);
    expect(
      $('input[type="hidden"][name="permission[current]"]').prop('value'),
    ).toEqual('1');
    expect(
      $('input[type="hidden"][name="permission[desired]"]').length,
    ).toEqual(1);
    expect(
      $('input[type="hidden"][name="permission[desired]"]').prop('value'),
    ).toEqual('0');
    expect(
      $('input[type="checkbox"][name="permission[desired]"]:checked').length,
    ).toEqual(0);
    expect(
      $('input[type="checkbox"][name="permission[desired]"]:disabled').length,
    ).toEqual(1);
    expect(spacesMissingAroundInlineElements($.html())).toHaveLength(0);
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
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('.user-permission-block')).toHaveLength(4);

    expect(
      $('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:checked')
        .length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:disabled',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:checked',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:disabled',
      ).length,
    ).toEqual(0);
    expect(
      $('input[type="checkbox"][name^="org_roles[ORG_GUID][auditors]"]:checked')
        .length,
    ).toEqual(0);

    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_1][managers][desired]"]:checked',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_1][developers][desired]"]:checked',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_1][auditors][desired]"]:checked',
      ).length,
    ).toEqual(0);

    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_2][managers][desired]"]:checked',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_2][developers][desired]"]:checked',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_2][auditors][desired]"]:checked',
      ).length,
    ).toEqual(0);

    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_3][managers][desired]"]:checked',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_3][developers][desired]"]:checked',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="space_roles[SPACE_GUID_3][auditors][desired]"]:checked',
      ).length,
    ).toEqual(1);
    expect(spacesMissingAroundInlineElements($.html())).toHaveLength(0);
  });

  it('should display correctly with disabled checked manager boxes when not enough managers', () => {
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('.user-permission-block')).toHaveLength(1);

    expect(
      $('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:checked')
        .length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:disabled',
      ).length,
    ).toEqual(1);
    expect(
      $('input[type="hidden"][name^="org_roles[ORG_GUID][managers][desired]"]')
        .length,
    ).toEqual(1);

    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:checked',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:disabled',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="hidden"][name^="org_roles[ORG_GUID][billing_managers][desired]"]',
      ).length,
    ).toEqual(1);

    expect(
      $('input[type="checkbox"][name^="org_roles[ORG_GUID][auditors]"]:checked')
        .length,
    ).toEqual(1);
    expect(spacesMissingAroundInlineElements($.html())).toHaveLength(0);
  });

  it('should display correctly with enabled unchecked manager boxes when not enough managers', () => {
    const markup = shallow(
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
    const $ = cheerio.load(markup.html());
    expect($('.user-permission-block')).toHaveLength(1);

    expect(
      $('input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:checked')
        .length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][managers]"]:disabled',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:checked',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[ORG_GUID][billing_managers]"]:disabled',
      ).length,
    ).toEqual(0);
    expect(
      $('input[type="checkbox"][name^="org_roles[ORG_GUID][auditors]"]:checked')
        .length,
    ).toEqual(1);
    expect(spacesMissingAroundInlineElements($.html())).toHaveLength(0);
  });
});

describe(DeleteConfirmationPage, () => {
  const user = ({
    entity: { username: 'user-name' },
    metadata: { guid: 'USER_GUID' },
  } as unknown) as IOrganizationUserRoles;

  it('should ask user to confirm another user deleton', () => {
    const markup = shallow(
      <DeleteConfirmationPage
        csrf="CSRF_TOKEN"
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        user={user}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('h2').text()).toContain(
      'Are you sure you\'d like to remove the following user?',
    );
    expect($('p').text()).toContain('user-name');
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

  it('should produce the org users view', () => {
    const markup = shallow(
      <OrganizationUsersPage
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        privileged={false}
        users={users}
        userOriginMapping={{ USER_GUID: 'origin-name', USER_GUID_2: 'uaa' }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('td:first-of-type').text()).toContain('user-name');
    expect($('td:first-of-type a').length).toEqual(0);
    expect($('td').text()).not.toContain('Origin-name');
    expect($('td').text()).not.toContain('Password');
    expect($('li').text()).toContain(space.entity.name);
    expect($('.tick-symbol').length).toEqual(2);
    expect($('.govuk-table__body td:nth-child(4)').text()).toContain('no');
  });

  it('should produce the org users view when being privileged', () => {
    const markup = shallow(
      <OrganizationUsersPage
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        privileged={true}
        users={users}
        userOriginMapping={{ USER_GUID: 'origin-name', USER_GUID_2: 'uaa' }}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('td:first-of-type').text()).toContain('user-name');
    expect($('td:first-of-type a').length).toEqual(2);
    expect($('td').text()).toContain('Origin-name');
    expect($('td').text()).toContain('Password');
  });
});

describe(SuccessPage, () => {
  const markup = shallow(
    <SuccessPage
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        heading={'confirmation panel heading'}
        text={'confirmation panel text'}
      >
        children text
      </SuccessPage>,
  );

  it('should have a confirmation panel title', () => {
    const $ = cheerio.load(markup.html());
    expect($('.govuk-panel__title').text()).toContain('confirmation panel heading');
  });

  it('should have a confirmation panel text', () => {
    const $ = cheerio.load(markup.html());
    expect($('.govuk-panel__body').text()).toContain('confirmation panel text');
  });

  it('should have props children text if provided', () => {
    const $ = cheerio.load(markup.html());
    expect($('.govuk-body').text()).toContain('children text');
  });
});
