/**
 * @jest-environment jsdom
 */
 import { render } from '@testing-library/react';
import React from 'react';

import {
  ContactUsPage,
  FindOutMorePage,
  HelpUsingPaasPage,
  SignUpPage,
  SomethingWrongWithServicePage,
  SupportConfirmationPage,
  SupportSelectionPage,
} from './views';

describe(SupportSelectionPage, () => {
  it('should correctly render the form', () => {
    const { container } = render(<SupportSelectionPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
    />);
    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelector('.govuk-radios')).toBeTruthy();
    expect(container.querySelector('.govuk-error-summary')).toBeFalsy();
    expect(container.querySelector('.govuk-error-message')).toBeFalsy();
  });

  it('should display error messages if form has missing data', () => {
    const { container } = render(<SupportSelectionPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
      errors={[
        { field: 'support_type',
        message: 'Select which type of support your require' },
      ]}
    />);
    expect(container.querySelectorAll('.govuk-radios input:checked')).toHaveLength(0);
    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelector('.govuk-error-summary li')).toBeTruthy();
    expect(container.querySelector('.govuk-error-message')).toBeTruthy();
    expect(container.querySelector('.govuk-error-message')).toHaveTextContent('Select which type of support your require');
  });
});

describe(SomethingWrongWithServicePage, () => {
  it('should correctly render the form', () => {
    const { container } = render(<SomethingWrongWithServicePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
    />);

    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelectorAll('.govuk-input')).toHaveLength(3);
    expect(container.querySelector('.govuk-textarea')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-radios')).toBeTruthy();
    expect(container.querySelector('.govuk-error-summary')).toBeFalsy();
    expect(container.querySelector('.govuk-error-message')).toBeFalsy();
  });

  it('should display error messages if form has missing data', () => {
    const { container } = render(<SomethingWrongWithServicePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
      errors={[
        {
          field: 'name',
          message: 'Enter your full name',
        },
        {
          field: 'email',
          message: 'Enter an email address in the correct format, like name@example.com',
        },
        {
          field: 'affected_paas_organisation',
          message: 'Enter the name of the affected organisation',
        },
        { field: 'impact_severity',
          message: 'Select the severity of the impact',
        },
        {
          field: 'message',
          message: 'Enter your message',
        },
      ]}
    />);
    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(5);
    expect(container.querySelector('.govuk-radios input:checked')).toBeFalsy();
    expect(container.querySelectorAll('.govuk-error-message')).toHaveLength(5);
    expect(container.querySelector('#name-error')).toHaveTextContent('Enter your full name');
    expect(container.querySelector('#email-error')).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
    expect(container.querySelector('#affected_paas_organisation-error')).toHaveTextContent('Enter the name of the affected organisation');
    expect(container.querySelector('#impact_severity-error')).toHaveTextContent('Select the severity of the impact');
    expect(container.querySelector('#message-error')).toHaveTextContent('Enter your message');
  });
});

describe(HelpUsingPaasPage, () => {
  it('should correctly render the form', () => {
    const { container } = render(<HelpUsingPaasPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
    />);
    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelector('.govuk-error-summary')).toBeFalsy();
    expect(container.querySelector('.govuk-error-message')).toBeFalsy();
    expect(container.querySelectorAll('.govuk-input')).toHaveLength(3);
    expect(container.querySelector('.govuk-textarea')).toBeTruthy();
  });

  it('should display error messages if form has missing data', () => {
    const { container } = render(<HelpUsingPaasPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{
        'paas_organisation_name': 'test paas org',
      } as any}
      errors={[{
        field: 'name',
        message: 'Enter your full name',
      },
      {
        field: 'email',
        message: 'Enter an email address in the correct format, like name@example.com',
      },
      {
        field: 'message',
        message: 'Enter your message',
      },
    ]}
    />);
    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(3);
    expect(container.querySelectorAll('.govuk-error-message')).toHaveLength(3);
    expect(container.querySelector('#paas_organisation_name')).toHaveValue('test paas org');
    expect(container.querySelector('#name-error')).toHaveTextContent('Enter your full name');
    expect(container.querySelector('#email-error')).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
    expect(container.querySelector('#message-error')).toHaveTextContent('Enter your message');
  });
});

