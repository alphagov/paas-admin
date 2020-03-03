import { shallow } from 'enzyme';
import React from 'react';

import { IParameters } from '../../lib/router';
import { CreateOrganizationPage, CreateOrganizationSuccessPage } from './views';

function linker(route: string, params?: IParameters): string {
  return `__LINKS_TO__${route}_WITH_${(new URLSearchParams(params)).toString()}`;
}

describe(CreateOrganizationPage, () => {
  it('should have csrf token', () => {
    const markup = shallow(<CreateOrganizationPage csrf="CSRF_TOKEN" linkTo={linker} />);

    expect(markup.render().find('[name=_csrf]')).toHaveLength(1);
    expect(markup.render().find('[name=_csrf]').prop('value')).toEqual('CSRF_TOKEN');
  });

  it('should correctly handle XSS attack', () => {
    const markup = shallow(<CreateOrganizationPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      values={{ organization: '<script>alert("pwnd by test");</script>' }}
    />);

    expect(markup.find('input#organization')).toHaveLength(1);
    expect(markup.find('input#organization').html()).not.toContain('<script>');
    expect(markup.find('input#organization').html()).toContain('&lt;script&gt;');
    expect(markup.find('input#organization').html()).toContain('&quot;pwnd by test&quot;');
  });

  it('should correctly printout errors', () => {
    const markup = shallow(<CreateOrganizationPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      errors={[ { field: 'organization', message: 'required field' } ]}
    />);

    expect(markup.find('.govuk-error-summary')).toHaveLength(1);
    expect(markup.find('.govuk-error-summary').text()).toContain('required field');
  });
});

describe(CreateOrganizationSuccessPage, () => {
  it('should correctly compose a success page', () => {
    const markup = shallow(<CreateOrganizationSuccessPage linkTo={linker} organizationGUID="ORG_GUID" />);

    expect(markup.html())
      .toContain('href="__LINKS_TO__admin.organizations.users.invite_WITH_organizationGUID=ORG_GUID"');
  });
});
