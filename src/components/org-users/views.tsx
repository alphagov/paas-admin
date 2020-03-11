import React, { ReactElement, ReactNode } from 'react';

import { capitalize } from '../../layouts';
import { Tick } from '../../layouts/partials';
import {
  IOrganization,
  IOrganizationUserRoles,
  ISpace,
  IUser,
  OrganizationUserRoles,
} from '../../lib/cf/types';
import { RouteLinker } from '../app';
import { IValidationError } from '../errors/types';

interface IDeleteConfirmationPageProperties {
  readonly csrf: string;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly user: IOrganizationUserRoles;
}

interface ISuccessPageProperties {
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
}

interface IPermissionState {
  readonly current?: boolean;
  readonly desired?: boolean;
}

interface IPermissions {
  readonly [guid: string]: {
    readonly [permission: string]: IPermissionState;
  };
}

export interface IRoleValues {
  readonly email?: string;
  readonly org_roles: IPermissions;
  readonly space_roles: IPermissions;
}

interface IPermissionProperties {
  readonly checked: boolean;
  readonly disabled?: boolean;
  readonly name: string;
  readonly namespace: string;
  readonly state: IPermissionState;
}

interface IPermissionTableProperties {
  readonly billingManagers: number;
  readonly managers: number;
  readonly organization: IOrganization;
  readonly spaces: ReadonlyArray<ISpace>;
  readonly values: IRoleValues;
}

interface IEditPageProperties extends IPermissionTableProperties {
  readonly csrf: string;
  readonly email: string;
  readonly errors: ReadonlyArray<IValidationError>;
  readonly isActive: boolean;
  readonly linkTo: RouteLinker;
  readonly user: IUser;
}

interface IInvitePageProperties {
  readonly csrf: string;
  readonly errors?: ReadonlyArray<IValidationError>;
  readonly linkTo: RouteLinker;
  readonly organization: IOrganization;
  readonly spaces: ReadonlyArray<ISpace>;
  readonly values: IRoleValues;
}

export interface IUserRoles {
  readonly spaces: ReadonlyArray<ISpace>;
  readonly orgRoles: ReadonlyArray<OrganizationUserRoles>;
  readonly username: string;
}

export interface IUserRolesByGuid {
  readonly [guid: string]: IUserRoles;
}

interface IOrganizationUsersPageProperties {
  readonly linkTo: RouteLinker;
  readonly organizationGUID: string;
  readonly privileged: boolean;
  readonly users: IUserRolesByGuid;
  readonly userOriginMapping: { readonly [key: string]: string };
}

export function Permission(props: IPermissionProperties): ReactElement {
  return (
    <>
      <input
        type="hidden"
        value={props.state.current ? 1 : 0}
        name={`${props.namespace}[current]`}
      />
      {props.disabled ? (
        <input
          type="hidden"
          value={props.state.desired ? 1 : 0}
          name={`${props.namespace}[desired]`}
        />
      ) : (
        <></>
      )}

      <div className="govuk-form-group">
        <div className="govuk-checkboxes">
          <div className="govuk-checkboxes__item">
            <input
              className="govuk-checkboxes__input"
              id={props.namespace}
              name={`${props.namespace}[desired]`}
              type="checkbox"
              disabled={props.disabled}
              defaultChecked={props.checked}
              value="1"
            />
            <label
              className="govuk-label govuk-checkboxes__label"
              htmlFor={props.namespace}
            >
              <span>{props.name}</span>
            </label>
          </div>
        </div>
      </div>
    </>
  );
}

