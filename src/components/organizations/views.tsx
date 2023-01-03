import React, { ReactElement, ReactNode } from 'react';

import { bytesToHuman, MEBIBYTE } from '../../layouts';
import { IOrganization, IOrganizationQuota, IV3OrganizationQuota, IV3OrganizationResource } from '../../lib/cf/types';
import { RouteLinker } from '../app';
import { ISpace } from '../../lib/cf/types';
import { owners } from './owners';
import { IValidationError } from '../errors/types';

interface IOrganizationProperties {
  readonly guid: string;
  readonly name: string;
  readonly billable: boolean;
  readonly suspended: boolean;
  readonly linkTo: RouteLinker;
}

interface IProperties {
  readonly linkTo: RouteLinker;
}

interface IOrganizationPageProperties {
  readonly organizations: ReadonlyArray<IOrganization>;
  readonly linkTo: RouteLinker;
  readonly quotas: { readonly [guid: string]: IOrganizationQuota };
  readonly filterLink?: {
    readonly href: string,
    readonly view: string,
    readonly text: string
  };
  readonly isAdmin: boolean;
}

interface IEditOrganizationProperties {
  readonly csrf: string;
  readonly organization: IV3OrganizationResource;
  readonly quotas: ReadonlyArray<IV3OrganizationQuota>;
}

interface IFormProperties extends IProperties {
  readonly csrf: string;
  readonly errors?: ReadonlyArray<IValidationError>;
}

export interface IEmailManagersFormValues {
  readonly message: string;
  readonly managerType: string;
  readonly space: string;
  readonly subject?: string
}

interface IEmailManagersFormProperties extends IFormProperties {
  readonly csrf: string;
  readonly linkTo: RouteLinker;
  readonly organisation: IOrganization;
  readonly spaces: ReadonlyArray<ISpace>;
  readonly values?: IEmailManagersFormValues;
}

interface EmailManagersConfirmationPageProperties {
  readonly heading: string;
  readonly text: string;
  readonly children: ReactNode;
  readonly linkTo: RouteLinker;
}

export function Organization(props: IOrganizationProperties): ReactElement {
  const linkAriaLabel = props.suspended
    ? `Organisation name: ${props.name}, status: suspended`
    : `Organisation name: ${props.name}`;

  return (
    <tr className="govuk-table__row">
      <th scope="row" className="govuk-table__header govuk-table__header--non-bold">
        <a
          href={props.linkTo('admin.organizations.view', {
            organizationGUID: props.guid,
          })}
          aria-label={linkAriaLabel}
          className="govuk-link"
        >
          <span className="govuk-visually-hidden">Organisation name:</span> {props.name}
        </a>
        {props.suspended &&
          <span className="govuk-tag govuk-tag--grey pull-right">Suspended</span>
        }
      </th>
      <td className="govuk-table__cell">
        {props.billable ? 'Billable' : 'Trial'}
      </td>
    </tr>
  );
}

