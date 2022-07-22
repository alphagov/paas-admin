/**
 * @jest-environment jsdom
 */
 import { render } from '@testing-library/react';
import React from 'react';

import {
  ContactUsPage,
  HelpUsingPaasPage,
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
