import React, { ReactElement } from 'react';

import { IOrganization, IOrganizationQuota } from '../../lib/cf/types';
import { RouteLinker } from '../app';

interface IOrganizationProperties {
  readonly guid: string;
  readonly name: string;
  readonly billable: boolean;
  readonly linkTo: RouteLinker;
}

interface IOrganizationPageProperties {
  readonly organizations: ReadonlyArray<IOrganization>;
  readonly linkTo: RouteLinker;
  readonly quotas: { readonly [guid: string]: IOrganizationQuota };
}

export function Organization(props: IOrganizationProperties): ReactElement {
  return (
    <tr className="govuk-table__row">
      <td className="govuk-table__cell">
        <a
          href={props.linkTo('admin.organizations.view', {
            organizationGUID: props.guid,
          })}
          className="govuk-link"
        >
          {props.name}
        </a>
      </td>
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

      <p className="govuk-body">
        To request new GOV.UK PaaS organisations,{' '}
        <a
          href="https://www.cloud.service.gov.uk/signup"
          className="govuk-link"
        >
          visit our signup page
        </a>
        .
      </p>

      <hr className="govuk-section-break govuk-section-break--m" />

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-full">
          <h1 className="govuk-heading-l">Get started with the command line</h1>

          <p className="govuk-body">
            Installing the Cloud Foundry command line will let you operate
            GOV.UK PaaS from your computer terminal.
          </p>

          <h2 className="govuk-heading-m">
            Download the Cloud Foundry command line tool
          </h2>
        </div>

        <div className="govuk-grid-column-one-third">
          <h3 className="govuk-heading-s">Linux</h3>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=redhat64&source=github"
              className="govuk-link"
            >
              Download the RedHat version
            </a>
          </p>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=debian64&source=github"
              className="govuk-link"
            >
              Download the Debian version
            </a>
          </p>
        </div>

        <div className="govuk-grid-column-one-third">
          <h3 className="govuk-heading-s">macOS</h3>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=macosx64&source=github"
              className="govuk-link"
            >
              Download the macOS version
            </a>
          </p>
        </div>

        <div className="govuk-grid-column-one-third">
          <h3 className="govuk-heading-s">Windows</h3>
          <p className="govuk-body">
            <a
              href="https://packages.cloudfoundry.org/stable?release=windows64&source=github"
              className="govuk-link"
            >
              Download the Windows version
            </a>
          </p>
        </div>
      </div>

      <p className="govuk-body">
        For more information about the Cloud Foundry command line tool, or to
        view the source code{' '}
        <a
          href="https://github.com/cloudfoundry/cli#downloads"
          className="govuk-link"
        >
          visit the GitHub page
        </a>
        .
      </p>

      <h1 className="govuk-heading-l">Once you’ve installed the CF CLI</h1>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half">
          <h2 className="govuk-heading-m">Set up and deploy your first app</h2>

          <p className="govuk-body">
            <a
              href="https://docs.cloud.service.gov.uk/get_started.html#set-up-the-cloud-foundry-command-line"
              className="govuk-link"
            >
              View our guide
            </a>{' '}
            on logging in and deploying your first app to GOV.UK PaaS.
          </p>
        </div>

        <div className="govuk-grid-column-one-half">
          <h2 className="govuk-heading-m">Learn more about orgs and spaces</h2>

          <p className="govuk-body">
            <a
              href="https://docs.cloud.service.gov.uk/orgs_spaces_users.html"
              className="govuk-link"
            >
              Get familiar
            </a>{' '}
            with the basic concepts of Cloud Foundry-based platforms, and what
            setting up environments looks like.
          </p>
        </div>
      </div>

      <h1 className="govuk-heading-l">Stay up to date</h1>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half">
          <h2 className="govuk-heading-m">Get GOV.UK PaaS status updates</h2>

          <p className="govuk-body">
            <a
              href="https://status.cloud.service.gov.uk/"
              className="govuk-link"
            >
              Check the status
            </a>{' '}
            of GOV.UK PaaS, and see the availability of live applications and
            database connectivity.
          </p>

          <p className="govuk-body">
            We recommend you subscribe to this service to get alerts and
            incident updates.
          </p>
        </div>
      </div>

      <h1 className="govuk-heading-l">Increase the security of your account</h1>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half">
          <h2 className="govuk-heading-m">Set up Google single sign-on</h2>

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
