import moment from 'moment';
import React, { ReactElement } from 'react';

import { DATE_TIME, SLUG_REGEX } from '../../layouts';
import { IOrganization, IOrganizationUserRoles } from '../../lib/cf/types';
import { IUaaUser } from '../../lib/uaa';
import { RouteLinker } from '../app';

interface IListTokensProperties {
  readonly linkTo: RouteLinker;
  readonly organization: IOrganization;
  readonly tokens: ReadonlyArray<IOrganizationUserRoles>;
}

interface IExposeSecretProperties {
  readonly linkTo: RouteLinker;
  readonly organization: IOrganization;
  readonly tokenKey: string;
  readonly tokenSecret: string;
  readonly userGUID: string;
}

interface IConfirmActionProperties {
  readonly action: 'revoke';
  readonly csrf: string;
  readonly linkTo: RouteLinker;
  readonly organization: IOrganization;
  readonly token: IUaaUser;
}

interface ICreateAPITokenProperties {
  readonly csrf: string;
  readonly error?: boolean;
  readonly organization: IOrganization;
  readonly values?: {
    readonly name?: string;
  };
}

export function ListTokens(props: IListTokensProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-full">
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <h1 className="govuk-heading-l">API Tokens</h1>

          <p className="govuk-body">
            API Tokens can be used as robot users for tooling such as Continuous Delivery. For instance, a GitHub
            Actions pipeline capable of deploying an applciation after passing defined set of tests.
          </p>
          <p className="govuk-body">
            Each API Token has it&apos;s own set of permissions much like the individual users.
          </p>
        </div>

        <div className="govuk-grid-column-one-third text-right">
          <a
            href={props.linkTo('admin.organizations.tokens.create', {
              organizationGUID: props.organization.metadata.guid,
            })}
            role="button"
            draggable="false"
            className="govuk-button"
            data-module="govuk-button"
          >
            Create a new API Token
          </a>
        </div>
      </div>

      <h2 className="govuk-heading-m">Current API Tokens</h2>
      {props.tokens.length > 0
        ? <div className="scrollable-table-container">
            <table className="govuk-table user-list-table">
              <thead className="govuk-table__head">
                <tr className="govuk-table__row">
                  <th className="govuk-table__header key" scope="col">
                    API Token Key
                  </th>
                  <th className="govuk-table__header secret" scope="col">
                    API Token Secret
                  </th>
                  <th className="govuk-table__header created" scope="col">
                    Created At
                  </th>
                  <th className="govuk-table__header revoke" scope="col">
                    Revoke
                  </th>
                </tr>
              </thead>
              <tbody className="govuk-table__body">
                {props.tokens.map(token => (
                  <tr key={token.metadata.guid} className="govuk-table__row">
                    <th scope="row" className="govuk-table__header govuk-table__header--non-bold">
                      <a
                        href={props.linkTo('admin.organizations.users.edit', {
                          organizationGUID: props.organization.metadata.guid,
                          userGUID: token.metadata.guid,
                        })}
                        className="govuk-link"
                      >
                        <span className="govuk-visually-hidden">API Token:</span> {token.entity.username}
                      </a>
                    </th>
                    <td className="govuk-table__cell">
                      <span className="govuk-visually-hidden">API Token:</span>
                      {' '}
                      Not retreivable
                    </td>
                    <td className="govuk-table__cell">
                      <span className="govuk-visually-hidden">API Token created at:</span>
                      {' '}
                      {moment(token.metadata.created_at).format(DATE_TIME)}
                    </td>
                    <td className="govuk-table__cell">
                      <a
                        href={props.linkTo('admin.organizations.tokens.revoke.confirm', {
                          organizationGUID: props.organization.metadata.guid,
                          tokenGUID: token.metadata.guid,
                        })}
                        title="Revoke the API Token"
                        className="govuk-link"
                      >
                        Revoke
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        : <p className="govuk-body">There are no tokens in tour organisation.</p>}
    </div>
  </div>;
}

export function ExposeSecret(props: IExposeSecretProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <div className="govuk-panel govuk-panel--confirmation">
        <h1 className="govuk-panel__title">Successfully generted token secret</h1>
      </div>

      <dl className="govuk-summary-list govuk-summary-list--no-border">
        <h2 className="govuk-heading-m">API Token</h2>

        <p className="govuk-body">Please take a note of the secret as it will only be exposed once.</p>

        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key"><span className="govuk-visually-hidden">API Token</span> Key</dt>
          <dd className="govuk-summary-list__value">
            <code style={{ whiteSpace: 'nowrap' }}>{props.tokenKey}</code>
          </dd>
        </div>

        <div className="govuk-summary-list__row">
          <dt className="govuk-summary-list__key"><span className="govuk-visually-hidden">API Token</span> Secret</dt>
          <dd className="govuk-summary-list__value">
            <code style={{ whiteSpace: 'nowrap' }}>{props.tokenSecret}</code>
          </dd>
        </div>
      </dl>

      <h2 className="govuk-heading-m">More actions</h2>
      <a
        href={props.linkTo('admin.organizations.users.edit', {
          organizationGUID: props.organization.metadata.guid,
          userGUID: props.userGUID,
        })}
        role="button"
        draggable="false"
        className="govuk-button"
        data-module="govuk-button"
      >
        Manage token permissions
      </a>
    </div>
  </div>;
}

export function ConfirmAction(props: IConfirmActionProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      <form method="post" className="govuk-!-mt-r6 paas-remove-user">
        <input type="hidden" name="_csrf" value={props.csrf} />
        <h2 className="govuk-heading-l">
          Are you sure you&apos;d like to {props.action} the following API Token?
        </h2>

        <p className="govuk-heading-m">{props.token.userName}</p>

        <button
          className="govuk-button govuk-button--warning"
          data-module="govuk-button"
          data-prevent-double-click={true}
        >
          Yes, {props.action} API Token
        </button>

        <a
          href={props.linkTo('admin.organizations.tokens.list', {
            organizationGUID: props.organization.metadata.guid,
          })}
          className="govuk-link"
        >
          No, go back to API Token list
        </a>
      </form>
    </div>
  </div>;
}

export function CreateAPIToken(props: ICreateAPITokenProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-full">
      <h1 className="govuk-heading-l">
        Create new API Token
      </h1>
    </div>

    <div className="govuk-grid-column-one-half">
      <form method="post" noValidate={true}>
        {props.error
          ? <div
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
                    <a href="#name">
                      API Token name needs to be a combination of lowercase alphanumeric characters separated by hyphen.
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          : <></>}

        <input type="hidden" name="_csrf" value={props.csrf} />

        <div className={`govuk-form-group ${props.error ? 'govuk-form-group--error' : ''}`}>
          <label className="govuk-label" htmlFor="name">
            Name
          </label>
          <span id="name-hint" className="govuk-hint">
            Must be a combination of lowercase alphanumeric characters separated by hyphen (<code>-</code>).
          </span>
          {props.error
            ? <span id="name-error" className="govuk-error-message">
                <span className="govuk-visually-hidden">Error:</span>{' '}
                API Token name needs to be a combination of lowercase alphanumeric characters separated by hyphen.
              </span>
            : <></>}
          <input
            className={`govuk-input ${props.error ? 'govuk-input--error' : ''}`}
            id="name"
            name="name"
            type="text"
            spellCheck={false}
            aria-describedby={`name-hint ${props.error ? 'name-error' : ''}`}
            pattern={SLUG_REGEX}
            required={true}
            defaultValue={props.values?.name}
          />
        </div>

        <button className="govuk-button" data-module="govuk-button" data-prevent-double-click={true}>
          Create API Token
        </button>
      </form>
    </div>

    <div className="govuk-grid-column-one-half">
      <p className="govuk-body">
        The name for a robot user. This name will later be prefixed with the
        organisation name and suffixed with a randomly generated 8 alphanumeric
        string, composing end result of <code style={{ whiteSpace: 'nowrap' }}>
          {props.organization.entity.name}-NAME-a1b2c3d4
        </code>.
      </p>

      <p className="govuk-body">
        After creating the API Token, you will receive a API Token Key and Secret.
      </p>

      <p className="govuk-body">
        You should take a note of that, as the API Token Secret is not retreivable.
      </p>
    </div>
  </div>;
}