describe(FindOutMorePage, () => {
  it('should correctly render the form', () => {
    const { container } = render(<FindOutMorePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
    />);

    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelectorAll('.govuk-input')).toHaveLength(3);
    expect(container.querySelector('.govuk-textarea')).toBeTruthy();
    expect(container.querySelector('.govuk-error-summary')).toBeFalsy();
    expect(container.querySelector('.govuk-error-message')).toBeFalsy();
  });

  it('should display error messages if form has missing data', () => {
    const { container } = render(<FindOutMorePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
      errors={[
        {
          field: 'name',
          message: 'Enter your full name',
        },
        {
          field: 'email',
          message: 'Enter an email address in the correct format, like name@example.com',
        },
        {
          field: 'gov_organisation_name',
          message: 'Enter your government organisation’s name',
        },
        {
          field: 'message',
          message: 'Enter your message',
        },
      ]}
    />);
    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(4);
    expect(container.querySelectorAll('.govuk-error-message')).toHaveLength(4);
    expect(container.querySelector('#name-error')).toHaveTextContent('Enter your full name');
    expect(container.querySelector('#email-error')).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
    expect(container.querySelector('#gov_organisation_name-error')).toHaveTextContent('Enter your government organisation’s name');
    expect(container.querySelector('#message-error')).toHaveTextContent('Enter your message');
  });
});

describe(ContactUsPage, () => {
  it('should correctly render the form', () => {
    const { container } = render(<ContactUsPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
    />);

    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelector('.govuk-error-summary')).toBeFalsy();
    expect(container.querySelector('.govuk-error-message')).toBeFalsy();
    expect(container.querySelectorAll('.govuk-input')).toHaveLength(4);
    expect(container.querySelector('.govuk-textarea')).toBeTruthy();
  });

  it('should display error messages if form has missing data', () => {
    const { container } = render(<ContactUsPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
      errors={[{
        field: 'name',
        message: 'Enter your full name',
      },
      {
        field: 'email',
        message: 'Enter an email address in the correct format, like name@example.com',
      },
      {
        field: 'message',
        message: 'Enter your message',
      },
      {
        field: 'department_agency',
        message: 'Enter your department or agency',
      },
      {
        field: 'service_team',
        message: 'Enter your service or team',
      },
    ]}
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(5);
    expect(container.querySelectorAll('.govuk-error-message')).toHaveLength(5);
    expect(container.querySelector('#name-error')).toHaveTextContent('Enter your full name');
    expect(container.querySelector('#email-error')).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
    expect(container.querySelector('#department_agency-error')).toHaveTextContent('Enter your department or agency');
    expect(container.querySelector('#service_team-error')).toHaveTextContent('Enter your service or team');
    expect(container.querySelector('#message-error')).toHaveTextContent('Enter your message');
  });
});