export function PermissionTable(
  props: IPermissionTableProperties,
): ReactElement {
  return (
    <>
      <h2 className="govuk-heading-l">Set org and space roles</h2>
      <h4 className="govuk-heading-s">Organisation level roles</h4>

      <details className="govuk-details" role="group">
        <summary
          className="govuk-details__summary"
          role="button"
          aria-controls="details-content-0"
          aria-expanded="false"
        >
          <span className="govuk-details__summary-text">
            What can these roles do?
          </span>
        </summary>
        <div className="govuk-details__text" aria-hidden="true">
          <p className="govuk-body">
            <span className="govuk-!-font-weight-bold">Org managers</span> can
            create/delete spaces and edit user roles. The Org Managers would
            typically be senior staff: for example, you might choose to grant
            the role to your technical architect and a lead developer.
          </p>
          <p className="govuk-body">
            <span className="govuk-!-font-weight-bold">
              Org billing managers
            </span>{' '}
            are the points of contact for billing
          </p>
          <p className="govuk-body">
            <span className="govuk-!-font-weight-bold">Org auditors</span> can
            view all spaces but cannot edit them. This role is useful for
            viewing app data without modifying it, for example, monitoring
            time-series metrics data.
          </p>
        </div>
      </details>
      <table id="roles" className="govuk-table permissions">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header name" scope="col">
              Org name
            </th>
            <th className="govuk-table__header" scope="col">
              Org manager
            </th>
            <th className="govuk-table__header" scope="col">
              Org billing manager
            </th>
            <th className="govuk-table__header" scope="col">
              Org auditor
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          <tr
            className="govuk-table__row"
            data-org-guid={props.organization.metadata.guid}
          >
            <th className="govuk-table__header" scope="row">
              {props.organization.entity.name}
            </th>
            <td className="govuk-table__cell ">
              <Permission
                name="Org manager"
                checked={
                  !!props.values.org_roles[props.organization.metadata.guid]
                    .managers.desired
                }
                namespace={`org_roles[${props.organization.metadata.guid}][managers]`}
                state={
                  props.values.org_roles[props.organization.metadata.guid]
                    .managers
                }
                disabled={
                  props.managers < 2 &&
                  props.values.org_roles[props.organization.metadata.guid]
                    .managers.current
                }
              />
            </td>
            <td className="govuk-table__cell ">
              <Permission
                name="Billing manager"
                checked={
                  !!props.values.org_roles[props.organization.metadata.guid]
                    .billing_managers.desired
                }
                namespace={`org_roles[${props.organization.metadata.guid}][billing_managers]`}
                state={
                  props.values.org_roles[props.organization.metadata.guid]
                    .billing_managers
                }
                disabled={
                  props.billingManagers < 2 &&
                  props.values.org_roles[props.organization.metadata.guid]
                    .billing_managers.current
                }
              />
            </td>
            <td className="govuk-table__cell ">
              <Permission
                name="Org auditor"
                checked={
                  !!props.values.org_roles[props.organization.metadata.guid]
                    .auditors.desired
                }
                namespace={`org_roles[${props.organization.metadata.guid}][auditors]`}
                state={
                  props.values.org_roles[props.organization.metadata.guid]
                    .auditors
                }
              />
            </td>
          </tr>
        </tbody>
      </table>
      <h4 className="govuk-heading-s">Space level roles</h4>
      <details className="govuk-details" role="group">
        <summary
          className="govuk-details__summary"
          role="button"
          aria-controls="details-content-0"
          aria-expanded="false"
        >
          <span className="govuk-details__summary-text">
            What can these roles do?
          </span>
        </summary>
        <div className="govuk-details__text" aria-hidden="true">
          <p className="govuk-body">
            <span className="govuk-!-font-weight-bold">Space managers</span> can
            grant user roles within the space, and change properties of the
            space, such as the name. Being a Space Manager does not grant the
            ability to change apps or services, so you need the Space Developer
            role as well if you want to be able to do both things.
          </p>
          <p className="govuk-body">
            <span className="govuk-!-font-weight-bold">Space developers</span>{' '}
            can push, start and stop apps, and create and bind services.
          </p>
          <p className="govuk-body">
            <span className="govuk-!-font-weight-bold">Space auditors</span> can
            view spaces but cannot edit them. This role is useful for viewing
            app data without modifying it, for example, monitoring time-series
            metrics data.
          </p>
        </div>
      </details>
      <table className="govuk-table permissions">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header name" scope="col">
              Space name
            </th>
            <th className="govuk-table__header" scope="col">
              Space manager
            </th>
            <th className="govuk-table__header" scope="col">
              Space developer
            </th>
            <th className="govuk-table__header" scope="col">
              Space auditor
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.spaces.map(space => (
            <tr
              key={space.metadata.guid}
              className="govuk-table__row"
              data-space-guid={space.metadata.guid}
            >
              <th className="govuk-table__header" scope="row">
                {space.entity.name}
              </th>
              <td className="govuk-table__cell ">
                <Permission
                  name="Space manager"
                  checked={
                    !!props.values.space_roles[space.metadata.guid].managers
                      .desired
                  }
                  namespace={`space_roles[${space.metadata.guid}][managers]`}
                  state={props.values.space_roles[space.metadata.guid].managers}
                />
              </td>
              <td className="govuk-table__cell ">
                <Permission
                  name="Space developer"
                  checked={
                    !!props.values.space_roles[space.metadata.guid].developers
                      .desired
                  }
                  namespace={`space_roles[${space.metadata.guid}][developers]`}
                  state={
                    props.values.space_roles[space.metadata.guid].developers
                  }
                />
              </td>
              <td className="govuk-table__cell ">
                <Permission
                  name="Space auditor"
                  checked={
                    !!props.values.space_roles[space.metadata.guid].auditors
                      .desired
                  }
                  namespace={`space_roles[${space.metadata.guid}][auditors]`}
                  state={props.values.space_roles[space.metadata.guid].auditors}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function DeleteConfirmationPage(
  props: IDeleteConfirmationPageProperties,
): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-one-half">
        <a
          href={props.linkTo('admin.organizations.users.edit', {
            organizationGUID: props.organizationGUID,
            userGUID: props.user.metadata.guid,
          })}
          className="govuk-back-link"
        >
          See user view
        </a>
      </div>

      <div className="govuk-grid-column-two-thirds">
        <form method="post" className="govuk-!-mt-r6 paas-remove-user">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <h2 className="govuk-heading-l">
            Are you sure you&apos;d like to remove the following user?
          </h2>

          <p className="govuk-heading-m">{props.user.entity.username}</p>

          <button
            className="govuk-button govuk-button--warning"
            data-module="govuk-button"
            data-prevent-double-click
          >
            Yes, remove from organisation
          </button>

          <a
            href={props.linkTo('admin.organizations.users.edit', {
              organizationGUID: props.organizationGUID,
              userGUID: props.user.metadata.guid,
            })}
            className="govuk-link"
          >
            No, go back to user view
          </a>
        </form>
      </div>
    </div>
  );
}

export function SuccessPage(props: ISuccessPageProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-one-half">
        <a
          href={props.linkTo('admin.organizations.users', {
            organizationGUID: props.organizationGUID,
          })}
          className="govuk-back-link"
        >
          See all team members
        </a>
      </div>

      <div className="govuk-grid-column-one-half govuk-!-pt-r1 text-right">
        <a
          href={props.linkTo('admin.organizations.users.invite', {
            organizationGUID: props.organizationGUID,
          })}
          role="button"
          draggable="false"
          className="govuk-button"
          data-module="govuk-button"
        >
          Invite a new team member
        </a>
      </div>

      <div className="govuk-grid-column-full">
        <div className="govuk-panel govuk-panel--confirmation">
          <h1 className="govuk-panel__title">Success!</h1>
          <div className="govuk-panel__body">{props.children}</div>
        </div>
      </div>
    </div>
  );
}

export function EditPage(props: IEditPageProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <a
          href={props.linkTo('admin.organizations.users', {
            organizationGUID: props.organization.metadata.guid,
          })}
          className="govuk-back-link"
        >
          See all team members
        </a>

        <h1 className="govuk-heading-l">
          <span className="govuk-caption-l">Team member</span> {props.email}
        </h1>

        <table className="govuk-table">
          <tbody className="govuk-table__body">
            <tr className="govuk-table__row">
              <th scope="row" className="govuk-table__header">
                Email
              </th>
              <td className="govuk-table__cell">{props.email}</td>
            </tr>
          </tbody>
        </table>

        {props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              Error validating the update
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}

        {!props.isActive ? (
          <form
            method="post"
            action={props.linkTo('admin.organizations.users.invite.resend', {
              organizationGUID: props.organization.metadata.guid,
              userGUID: props.user.metadata.guid,
            })}
            className="govuk-!-mt-r6"
          >
            <input type="hidden" name="_csrf" value={props.csrf} />
            <p>It would appear the user did not setup their account yet.</p>

            <button
              className="govuk-button"
              data-module="govuk-button"
              data-prevent-double-click="true"
            >
              Resend user invite
            </button>
          </form>
        ) : (
          <></>
        )}

        <form method="post" className="govuk-!-mt-r6">
          <input type="hidden" name="_csrf" value={props.csrf} />
          <PermissionTable
            organization={props.organization}
            spaces={props.spaces}
            values={props.values}
            managers={props.managers}
            billingManagers={props.billingManagers}
          />

          <button
            className="govuk-button"
            data-module="govuk-button"
            data-prevent-double-click="true"
          >
            Save role changes
          </button>
        </form>

        <a
          href={props.linkTo('admin.organizations.users.delete', {
            organizationGUID: props.organization.metadata.guid,
            userGUID: props.user.metadata.guid,
          })}
          className="govuk-link"
        >
          Remove user from Organisation
        </a>
      </div>
    </div>
  );
}

