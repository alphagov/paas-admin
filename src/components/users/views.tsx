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

export function UserPage(props: IUserPageProps): ReactElement {
  const listOrgs = (orgs: ReadonlyArray<IUserSummaryOrganization>) => orgs.map(org => (
    <li key={org.metadata.guid}>
      <a href={props.linkTo('admin.organizations.view', {organizationGUID: org.metadata.guid})} className="govuk-link">
        {org.entity.name}
      </a>
    </li>
  ));

  return (<>
    <h3 className="govuk-heading-m">
      User
    </h3>

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
      This user is a member of {props.organizations.length} { props.organizations.length === 1 ? 'org' : 'orgs'}.
    </p>
    <ul className="govuk-list govuk-list--bullet">
      {listOrgs(props.organizations)}
    </ul>

    <h3 className="govuk-heading-m">Managed Orgs</h3>
    <p className="govuk-body">
      This user manages {props.managedOrganizations.length } {props.managedOrganizations.length === 1 ? 'org' : 'orgs'}.
    </p>
    <ul className="govuk-list govuk-list--bullet">
      {listOrgs(props.managedOrganizations)}
    </ul>

    <h3 className="govuk-heading-m">
      UAA Groups
    </h3>

    <ul className="govuk-list govuk-list--bullet">
      {props.groups.map(group => (<li key={group.display}><code>{group.display}</code></li>))}
    </ul>
  </>);
}
