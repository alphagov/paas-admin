import { shallow } from 'enzyme';
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
    const markup = shallow(<CreateOrganizationPage csrf="CSRF_TOKEN" linkTo={linker} owners={[]} />);

    expect(markup.render().find('[name=_csrf]')).toHaveLength(1);
    expect(markup.render().find('[name=_csrf]').prop('value')).toEqual('CSRF_TOKEN');
  });

  it('should correctly handle XSS attack', () => {
    const markup = shallow(<CreateOrganizationPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      values={{ organization: '<script>alert("pwnd by test");</script>' }}
      owners={[{ name: '<em>hacking</em>', owner: '<strong>Hackers</strong>' }]}
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
      owners={[]}
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

describe(ContactOrganisationManagersPage, () => {
  it('should correctly render the form', () => {
    const orgs = [{ name: 'a-different-org', guid: '123', suspended: false }];
    const markup = shallow(<ContactOrganisationManagersPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      orgs={orgs}
    />);

    expect(markup.find('#organisation').text()).toContain('a-different-org');
    expect(markup.find('#managerRole').text()).toContain('Billing manager');
    expect(markup.find('#managerRole').text()).toContain('Organisation manager');
  });

  it('should correctly render the form errors', () => {
    const orgs = [{ name: 'a-different-org', guid: '123', suspended: false }];
    const markup = shallow(<ContactOrganisationManagersPage
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

    expect(markup.find('.govuk-error-summary')).toHaveLength(1);
    expect(markup.find('.govuk-error-summary li')).toHaveLength(3);
    expect(markup.find('.govuk-error-message')).toHaveLength(3);
    expect(markup.find('#organisation-error').text()).toContain('Select an organisation');
    expect(markup.find('#managerRole-error').text()).toContain('Select a manager role');
    expect(markup.find('#message-error').text()).toContain('Enter your message');
  });

  it('should use provided form values on resubmission', () => {
    const orgs = [{ name: 'a-different-org', guid: '123', suspended: true }];
    const markup = shallow(<ContactOrganisationManagersPage
      csrf="CSRF_TOKEN"
      linkTo={linker}
      orgs={orgs}
      values={{
        organisation: '123',
        managerRole: 'billing_manager',
        message: 'Text message',
      }}
    />);

    expect(markup.render().find('#organisation option[selected]').text()).toEqual('a-different-org (suspended)');
    expect(markup.render().find('#managerRole option[selected]').text()).toEqual('Billing manager');
    expect(markup.render().find('#message').val()).toContain('Text message');
  });
});

describe(ContactOrganisationManagersConfirmationPage, () => {
  const markup = shallow(
    <ContactOrganisationManagersConfirmationPage
        linkTo={route => `__LINKS_TO__${route}`}
        heading={'confirmation panel heading'}
        text={'confirmation panel text'}
      >
        children text
      </ContactOrganisationManagersConfirmationPage>,
  );

  it('should render the page with all provided properties', () => {
    expect(markup.find('.govuk-panel__title').text()).toContain('confirmation panel heading');
    expect(markup.find('.govuk-panel__body').text()).toContain('confirmation panel text');
    expect(markup.find('.govuk-body').text()).toContain('children text');
  });
});
