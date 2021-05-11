import moment from 'moment'
import React, { ReactElement } from 'react'

import { DATE_TIME } from '../../layouts'
import { IAccountsUser } from '../../lib/accounts'
import { IOrganization } from '../../lib/cf/types'
import { IUaaGroup } from '../../lib/uaa'
import { RouteLinker } from '../app'

interface IUserPageProps {
  readonly groups: readonly IUaaGroup[]
  readonly lastLogon: Date
  readonly linkTo: RouteLinker
  readonly organizations: readonly IOrganization[]
  readonly origin: string
  readonly user: IAccountsUser
}

interface IPasswordResetFormProperties {
  readonly csrf: string
  readonly invalidEmail?: boolean
  readonly userEnabledSSO?: boolean
  readonly idpNice?: string
  readonly userNotFound?: boolean
  readonly values?: {
    readonly email: string
  }
}

interface IPasswordResetSetPasswordFormProperties {
  readonly code: string
  readonly csrf: string
  readonly passwordMismatch?: boolean
  readonly passwordDoesNotMeetPolicy?: boolean
  readonly passwordDoesNotMeetPolicyMessage?: string
}

interface IPasswordResetSuccessProperties {
  readonly footnote?: string
  readonly message?: string
  readonly title: string
}

export function UserPage (props: IUserPageProps): ReactElement {
  const listOrgs = (orgs: readonly IOrganization[]) =>
    orgs.map(org => (
      <li key={org.metadata.guid}>
        <a
          href={props.linkTo('admin.organizations.view', {
            organizationGUID: org.metadata.guid
          })}
          className='govuk-link'
        >
          {org.entity.name}
        </a>
      </li>
    ))

  return (
    <>
      <h3 className='govuk-heading-m'>User</h3>

      <dl className='govuk-summary-list govuk-summary-list--no-border'>
        <div className='govuk-summary-list__row'>
          <dt className='govuk-summary-list__key'>GUID</dt>
          <dd className='govuk-summary-list__value'>
            <code>{props.user.uuid}</code>
          </dd>
        </div>
        <div className='govuk-summary-list__row'>
          <dt className='govuk-summary-list__key'>Username</dt>
          <dd className='govuk-summary-list__value'>
            <code>{props.user.username}</code>
          </dd>
        </div>
        <div className='govuk-summary-list__row'>
          <dt className='govuk-summary-list__key'>Email address</dt>
          <dd className='govuk-summary-list__value'>
            <a className='govuk-link' href={`mailto:${props.user.email}`}>
              {props.user.email}
            </a>
          </dd>
        </div>
        <div className='govuk-summary-list__row'>
          <dt className='govuk-summary-list__key'>Origin</dt>
          <dd className='govuk-summary-list__value'>
            <code>{props.origin}</code>
          </dd>
        </div>
        <div className='govuk-summary-list__row'>
          <dt className='govuk-summary-list__key'>Last logon</dt>
          <dd className='govuk-summary-list__value'>
            {moment(props.lastLogon).format(DATE_TIME)}
          </dd>
        </div>
      </dl>

      <h3 className='govuk-heading-m'>Orgs</h3>
      <p className='govuk-body'>
        This user is a member of {props.organizations.length}{' '}
        {props.organizations.length === 1 ? 'org' : 'orgs'}.
      </p>
      <ul className='govuk-list govuk-list--bullet'>
        {listOrgs(props.organizations)}
      </ul>

      <h3 className='govuk-heading-m'>UAA Groups</h3>

      <ul className='govuk-list govuk-list--bullet'>
        {props.groups.map(group => (
          <li key={group.display}>
            <code>{group.display}</code>
          </li>
        ))}
      </ul>
    </>
  )
}

export function PasswordResetRequest (props: IPasswordResetFormProperties): ReactElement {
  return (
    <div className='govuk-grid-row'>
      <div className='govuk-grid-column-two-thirds'>
        {props.invalidEmail || props.userEnabledSSO || props.userNotFound ? <div
          className='govuk-error-summary'
          aria-labelledby='error-summary-title'
          role='alert'
          tabIndex={-1}
          data-module='govuk-error-summary'
        >
          <h2 className='govuk-error-summary__title' id='error-summary-title'>
            There is a problem
          </h2>

          {props.invalidEmail ? <div className='govuk-error-summary__body'>
            <ul className='govuk-list govuk-error-summary__list'>
              <li>
                <a href='#email'>Enter an email address in the correct format, like name@example.com</a>
              </li>
            </ul>
                                </div> : <></>}

          {props.userEnabledSSO ? <div className='govuk-error-summary__body'>
            <ul className='govuk-list govuk-error-summary__list'>
              <li>
                <a href='#email'>You have enabled single sign-on, please sign in using {props.idpNice!}</a>
              </li>
            </ul>
          </div> : <></>}

          {props.userNotFound ? <div className='govuk-error-summary__body'>
            <ul className='govuk-list govuk-error-summary__list'>
              <li>
                <a href='#email'>User not found</a>
              </li>
            </ul>
          </div> : <></>}
        </div> : <></>}

        <h1 className='govuk-heading-l'>Request password reset</h1>
        <p className='govuk-body'>
          We will send you an activation link via email.
        </p>

        <form method='post' className='govuk-!-mt-r6'>
          <input type='hidden' name='_csrf' value={props.csrf} />

          <div className={`govuk-form-group ${props.invalidEmail ? 'govuk-form-group--error' : ''}`}>
            <label className='govuk-label' htmlFor='email'>
              Email address
            </label>

            {props.invalidEmail ? <span id='email-error' className='govuk-error-message'>
              <span className='govuk-visually-hidden'>Error:</span>{' '}
              Enter an email address in the correct format, like name@example.com
                                  </span> : <></>}

            <input
              className={`govuk-input ${props.invalidEmail ? 'govuk-input--error' : ''}`}
              id='email'
              name='email'
              type='text'
              defaultValue={props.values?.email}
              aria-describedby={props.invalidEmail ? 'email-error' : ''}
            />
          </div>

          <button
            className='govuk-button'
            data-module='govuk-button'
            data-prevent-double-click='true'
          >
            Request password reset
          </button>
        </form>
      </div>
    </div>
  )
}

