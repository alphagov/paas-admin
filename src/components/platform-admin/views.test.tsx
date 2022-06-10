/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { IParameters } from '../../lib/router';

import {
  ContactOrganisationManagersConfirmationPage,
  ContactOrganisationManagersPage,
  CreateOrganizationPage,
  CreateOrganizationSuccessPage,
} from './views';

function linker(route: string, params?: IParameters): string {
  return `__LINKS_TO__${route}_WITH_${(new URLSearchParams(params)).toString()}`;
}

describe(CreateOrganizationPage, () => {
  it('should have csrf token', () => {
    const {container } = render (<CreateOrganizationPage csrf="CSRF_TOKEN" linkTo={linker} owners={[]} />);

    expect(container.querySelector('[name=_csrf]')).toBeTruthy();
    expect(container.querySelector('[name=_csrf]')).toHaveValue('CSRF_TOKEN');
  });

  it('should correctly printout errors', () => {
    const {container } = render (<CreateOrganizationPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      errors={[ { field: 'organization', message: 'required field' } ]}
      owners={[]}
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelector('.govuk-error-summary')).toHaveTextContent('required field');
  });
});

describe(CreateOrganizationSuccessPage, () => {
  it('should correctly compose a success page', () => {
    const { container } = render (<CreateOrganizationSuccessPage linkTo={linker} organizationGUID="ORG_GUID" />);

    expect(container.innerHTML)
      .toContain('href="__LINKS_TO__admin.organizations.users.invite_WITH_organizationGUID=ORG_GUID"');
  });
});

describe(ContactOrganisationManagersPage, () => {
  it('should correctly render the form', () => {
    const orgs = [{ name: 'a-different-org', guid: '123', suspended: false }];
    const {container } = render (<ContactOrganisationManagersPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      orgs={orgs}
    />);

    expect(container.querySelector('#organisation')).toHaveTextContent('a-different-org');
    expect(container.querySelector('#managerRole')).toHaveTextContent('Billing manager');
    expect(container.querySelector('#managerRole')).toHaveTextContent('Organisation manager');
  });

  it('should correctly render the form errors', () => {
    const orgs = [{ name: 'a-different-org', guid: '123', suspended: false }];
    const {container } = render (<ContactOrganisationManagersPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      orgs={orgs}
      errors={
        [
          { field: 'organisation', message: 'Select an organisation' },
          { field: 'managerRole', message: 'Select a manager role' },
          { field: 'message', message: 'Enter your message' },
        ]
      }
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(3);
    expect(container.querySelectorAll('.govuk-error-message')).toHaveLength(3);
    expect(container.querySelector('#organisation-error')).toHaveTextContent('Select an organisation');
    expect(container.querySelector('#managerRole-error')).toHaveTextContent('Select a manager role');
    expect(container.querySelector('#message-error')).toHaveTextContent('Enter your message');
  });

  it('should use provided form values on resubmission', () => {
    const orgs = [{ name: 'a-different-org', guid: '123', suspended: true }];
    const {container } = render (<ContactOrganisationManagersPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      orgs={orgs}
      values={{
        organisation: '123',
        managerRole: 'billing_manager',
        message: 'Text message',
      }}
    />);

    expect(container.querySelector('#organisation option:checked')).toHaveTextContent('a-different-org (suspended)');
    expect(container.querySelector('#managerRole option:checked')).toHaveTextContent('Billing manager');
    expect(container.querySelector('#message')).toHaveValue('Text message');
  });
});

describe(ContactOrganisationManagersConfirmationPage, () => {
  it('should render the page with all provided properties', () => {
    const {container } = render (
      <ContactOrganisationManagersConfirmationPage
          linkTo={route => `__LINKS_TO__${route}`}
          heading={'confirmation panel heading'}
          text={'confirmation panel text'}
        >
          children text
        </ContactOrganisationManagersConfirmationPage>,
    );

    expect(container.querySelector('.govuk-panel__title')).toHaveTextContent('confirmation panel heading');
    expect(container.querySelector('.govuk-panel__body')).toHaveTextContent('confirmation panel text');
    expect(container.querySelector('.govuk-body')).toHaveTextContent('children text');
  });
});