export function OrganizationsPage(
  props: IOrganizationPageProperties,
): ReactElement {
  const organizations = props.organizations.map(org => (
    <Organization
      key={org.metadata.guid}
      guid={org.metadata.guid}
      name={org.entity.name}
      suspended={org.entity.status == 'suspended'}
      linkTo={props.linkTo}
      billable={
        props.quotas[org.entity.quota_definition_guid].entity.name !== 'default'
      }
    />
  ));
  const singleOrg = props.organizations.length === 1;

  return (
    <>

      <h1 className="govuk-heading-l">Organisations</h1>

      <p className="govuk-body">
        There {singleOrg ? 'is' : 'are'} {props.organizations.length}{' '}
        {singleOrg ? 'organisation' : 'organisations'} which you can access.
      </p>
      {props.isAdmin ?
        <a  className="govuk-button govuk-button--secondary"
            href={props.linkTo(
              props!.filterLink!.href,
              {
                view: props!.filterLink!.view,
              },
            )}
          >{props!.filterLink!.text}
        </a>
        : <></>
      }
      <div className="scrollable-table-container">
        <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th
              scope="col"
              className="govuk-table__header govuk-!-width-two-thirds"
            >
              Organisation name
            </th>
            <th scope="col" className="govuk-table__header">
              Billing lifecycle
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">{organizations}</tbody>
      </table>
      </div>

      <hr className="govuk-section-break govuk-section-break--m" />

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <h2 className="govuk-heading-l">Get started with the command line</h2>

          <p className="govuk-body">
            Installing the Cloud Foundry command line will let you operate
            GOV.UK PaaS from your computer terminal.
          </p>

          <h3 className="govuk-heading-m">
            Download the Cloud Foundry command line tool
          </h3>
        </div>

        <div className="govuk-grid-column-one-third">
          <h3 className="govuk-heading-s">Linux</h3>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=redhat64&version=v7&source=github"
              className="govuk-link"
            >
              Download the RedHat version [RPM] <span className="govuk-visually-hidden">installer file</span>
            </a>
          </p>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=debian64&version=v7&source=github"
              className="govuk-link"
            >
              Download the Debian version [DEB] <span className="govuk-visually-hidden">installer file</span>
            </a>
          </p>
        </div>

        <div className="govuk-grid-column-one-third">
          <h3 className="govuk-heading-s">macOS</h3>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=macosx64&version=v7&source=github"
              className="govuk-link"
            >
              Download the macOS version [PKG] <span className="govuk-visually-hidden">installer file</span>
            </a>
          </p>
        </div>

        <div className="govuk-grid-column-one-third">
          <h3 className="govuk-heading-s">Windows</h3>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=windows64&version=v7&source=github"
              className="govuk-link"
            >
              Download the Windows version [ZIP] <span className="govuk-visually-hidden">installer file</span>
            </a>
          </p>
        </div>
      </div>

      <p className="govuk-body">
        For more information about the Cloud Foundry command line tool, or to
        view the source code{' '}
        <a
          href="https://github.com/cloudfoundry/cli/wiki/V7-CLI-Installation-Guide"
          className="govuk-link"
        >
          visit the <span className="govuk-visually-hidden">Cloud Foundry</span> GitHub page
        </a>
        .
      </p>

      <h2 className="govuk-heading-l">Once you’ve installed the CF CLI</h2>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half">
          <h3 className="govuk-heading-m">Set up and deploy your first app</h3>

          <p className="govuk-body">
            <a
              href="https://docs.cloud.service.gov.uk/get_started.html#set-up-the-cloud-foundry-command-line"
              className="govuk-link"
            >
              View our guide on logging in and deploying your first app
            </a>{' '}
            to GOV.UK PaaS.
          </p>
        </div>

        <div className="govuk-grid-column-one-half">
          <h3 className="govuk-heading-m">Learn more about orgs and spaces</h3>

          <p className="govuk-body">
            <a
              href="https://docs.cloud.service.gov.uk/orgs_spaces_users.html"
              className="govuk-link"
            >
              Get familiar with the basic concepts of Cloud Foundry-based platforms
            </a>,{' '}
            and what setting up environments looks like.
          </p>
        </div>
      </div>

      <h2 className="govuk-heading-l">Stay up to date</h2>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half">
          <h3 className="govuk-heading-m">Get GOV.UK PaaS status updates</h3>

          <p className="govuk-body">
            <a
              href="https://status.cloud.service.gov.uk/"
              className="govuk-link"
            >
              Check the status of GOV.UK PaaS
            </a>{' '}
            , and see the availability of live applications and
            database connectivity.
          </p>

          <p className="govuk-body">
            We recommend you subscribe to this service to get alerts and
            incident updates.
          </p>
        </div>
      </div>

      <h2 className="govuk-heading-l">Increase the security of your account</h2>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half">
          <h3 className="govuk-heading-m">Set up Google single sign-on</h3>

          <p className="govuk-body">
            GOV.UK PaaS supports Google single sign-on as an authentication
            method.
          </p>

          <p className="govuk-body">
            <a
              href={props.linkTo('account.use-google-sso.view')}
              className="govuk-link"
            >
              Set up Google single sign-on
            </a>
          </p>
        </div>
      </div>
    </>
  );
}