export function InvitePage(props: IInvitePageProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <a
          href={props.linkTo('admin.organizations.users', {
            organizationGUID: props.organization.metadata.guid,
          })}
          className="govuk-back-link"
        >
          See all team members
        </a>

        <h2 className="govuk-heading-l">Invite a new team member</h2>

        {props.errors && props.errors.length > 0 ? (
          <div
            className="govuk-error-summary"
            aria-labelledby="error-summary-title"
            role="alert"
            tabIndex={-1}
            data-module="govuk-error-summary"
          >
            <h2 className="govuk-error-summary__title" id="error-summary-title">
              Error validating the update
            </h2>

            <div className="govuk-error-summary__body">
              <ul className="govuk-list govuk-error-summary__list">
                {props.errors.map((error, index) => (
                  <li key={index}>
                    <a href={`#${error.field}`}>{error.message}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <></>
        )}

        <form method="post" className="govuk-!-mt-r6">
          <input type="hidden" name="_csrf" value={props.csrf} />

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="email">
              Email address
            </label>
            {props.errors
              ?.filter(error => error.field === 'email')
              .map((error, index) => (
                <span
                  key={index}
                  id="email-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </span>
              ))}
            <input
              className={`govuk-input ${
                props.errors?.some(e => e.field === 'email')
                  ? 'govuk-input--error'
                  : ''
              }`}
              id="email"
              name="email"
              type="text"
              defaultValue={props.values.email}
              aria-describedby="email-hint email-error"
            />
          </div>

          <PermissionTable
            organization={props.organization}
            spaces={props.spaces}
            values={props.values}
            managers={10}
            billingManagers={10}
          />

          <button
            className="govuk-button"
            data-module="govuk-button"
            data-prevent-double-click="true"
          >
            Send invitation
          </button>
        </form>
      </div>
    </div>
  );
}

export function OrganizationUsersPage(
  props: IOrganizationUsersPageProperties,
): ReactElement {
  return (
    <>
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds">
          <h1 className="govuk-heading-l">Team members</h1>

          <p className="govuk-body">
            Organisation level users can manage and/or view information
            regarding user accounts, billing, resource quota for the
            organisation and spaces. To edit a member&apos;s role go to their
            profile page.
          </p>

          <details className="govuk-details" role="group">
            <summary
              className="govuk-details__summary"
              role="button"
              aria-controls="details-content-0"
              aria-expanded="false"
            >
              <span className="govuk-details__summary-text">
                What can these roles do?
              </span>
            </summary>

            <div className="govuk-details__text" aria-hidden="true">
              <p className="govuk-body">
                <span className="govuk-!-font-weight-bold">Org managers</span>{' '}
                are users who can create and delete spaces within an org, and
                administer user roles, both within the org and its spaces. We
                recommend to have at least two org managers.
              </p>

              <p className="govuk-body">
                <span className="govuk-!-font-weight-bold">Org auditors</span>{' '}
                are users who can view quota allocation and user roles across
                the org. Auditors can&apos;t change any of these configurations.
              </p>

              <p className="govuk-body">
                <span className="govuk-!-font-weight-bold">
                  Org billing managers
                </span>{' '}
                are users who can see billing, costs and quota information.
              </p>

              <p className="govuk-body">
                Tasks related to spaces are associated with space-level roles.
              </p>
            </div>
          </details>
        </div>

        <div className="govuk-grid-column-one-third text-right">
          {props.privileged ? (
            <a
              href={props.linkTo('admin.organizations.users.invite', {
                organizationGUID: props.organizationGUID,
              })}
              role="button"
              draggable="false"
              className="govuk-button"
              data-module="govuk-button"
            >
              Invite a new team member
            </a>
          ) : (
            <></>
          )}
        </div>
      </div>

      <table className="govuk-table user-list">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header name" scope="col">
              Email address
            </th>
            <th className="govuk-table__header authentication" scope="col">
              {props.privileged ? 'Authentication' : ''}
            </th>
            <th className="govuk-table__header is-org-manager" scope="col">
              Org manager
            </th>
            <th className="govuk-table__header is-billing-manager" scope="col">
              Org billing manager
            </th>
            <th className="govuk-table__header is-org-auditor" scope="col">
              Org auditor
            </th>
            <th className="govuk-table__header spaces" scope="col">
              Spaces assigned or can access
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {Object.keys(props.users).map(guid => (
            <tr key={guid} className="govuk-table__row">
              <td className="govuk-table__cell">
                {props.privileged ? (
                  <a
                    href={props.linkTo('admin.organizations.users.edit', {
                      organizationGUID: props.organizationGUID,
                      userGUID: guid,
                    })}
                    className="govuk-link"
                  >
                    {props.users[guid].username}
                  </a>
                ) : (
                  props.users[guid].username
                )}
              </td>
              <td className="govuk-table__cell">
                {props.privileged ? (
                  props.userOriginMapping[guid] === 'uaa' ? (
                    <a
                      href={props.linkTo('admin.organizations.users.edit', {
                        organizationGUID: props.organizationGUID,
                        userGUID: guid,
                      })}
                      className="govuk-link"
                    >
                      Password
                    </a>
                  ) : (
                    capitalize(props.userOriginMapping[guid])
                  )
                ) : (
                  <></>
                )}
              </td>
              <td className="govuk-table__cell">
                {props.users[guid].orgRoles.includes('org_manager') ? (
                  <Tick />
                ) : (
                  <></>
                )}
              </td>
              <td className="govuk-table__cell">
                {props.users[guid].orgRoles.includes('billing_manager') ? (
                  <Tick />
                ) : (
                  <></>
                )}
              </td>
              <td className="govuk-table__cell">
                {props.users[guid].orgRoles.includes('org_auditor') ? (
                  <Tick />
                ) : (
                  <></>
                )}
              </td>
              <td className="govuk-table__cell">
                <ul className="plain">
                  {props.users[guid].spaces.map(space => (
                    <li key={space.metadata.guid}>
                      <a
                        href={props.linkTo(
                          'admin.organizations.spaces.applications.list',
                          {
                            organizationGUID: props.organizationGUID,
                            spaceGUID: space.metadata.guid,
                          },
                        )}
                        className="govuk-link"
                      >
                        {space.entity.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
