import moment from 'moment';
import React, { ReactElement } from 'react';

import { DATE_TIME } from '../../layouts';
import { IAccountsUser } from '../../lib/accounts';
import { IUserSummaryOrganization } from '../../lib/cf/types';
import { IUaaGroup } from '../../lib/uaa';
import { RouteLinker } from '../app';

interface IUserPageProps {
  readonly groups: ReadonlyArray<IUaaGroup>;
  readonly lastLogon: Date;
  readonly linkTo: RouteLinker;
  readonly managedOrganizations: ReadonlyArray<IUserSummaryOrganization>;
  readonly organizations: ReadonlyArray<IUserSummaryOrganization>;
  readonly origin: string;
  readonly user: IAccountsUser;
}

interface IPasswordResetFormProperties {
  readonly csrf: string;
  readonly invalidEmail?: boolean;
  readonly userEnabledSSO?: boolean;
  readonly idpNice?: string;
  readonly userNotFound?: boolean;
  readonly values?: {
    readonly email: string;
  };
}

interface IPasswordResetSetPasswordFormProperties {
  readonly code: string;
  readonly csrf: string;
  readonly passwordMissmatch?: boolean;
}

interface IPasswordResetSuccessProperties {
  readonly footnote?: string;
  readonly message?: string;
  readonly title: string;
}

export function UserPage(props: IUserPageProps): ReactElement {
  const listOrgs = (orgs: ReadonlyArray<IUserSummaryOrganization>) =>
    orgs.map(org => (
      <li key={org.metadata.guid}>
        <a
          href={props.linkTo('admin.organizations.view', {
            organizationGUID: org.metadata.guid,
          })}
          className="govuk-link"
        >
          {org.entity.name}
        </a>
      </li>
    ));

  return (
    <>
      <h3 className="govuk-heading-m">User</h3>

      <dl className="govuk-summary-list govuk-summary-list--no-border">
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">GUID</dt>
          <dd className="govuk-summary-list__value">
            <code>{props.user.uuid}</code>
          </dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Username</dt>
          <dd className="govuk-summary-list__value">
            <code>{props.user.username}</code>
          </dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Email address</dt>
          <dd className="govuk-summary-list__value">
            <a className="govuk-link" href={`mailto:${props.user.email}`}>
              {props.user.email}
            </a>
          </dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Origin</dt>
          <dd className="govuk-summary-list__value">
            <code>{props.origin}</code>
          </dd>
        </div>
        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key">Last logon</dt>
          <dd className="govuk-summary-list__value">
            {moment(props.lastLogon).format(DATE_TIME)}
          </dd>
        </div>
      </dl>

      <h3 className="govuk-heading-m">Orgs</h3>
      <p className="govuk-body">
        This user is a member of {props.organizations.length}{' '}
        {props.organizations.length === 1 ? 'org' : 'orgs'}.
      </p>
      <ul className="govuk-list govuk-list--bullet">
        {listOrgs(props.organizations)}
      </ul>

      <h3 className="govuk-heading-m">Managed Orgs</h3>
      <p className="govuk-body">
        This user manages {props.managedOrganizations.length}{' '}
        {props.managedOrganizations.length === 1 ? 'org' : 'orgs'}.
      </p>
      <ul className="govuk-list govuk-list--bullet">
        {listOrgs(props.managedOrganizations)}
      </ul>

      <h3 className="govuk-heading-m">UAA Groups</h3>

      <ul className="govuk-list govuk-list--bullet">
        {props.groups.map(group => (
          <li key={group.display}>
            <code>{group.display}</code>
          </li>
        ))}
      </ul>
    </>
  );
}

