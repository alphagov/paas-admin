/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { format } from 'date-fns';
import React from 'react';

import { DATE_TIME } from '../../layouts';
import { IOrganization } from '../../lib/cf/types';
import { IUaaGroup } from '../../lib/uaa';

import { PasswordResetRequest, PasswordResetSetPasswordForm, PasswordResetSuccess, UserPage } from './views';

function linker(_route: string, params: any): string {
  return params?.organizationGUID
    ? `/user/${params.organizationGUID}`
    : '/test';
}

describe(UserPage, () => {
  const orgA = ({
    entity: { name: 'A' },
    metadata: { guid: 'a' },
  } as unknown) as IOrganization;
  const orgB = ({
    entity: { name: 'B' },
    metadata: { guid: 'b' },
  } as unknown) as IOrganization;
  const orgC = ({
    entity: { name: 'C' },
    metadata: { guid: 'c' },
  } as unknown) as IOrganization;
  const group = ({ display: 'profile' } as unknown) as IUaaGroup;
  const user = {
    email: 'jeff@jefferson.com',
    username: 'jeff0',
    uuid: 'ACCOUNTS-USER-GUID',
  };
  const logon = new Date(2020, 1, 1);

  it('should display list of organizations', () => {
    const { container } = render(
      <UserPage
        organizations={[orgA, orgB, orgC]}
        groups={[group]}
        lastLogon={logon}
        linkTo={linker}
        user={user}
        origin="google"
      />,
    );
    expect(container.querySelector('.govuk-summary-list')).toHaveTextContent(format(new Date(logon), DATE_TIME));
    expect(container.querySelector('p')).toHaveTextContent('This user is a member of 3 orgs.');
    expect(container.querySelectorAll('ul:last-of-type li')).toHaveLength(1);
  });

  it('should display list of organizations', () => {
    const { queryByText } = render(
      <UserPage
        organizations={[orgA, orgB, orgC]}
        groups={[group]}
        lastLogon={logon}
        linkTo={linker}
        user={user}
        origin="google"
      />,
    );
    expect(queryByText('This user is a member of 3 orgs.')).toBeTruthy();
  });
});

describe(PasswordResetRequest, () => {
  it('should correctly produce the syntax', () => {
    const { container } = render(<PasswordResetRequest csrf="CSRF_TOKEN" />);
    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container).not.toHaveTextContent('Enter an email address in the correct format, like name@example.com');
  });

  it('should correctly throw an error when invalidEmail flag on', () => {
    const { container } = render(<PasswordResetRequest
      csrf="CSRF_TOKEN"
      invalidEmail={true}
      values={{ email: 'jeff@example.com' }}
    />);
    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelector('input[name=email]')).toHaveValue('jeff@example.com');
    expect(container).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
  });

  it('should correctly throw an error when invalidEmail flag on and no values passed back', () => {
    const { container } = render(<PasswordResetRequest
      csrf="CSRF_TOKEN"
      invalidEmail={true}
    />);
    expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
    expect(container.querySelector('input[name=email]')).toHaveValue('');
    expect(container).toHaveTextContent('Enter an email address in the correct format, like name@example.com');
  });
});

describe(PasswordResetSuccess, () => {
  it('should correctly produce the syntax', () => {
    render(<PasswordResetSuccess title="Success" />);
    expect(screen.getByRole('heading', { level: 1})).toHaveTextContent('Success');
  });
});

describe(PasswordResetSetPasswordForm, () => {
  it('should correctly produce the syntax', () => {
    const { container } = render(<PasswordResetSetPasswordForm csrf="CSRF_TOKEN" code="PASSWORD_RESET_CODE" />);
     expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
     expect(container.querySelector('input[name=code]')).toHaveValue('PASSWORD_RESET_CODE');
    expect(container).not.toHaveTextContent('You need to type in the same password twice');
  });

  it('should correctly throw an error when passwordMismatch flag on', () => {
    const { container } = render(<PasswordResetSetPasswordForm
      code="PASSWORD_RESET_CODE"
      csrf="CSRF_TOKEN"
      passwordMismatch={true}
    />);
     expect(container.querySelector('input[name=_csrf]')).toHaveValue('CSRF_TOKEN');
     expect(container.querySelector('input[name=code]')).toHaveValue('PASSWORD_RESET_CODE');
    expect(container).toHaveTextContent('You need to type in the same password twice');
  });
});
