/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { IParameters } from '../../lib/router';

import {
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