export function PasswordResetRequest(props: IPasswordResetFormProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      {props.invalidEmail || props.userEnabledSSO || props.userNotFound ? <div
        className="govuk-error-summary"
        aria-labelledby="error-summary-title"
        role="alert"
        tabIndex={-1}
        data-module="govuk-error-summary"
      >
        <h2 className="govuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h2>

        {props.invalidEmail ?  <div className="govuk-error-summary__body">
          <ul className="govuk-list govuk-error-summary__list">
            <li>
              <a href="#email">Enter an email address in the correct format, like name@example.com</a>
            </li>
          </ul>
          </div> : <></>}

        {props.userEnabledSSO ?  <div className="govuk-error-summary__body">
          <ul className="govuk-list govuk-error-summary__list">
            <li>
              <a href="#email">You have enabled single sign-on, please sign in using {props.idpNice!}</a>
            </li>
          </ul>
        </div> : <></>}

        {props.userNotFound ?  <div className="govuk-error-summary__body">
          <ul className="govuk-list govuk-error-summary__list">
            <li>
              <a href="#email">User not found</a>
            </li>
          </ul>
        </div> : <></>}
      </div> : <></>}

      <h1 className="govuk-heading-l">Request password reset</h1>
      <p className="govuk-body">
        We will send you an activation link via email.
      </p>

      <form method="post" className="govuk-!-mt-r6">
        <input type="hidden" name="_csrf" value={props.csrf} />

        <div className={`govuk-form-group ${props.invalidEmail ? 'govuk-form-group--error' : ''}`}>
          <label className="govuk-label" htmlFor="email">
            Email address
          </label>

          {props.invalidEmail ? <span id="email-error" className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>{' '}
            Enter an email address in the correct format, like name@example.com
          </span> : <></>}

          <input
            className={`govuk-input ${props.invalidEmail ? 'govuk-input--error' : ''}`}
            id="email"
            name="email"
            type="text"
            defaultValue={props.values?.email}
            aria-describedby={props.invalidEmail ? 'email-error' : ''}
          />
        </div>

        <button
          className="govuk-button"
          data-module="govuk-button"
          data-prevent-double-click="true"
        >
          Request password reset
        </button>
      </form>
    </div>
  </div>;
}

export function PasswordResetSuccess(props: IPasswordResetSuccessProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <div className="govuk-panel govuk-panel--confirmation">
        <h1 className="govuk-panel__title">{props.title}</h1>
        <div className="govuk-panel__body">{props.message}</div>
      </div>

      <p className="govuk-body">
        {props.footnote}
      </p>
    </div>
  </div>;
}

export function PasswordResetSetPasswordForm(props: IPasswordResetSetPasswordFormProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      {props.passwordMissmatch ? <div
        className="govuk-error-summary"
        aria-labelledby="error-summary-title"
        role="alert"
        tabIndex={-1}
        data-module="govuk-error-summary"
      >
        <h2 className="govuk-error-summary__title" id="error-summary-title">
          There is a problem
        </h2>

        <div className="govuk-error-summary__body">
          <ul className="govuk-list govuk-error-summary__list">
            <li>
              <a href="#password">You need to type in the same password twice</a>
            </li>
          </ul>
        </div>
      </div> : <></>}

      <h1 className="govuk-heading-l">Password reset</h1>
      <p className="govuk-body">
        We will send you an activation link via email. If you do not receive an
        email in the next 24 hours, your account may not exist in the system or
        you could have setup authentication with Google or Microsoft Single
        Sign-on.
      </p>

      <form method="post" className="govuk-!-mt-r6">
        <input type="hidden" name="_csrf" value={props.csrf} />

        <div className={`govuk-form-group ${props.passwordMissmatch ? 'govuk-form-group--error' : ''}`}>
          <input type="hidden" name="code" value={props.code} />

          <label className="govuk-label" htmlFor="password">
            New Password
          </label>

          {props.passwordMissmatch ? <span id="password-error" className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>{' '}
            You need to type in the same password twice
          </span> : <></>}

          <input
            className={`govuk-input ${props.passwordMissmatch ? 'govuk-input--error' : ''}`}
            id="password"
            name="password"
            type="password"
            aria-describedby={props.passwordMissmatch ? 'password-error' : ''}
          />

          <label className="govuk-label" htmlFor="password-confirmation">
            Confirm your new password
          </label>

          {props.passwordMissmatch ? <span id="password-confirmation-error" className="govuk-error-message">
            <span className="govuk-visually-hidden">Error:</span>{' '}
            You need to type in the same password twice
          </span> : <></>}

          <input
            className={`govuk-input ${props.passwordMissmatch ? 'govuk-input--error' : ''}`}
            id="password-confirmation"
            name="passwordConfirmation"
            type="password"
            aria-describedby={props.passwordMissmatch ? 'password-error' : ''}
          />
        </div>

        <button
          className="govuk-button"
          data-module="govuk-button"
          data-prevent-double-click="true"
        >
          Reset password
        </button>
      </form>
    </div>
  </div>;
}