export function PasswordResetSuccess (props: IPasswordResetSuccessProperties): ReactElement {
  return (
    <div className='govuk-grid-row'>
      <div className='govuk-grid-column-two-thirds'>
        <div className='govuk-panel govuk-panel--confirmation'>
          <h1 className='govuk-panel__title'>{props.title}</h1>
          <div className='govuk-panel__body'>{props.message}</div>
        </div>

        <p className='govuk-body'>
          {props.footnote}
        </p>
      </div>
    </div>
  )
}

export function PasswordResetSetPasswordForm (props: IPasswordResetSetPasswordFormProperties): ReactElement {
  return (
    <div className='govuk-grid-row'>
      <div className='govuk-grid-column-two-thirds'>
        {props.passwordMismatch || props.passwordDoesNotMeetPolicy ? <div
          className='govuk-error-summary'
          aria-labelledby='error-summary-title'
          role='alert'
          tabIndex={-1}
          data-module='govuk-error-summary'
        >
          <h2 className='govuk-error-summary__title' id='error-summary-title'>
            There is a problem
          </h2>

          <div className='govuk-error-summary__body'>
            <ul className='govuk-list govuk-error-summary__list'>
              {props.passwordMismatch
                ? <li><a href='#password'>You need to type in the same password twice</a></li>
                : <></>}
              {props.passwordDoesNotMeetPolicy
                ? <li><a href='#password'>Your password should meet our password policy</a></li>
                : <></>}
            </ul>
          </div>
        </div> : <></>}

        <h1 className='govuk-heading-l'>Password reset</h1>
        <p className='govuk-body'>You should set a secure password which:</p>
        <ul className='govuk-list govuk-list--bullet'>
          <li>is at least 12 characters long</li>
          <li>includes both an uppercase and lowercase character</li>
          <li>includes a number</li>
          <li>
            includes one of <code>-_+:;&lt;&gt;[]()#@£$%^&amp;!</code>
          </li>
          <li>you do not use anywhere else (eg for another website)</li>
        </ul>

        <form method='post' className='govuk-!-mt-r6'>
          <input type='hidden' name='_csrf' value={props.csrf} />
          <input type='hidden' name='code' value={props.code} />

          <div className={`govuk-form-group ${props.passwordMismatch || props.passwordDoesNotMeetPolicy ? 'govuk-form-group--error' : ''}`}>

            <label className='govuk-label' htmlFor='password'>
              New Password
            </label>

            {props.passwordMismatch ? <span id='password-error' className='govuk-error-message'>
              <span className='govuk-visually-hidden'>Error:</span>{' '}
              You need to type in the same password twice
            </span> : <></>}

            {props.passwordDoesNotMeetPolicy ? <span id='password-error' className='govuk-error-message'>
              <span className='govuk-visually-hidden'>Error:</span>{' '}
              {props.passwordDoesNotMeetPolicyMessage!}
            </span> : <></>}

            <input
              className={`govuk-input ${props.passwordMismatch || props.passwordDoesNotMeetPolicy ? 'govuk-input--error' : ''}`}
              id='password'
              name='password'
              type='password'
              aria-describedby={props.passwordMismatch || props.passwordDoesNotMeetPolicy ? 'password-error' : ''}
            />
          </div>
          <div className={`govuk-form-group ${props.passwordMismatch ? 'govuk-form-group--error' : ''}`}>

            <label className='govuk-label' htmlFor='password-confirmation'>
              Confirm your new password
            </label>

            {props.passwordMismatch ? <span id='password-confirmation-error' className='govuk-error-message'>
              <span className='govuk-visually-hidden'>Error:</span>{' '}
              You need to type in the same password twice
                                      </span> : <></>}

            <input
              className={`govuk-input ${props.passwordMismatch ? 'govuk-input--error' : ''}`}
              id='password-confirmation'
              name='passwordConfirmation'
              type='password'
              aria-describedby={props.passwordMismatch ? 'password-error' : ''}
            />
          </div>

          <button
            className='govuk-button'
            data-module='govuk-button'
            data-prevent-double-click='true'
          >
            Reset password
          </button>
        </form>
      </div>
    </div>
  )
}