export function EditOrganization(props: IEditOrganizationProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-full">
      <h1 className="govuk-heading-l">
        <span className="govuk-caption-l">
          <span className="govuk-visually-hidden">Organisation</span>{' '}
          {props.organization.name}
        </span>{' '}
        Manage
      </h1>
    </div>

    <div className="govuk-grid-column-one-half">
      <form method="post">
        <input type="hidden" name="_csrf" value={props.csrf} />

        <div className="govuk-form-group">
          <label className="govuk-label govuk-label--m" htmlFor="name">
            Organisation Name
          </label>
          <div id="name-hint" className="govuk-hint">
            This needs to be all lowercase and hyphen separated meaningful name of the organisation.
            You can also refer to the section on the side for some examples.
          </div>
          <input
            className="govuk-input"
            id="name"
            name="name"
            type="text"
            defaultValue={props.organization.name}
            aria-describedby="name-hint"
          />
        </div>

        <div className="govuk-form-group">
          <label className="govuk-label govuk-label--m" htmlFor="owner">
            Owner
          </label>
          <div id="owner-hint" className="govuk-hint">
            Choose an owner from the list. If one you are looking for does not exist, set it to <code>Unknown</code>,
            and ask person on support to add one in place.
          </div>
          <select className="govuk-select" id="owner" name="owner" aria-describedby="owner-hint" required={true}>
            <option selected={props.organization.metadata.annotations.owner === 'Unknown'}>Unknown</option>
            {owners.map(owner =>
              <option key={owner} selected={props.organization.metadata.annotations.owner === owner}>
                {owner}
              </option>)}
          </select>
        </div>

        <div className="govuk-form-group">
          <label className="govuk-label govuk-label--m" htmlFor="quota">
            Select a Quota
          </label>
          <div id="quota-hint" className="govuk-hint">
            The <code>default</code> quota represents a trial account for specific organisation and will not be billed
            for.
          </div>
          <select className="govuk-select" id="quota" name="quota" aria-describedby="quota-hint">
            {props.quotas.map(quota => <option
              key={quota.guid}
              selected={props.organization.relationships.quota.data.guid === quota.guid}
              value={quota.guid}
              >
                {quota.name}
              </option>)}
          </select>
        </div>

        <div className="govuk-form-group">
          <label className="govuk-label govuk-label--m" htmlFor="suspended">
            Organisation Suspension
          </label>
          <div id="suspended-hint" className="govuk-hint">
            By default, an org has the status of <code>Active</code>. An admin can set the status of an org to {}
            <code>Suspended</code> for various reasons such as failure to provide payment or misuse. When an org is {}
            <code>Suspended</code>, users cannot perform certain activities within the org, such as push apps, modify
            spaces, or bind services.
          </div>
          <select className="govuk-select" id="suspended" name="suspended" aria-describedby="suspended-hint">
            <option selected={!props.organization.suspended} value="false">Active</option>
            <option selected={props.organization.suspended} value="true">Suspended</option>
          </select>
        </div>

        <button className="govuk-button" data-module="govuk-button" data-prevent-double-click="true">
          Update Organisation
        </button>
      </form>
    </div>

    <div className="govuk-grid-column-one-half">
      <table className="govuk-table">
        <caption className="govuk-table__caption">Existing quotas</caption>
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th scope="col" className="govuk-table__header">Name</th>
            <th scope="col" className="govuk-table__header">Memory</th>
            <th scope="col" className="govuk-table__header">Routes</th>
            <th scope="col" className="govuk-table__header">Services</th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.quotas.map(quota => <tr className="govuk-table__row" key={quota.guid}>
            <th scope="row" className="govuk-table__header">{quota.name}</th>
            <td className="govuk-table__cell">{bytesToHuman(quota.apps.total_memory_in_mb * MEBIBYTE)}</td>
            <td className="govuk-table__cell">{quota.routes.total_routes}</td>
            <td className="govuk-table__cell">{quota.services.total_service_instances}</td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>;
}

export function EmailManagers(props: IEmailManagersFormProperties): ReactElement {
  return <div className="govuk-grid-row">
    <div className="govuk-grid-column-two-thirds">
      
      <form method="post" noValidate>
        <input type="hidden" name="_csrf" value={props.csrf} />

        {props.errors
          ? <div
              className="govuk-error-summary"
              data-module="govuk-error-summary"
            >
            <div role="alert">
              <h2 className="govuk-error-summary__title">
                  There is a problem
                </h2>
                <div className="govuk-error-summary__body">
                  <ul className="govuk-list govuk-error-summary__list">
                    {props.errors.map((error, index) => (
                      <li key={index}><a href={`#${error.field}`}>{error.message}</a></li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          : null
        }
       <div className={`govuk-form-group ${
            props.errors?.some(e => e.field === 'managerType')
                ? 'govuk-form-group--error'
                : ''
            }`}>
          <fieldset 
            className="govuk-fieldset"
            aria-describedby={
              props.errors?.some(e => e.field === 'managerType')
                ? 'managerType-error'
                : 'managerType-hint'
            }
          >
            <legend className="govuk-fieldset__legend govuk-fieldset__legend--l">
              <h1 className="govuk-fieldset__heading">
              Email managers in {props.organisation.entity.name}
              </h1>
            </legend>
            {props.errors
              ?.filter(error => error.field === 'managerType')
              .map((error, index) => (
                <p
                  key={index}
                  id="managerType-error"
                  className="govuk-error-message"
                >
                  <span className="govuk-visually-hidden">Error:</span>{' '}
                  {error.message}
                </p>
              ))}
            <div id="managerType-hint" className="govuk-hint">
              Select one option.
            </div>
            <div className="govuk-radios" data-module="govuk-radios">
              <div className="govuk-radios__item">
                <input
                  className="govuk-radios__input"
                  id="managerType"
                  name="managerType"
                  type="radio"
                  value="org_manager"
                  defaultChecked={props.values?.managerType === 'org_manager'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="managerType">
                  Email organisation managers
                </label>
              </div>
              <div className="govuk-radios__item">
                <input 
                  className="govuk-radios__input"
                  id="managerType-1"
                  name="managerType"
                  type="radio"
                  value="billing_manager"
                  defaultChecked={props.values?.managerType === 'billing_manager'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="managerType-1">
                  Email billing managers
                </label>
              </div>
              <div className="govuk-radios__item">
                <input 
                  className="govuk-radios__input" 
                  id="managerType-2" name="managerType" 
                  type="radio" value="space_manager"  
                  data-aria-controls="spaces"
                  defaultChecked={props.values?.managerType === 'space_manager'}
                />
                <label className="govuk-label govuk-radios__label" htmlFor="managerType-2">
                  Email space managers
                </label>
              </div>
              <div className="govuk-radios__conditional govuk-radios__conditional--hidden" id="spaces">
                <div className={`govuk-form-group ${
                    props.errors?.some(e => e.field === 'space')
                        ? 'govuk-form-group--error'
                        : ''
                    }`}
                  >
                  <label className="govuk-label" htmlFor="space">
                    Select space
                  </label>
                  {props.errors
                    ?.filter(error => error.field === 'space')
                    .map((error, index) => (
                      <p
                        key={index}
                        id="space-error"
                        className="govuk-error-message"
                      >
                        <span className="govuk-visually-hidden">Error:</span>{' '}
                        {error.message}
                      </p>
                    ))}
                  <select
                   className={`govuk-select ${
                    props.errors?.some(e => e.field === 'space')
                        ? 'govuk-select--error'
                        : ''
                    }`}
                    id="space" name="space"
                    aria-describedby={
                      props.errors?.some(e => e.field === 'space')
                        ? 'space-error'
                        : ''
                    }
                  >
                    <option value="">Select a space</option>
                    {props.spaces.map(space => (
                      <option 
                        key={space.metadata.guid} 
                        value={space.metadata.guid}
                        selected={space.metadata.guid === props.values?.space}
                      >
                        {space.entity.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </fieldset>
        </div>
        <div className="govuk-form-group">
          <label className="govuk-label" htmlFor="subject">Email subject (optional)</label>
          <input className="govuk-input" id="subject" name="subject" type="text" spellCheck="false"   defaultValue={props.values?.subject} />
        </div>
        <div className={`govuk-form-group ${
            props.errors?.some(e => e.field === 'message')
              ? 'govuk-form-group--error'
              : ''
          }`}>
          <label className="govuk-label" htmlFor="message">
            Message
          </label>
          {props.errors
            ?.filter(error => error.field === 'message')
            .map((error, index) => (
              <p
                key={index}
                id="message-error"
                className="govuk-error-message"
              >
                <span className="govuk-visually-hidden">Error:</span>{' '}
                {error.message}
              </p>
            ))}

          <textarea
            className={`govuk-textarea ${
              props.errors?.some(e => e.field === 'message')
                  ? 'govuk-textarea--error'
                  : ''
              }`}
            id="message"
            name="message"
            aria-describedby={
              props.errors?.some(e => e.field === 'message')
                ? 'message-error message-hint'
                : 'message-hint'
            }
            rows={8}
            defaultValue={props.values?.message}
          />
        </div>

        <p className="govuk-body">
        Message will automatically include the following:
        <div id="message-hint" className="govuk-hint">
          You are receiving this email as you are listed as a [manager_type] manager in the [organisation_name] organisation in our [paas_region] region.<br /><br />
          Thank you,<br />
          GOV.UK PaaS
          </div>
        </p>

        <button className="govuk-button" data-module="govuk-button" data-prevent-double-click="true">
          Send
        </button>
      </form>
    </div>
  </div>;
}

export function EmailManagersConfirmationPage(props: EmailManagersConfirmationPageProperties): ReactElement {
  return (
    <div className="govuk-grid-row">
      <div className="govuk-grid-column-two-thirds">
        <div className="govuk-panel govuk-panel--confirmation">
          <h1 className="govuk-panel__title">
            {props.heading}
          </h1>
          <div className="govuk-panel__body">
            {props.text}
          </div>
        </div>

        <p className="govuk-body">{props.children}</p>
      </div>
    </div>
  );
}