describe(SignUpPage, () => {
  it('should correctly render the form', () => {
    const { container } = render(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
    />);


    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelectorAll('.govuk-input')).toHaveLength(7);
    expect(container.querySelectorAll('.govuk-radios')).toHaveLength(2);
    expect(container.querySelector('.govuk-error-summary')).toBeFalsy();
    expect(container.querySelectorAll('.govuk-radios__conditional .govuk-input')).toHaveLength(3);
  });

  it('should display error messages if form has missing data', () => {
    const { container } = render(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{} as any}
      errors={[{
        field: 'name',
        message: 'Enter your full name',
      },
      {
        field: 'email',
        message: 'Enter an email address in the correct format, like name@example.com',
      },
      {
        field: 'department_agency',
        message: 'Enter your department or agency',
      },
      {
        field: 'service_team',
        message: 'Enter your service or team',
      },
      {
        field: 'person_is_manager',
        message: 'Select the appropriate option for an org manager',
      },
      {
        field: 'invite_users',
        message: 'Select "Yes" if you would like to invite users to your organisation',
      },
    ]}
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(6);
    expect(container.querySelector('.govuk-radios input:checked')).toBeFalsy();
    expect(container.querySelectorAll('.govuk-error-message')).toHaveLength(6);
    expect(container.querySelector('#name-error')).toHaveTextContent('Enter your full name');
    expect(container.querySelector('#email-error')).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
    expect(container.querySelector('#department_agency-error')).toHaveTextContent('Enter your department or agency');
    expect(container.querySelector('#service_team-error')).toHaveTextContent('Enter your service or team');
    expect(container.querySelector('#person_is_manager-error')).toHaveTextContent('Select the appropriate option for an org manager');
    expect(container.querySelector('#invite_users-error')).toHaveTextContent('Select "Yes" if you would like to invite users to your organisation');
  });

  it('should display error messages for non-allowed email address', () => {
    const { container } = render(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{
        email: 'test@test.co.uk',
        invite_users: 'yes',
        person_is_manager: 'yes',
        additional_users: undefined,
      } as any}
      errors={[{
        field: 'email',
        message: 'We only accept .gov.uk, .mod.uk, nhs.net, .police.uk or police.uk email addresses',
        messageExtra: 'If you work for a government organisation or public body with a different email address, please contact us on <a class="govuk-link" href="mailto:gov-uk-paas-support@digital.cabinet-office.gov.uk">gov-uk-paas-support@digital.cabinet-office.gov.uk</a>',
      },
    ]}
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelector('.govuk-error-summary li')).toBeTruthy();
    expect(container.querySelector('.govuk-error-summary li:first-child')).toHaveTextContent('We only accept .gov.uk, .mod.uk, nhs.net, .police.uk or police.uk email addresses');
    expect(container.querySelector('#email-error span:last-child')?.innerHTML).toBe('If you work for a government organisation or public body with a different email address, please contact us on <a class="govuk-link" href="mailto:gov-uk-paas-support@digital.cabinet-office.gov.uk">gov-uk-paas-support@digital.cabinet-office.gov.uk</a>');
    expect(container.querySelector('input#person_is_manager:checked')).toBeTruthy();
    expect(container.querySelector('input#invite_users:checked')).toBeTruthy();
  });

  it('should not display errror if additional users details are not entered', () => {
    const { container } = render(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{
        additional_users: undefined,
      } as any}
      errors={[]}
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeFalsy();
    expect(container.querySelector('input[type="text"][name^="additional_users[0][email]"]')).toHaveValue('');
    expect(container.querySelector('input[type="text"][name^="additional_users[1][email]"]')).toHaveValue('');
    expect(container.querySelector('input[type="text"][name^="additional_users[2][email]"]')).toHaveValue('');
    expect(container.querySelector('input[type="checkbox"][name^="additional_users[0][person_is_manager]"]')).not.toHaveAttribute('checked');
    expect(container.querySelector('input[type="checkbox"][name^="additional_users[1][person_is_manager]"]')).not.toHaveAttribute('checked');
    expect(container.querySelector('input[type="checkbox"][name^="additional_users[2][person_is_manager]"]')).not.toHaveAttribute('checked');
  });

  it('should display error messages if additional users email addresses are invalid', () => {
    const { container } = render(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf="CSRF_TOKEN"
      values={{
        additional_users: [
          {
            email: 'user1',
            person_is_manager: 'yes',
          },
          {
            email: 'user2',
            person_is_manager: 'yes',
          },
          {
            email: 'user3',
            person_is_manager: 'yes',
          },
        ],
      } as any}
      errors={[
        {
          field: 'additional_users-0',
          message: 'Enter additional user 1 email address in the correct format, like name@example.com',
        },
        {
          field: 'additional_users-1',
          message: 'Enter additional user 2 email address in the correct format, like name@example.com',
        },
        {
          field: 'additional_users-2',
          message: 'Enter additional user 3 email address in the correct format, like name@example.com',
        },
      ]}
    />);

    expect(container.querySelector('.govuk-error-summary')).toBeTruthy();
    expect(container.querySelectorAll('.govuk-error-summary li')).toHaveLength(3);
    expect(container.querySelector('#additional_users-0-error')).toHaveTextContent('Enter additional user 1 email address in the correct format, like name@example.com');
    expect(container.querySelector('#additional_users-1-error')).toHaveTextContent('Enter additional user 2 email address in the correct format, like name@example.com');
    expect(container.querySelector('#additional_users-2-error')).toHaveTextContent('Enter additional user 3 email address in the correct format, like name@example.com');
    expect(container.querySelector('input[type="text"][name^="additional_users[0][email]"]')).toHaveValue('user1');
    expect(container.querySelector('input[type="text"][name^="additional_users[1][email]"]')).toHaveValue('user2');
    expect(container.querySelector('input[type="text"][name^="additional_users[2][email]"]')).toHaveValue('user3');
    expect(container.querySelector('input[type="checkbox"][name^="additional_users[0][person_is_manager]"]')).toHaveAttribute('checked');
    expect(container.querySelector('input[type="checkbox"][name^="additional_users[1][person_is_manager]"]')).toHaveAttribute('checked');
    expect(container.querySelector('input[type="checkbox"][name^="additional_users[2][person_is_manager]"]')).toHaveAttribute('checked');
  });
});

describe(SupportConfirmationPage, () => {
 
  it('should render provided text', () => {
    const { container } = render(
      <SupportConfirmationPage
          linkTo={route => `__LINKS_TO__${route}`}
          heading={'confirmation panel heading'}
          text={'confirmation panel text'}
        >
          children text
        </SupportConfirmationPage>,
    );

    expect(container.querySelector('.govuk-panel__title')).toHaveTextContent('confirmation panel heading');
    expect(container.querySelector('.govuk-panel__body')).toHaveTextContent('confirmation panel text');
    expect(container.querySelector('.govuk-body')).toHaveTextContent('children text');
  });

  it('should NOT have props children text if not provided', () => {
    const { container } = render(
      <SupportConfirmationPage
          linkTo={route => `__LINKS_TO__${route}`}
          heading={'confirmation panel heading'}
          text={'confirmation panel text'}
        >
        </SupportConfirmationPage>,
    );

    expect(container.querySelector('.govuk-body')).toHaveTextContent('');
  });
});
