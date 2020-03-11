import React, { ReactElement, ReactNode } from 'react';

import { capitalize } from '../../layouts';
import { RouteLinker } from '../app';

import { AccountUser } from './account_user';

interface IProperties {
  readonly linkTo: RouteLinker;
  readonly provider: string;
}

interface IMessageProperties extends IProperties {
  readonly children?: ReactNode;
}

interface ISSOPageProperties extends IProperties {
  readonly csrf: string;
  readonly user: AccountUser;
}

function Message(props: IMessageProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        {props.children}

        <p className="govuk-body">
          If you have any queries, contact{' '}
          <a
            className="govuk-link"
            href="https://www.cloud.service.gov.uk/support"
          >
            support
          </a>
          .
        </p>
        <a href={props.linkTo('admin.home')} className="govuk-back-link">
          Back to account
        </a>
      </div>
    </div>
  );
}

export function AccessDeniedPage(props: IProperties): ReactElement {
  return (
    <Message {...props}>
      <h1 className="govuk-heading-xl">
        Sorry, there is a problem activating {capitalize(props.provider)} SSO
      </h1>
      <p className="govuk-body">Access Denied</p>
      <p className="govuk-body">
        We&apos;re unable to access information about you. You may need to
        provide conset with your SSO provider when asked.
      </p>
    </Message>
  );
}

export function UnavailablePage(props: IProperties): ReactElement {
  return (
    <Message {...props}>
      <h1 className="govuk-heading-xl">
        Sorry, there is a problem with the {capitalize(props.provider)} SSO
        provider
      </h1>
      <p className="govuk-body">
        {capitalize(props.provider)} SSO provider is temporarily unavailable.
      </p>
      <p className="govuk-body">Please try again later</p>
    </Message>
  );
}

export function SuccessfulUpliftPage(props: IProperties): ReactElement {
  return (
    <Message {...props}>
      <div className="govuk-panel govuk-panel--confirmation">
        <h1 className="govuk-panel__title">SSO Activation Successful</h1>
      </div>

      <p className="govuk-body">
        You can now log in using {capitalize(props.provider)} SSO. You have not
        been logged out now.
      </p>
    </Message>
  );
}

export function UnsuccessfulUpliftPage(props: IProperties): ReactElement {
  return (
    <Message {...props}>
      <h1 className="govuk-heading-xl">
        Sorry, there is a problem activating {capitalize(props.provider)} SSO
        for your account
      </h1>
      <p className="govuk-body">
        We were unable to activate {capitalize(props.provider)} SSO for your
        GOV.UK PaaS account.
      </p>
    </Message>
  );
}

export function SSOPage(props: ISSOPageProperties): ReactElement {
  return (
    <>
      <a href={props.linkTo('admin.home')} className="govuk-back-link">
        Back
      </a>
      <div className="govuk-grid-row">
        {props.user.origin === 'uaa' ? (
          <div className="govuk-grid-column-two-thirds">
            <h1 className="govuk-heading-l">
              Using {capitalize(props.provider)} single sign-on (SSO)
            </h1>
            <section id="sso-process-explanation">
              <p className="govuk-body">
                Activating {capitalize(props.provider)} single sign-on for your
                GOV.UK PaaS account means you can no longer sign in using your
                existing username and password. Instead, you will sign in using
                using the single sign-on option on the log in screen.
              </p>
              <p className="govuk-body">
                You will also need to{' '}
                <a
                  href="https://docs.cloud.service.gov.uk/get_started.html#use-the-single-sign-on-function"
                  className="govuk-link"
                >
                  use single sign-on at the command line
                </a>
                .
              </p>
            </section>

            <form
              method="post"
              action={props.linkTo(`account.use-${props.provider}-sso.post`)}
              className="govuk-form"
            >
              <input type="hidden" name="_csrf" value={props.csrf} />
              <button
                className="govuk-button"
                data-module="govuk-button"
                type="submit"
              >
                Activate {capitalize(props.provider)} single sign-on
              </button>
            </form>
          </div>
        ) : (
          <></>
        )}

        {['google', 'microsoft'].includes(props.user.origin) ? (
          <div className="govuk-grid-column-two-thirds">
            <h1 className="govuk-heading-l">
              Using {capitalize(props.provider)} single sign-on (SSO)
            </h1>
            <section id="opt-out-process-explanation">
              <p className="govuk-body">
                You are currently set-up to use {capitalize(props.provider)}{' '}
                single sign-on. You will also need to{' '}
                <a
                  href="https://docs.cloud.service.gov.uk/get_started.html#use-the-single-sign-on-function"
                  className="govuk-link"
                >
                  use single sign-on at the command line
                </a>
                .
              </p>
              <p className="govuk-body">
                If you would like to switch sign-on method, contact{' '}
                <a
                  href="https://www.cloud.service.gov.uk/support"
                  className="govuk-link"
                >
                  support
                </a>
                .
              </p>
            </section>
          </div>
        ) : (
          <div className="govuk-grid-column-two-thirds">
            <h1 className="govuk-heading-l">Using single sign-on (SSO)</h1>
            <section id="opt-out-process-explanation">
              <p>
                You are currently set up to use another single sign-on provider.
                You will also need to{' '}
                <a
                  href="https://docs.cloud.service.gov.uk/get_started.html#use-the-single-sign-on-function"
                  className="govuk-link"
                >
                  use single sign-on on at the command line
                </a>
                .
              </p>
              <p>
                If you would like begin using Microsoft single sign-on, contact{' '}
                <a
                  href="https://www.cloud.service.gov.uk/support"
                  className="govuk-link"
                >
                  support
                </a>
                .
              </p>
            </section>
          </div>
        )}
      </div>
    </>
  );
}
