import moment from 'moment';
import React, { ReactElement } from 'react';

import { DATE } from '../../layouts';
import {
  IOrganizationQuota,
  IV3OrganizationResource,
} from '../../lib/cf/types';
import { RouteLinker } from '../app/context';

import {
  IBillableByOrganisationAndService,
  IBillableByOrganisationAndSpaceAndService,
  IBillableByService,
} from './controllers';

interface IOrganizationsReportProperties {
  readonly organizations: ReadonlyArray<IV3OrganizationResource>;
  readonly trialOrgs: ReadonlyArray<IV3OrganizationResource>;
  readonly billableOrgs: ReadonlyArray<IV3OrganizationResource>;
  readonly linkTo: RouteLinker;
  readonly orgQuotaMapping: { readonly [key: string]: IOrganizationQuota };
  readonly orgTrialExpirys: { readonly [key: string]: Date };
}

interface ICostable {
  readonly incVAT: number;
  readonly exVAT: number;
  readonly exVATWithAdminFee: number;
}

interface IOrgCostRecord extends ICostable {
  readonly orgGUID: string;
  readonly orgName: string;
  readonly quotaGUID: string;
  readonly quotaName: string;
}

interface IQuotaCostRecord extends ICostable {
  readonly quotaGUID: string;
  readonly quotaName: string;
}

interface ICostReportProperties {
  readonly date: string;
  readonly billableEventCount: number;
  readonly totalBillables: ICostable;
  readonly orgCostRecords: ReadonlyArray<IOrgCostRecord>;
  readonly quotaCostRecords: ReadonlyArray<IQuotaCostRecord>;
}

interface ICostByServiceReport {
  readonly date: string;
  readonly billablesByService: ReadonlyArray<IBillableByService>;
  readonly billablesByOrganisationAndService: ReadonlyArray<
    IBillableByOrganisationAndService
  >;
  readonly billablesByOrganisationAndSpaceAndService: ReadonlyArray<
    IBillableByOrganisationAndSpaceAndService
  >;
}
interface ID3SankeyNode {
  readonly name: string;
}

interface ID3SankeyLink {
  readonly source: number;
  readonly target: number;
  readonly value: number;
}

interface ID3SankeyInput {
  readonly nodes: ReadonlyArray<ID3SankeyNode>;
  readonly links: ReadonlyArray<ID3SankeyLink>;
}

interface IVisualisationPage {
  readonly date: string;
  readonly data?: ID3SankeyInput;
}

interface ISankeyInputProperties {
  readonly data: ID3SankeyInput;
}

class SankeyInput extends React.Component {
  constructor(public readonly props: ISankeyInputProperties) {
    super(props);
  }

  public render(): ReactElement {
    return this.SankeyInputJSON();
  }

  private SankeyInputJSON(): ReactElement {
    return (
      <script
        id="data"
        type="application/json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          // eslint-disable-next-line react/prop-types
          __html: JSON.stringify(this.props.data).replace('/', '/'),
        }}
      ></script>
    );
  }
}

export function OrganizationsReport(
  props: IOrganizationsReportProperties,
): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">Organisations</h1>

      <p className="govuk-body">
        There {props.organizations.length === 1 ? 'is' : 'are'}{' '}
        {props.organizations.length}{' '}
        {props.organizations.length === 1 ? 'organisation' : 'organisations'}.
      </p>

      <h2 className="govuk-heading-m">Trial accounts</h2>

      <p className="govuk-body">
        There {props.trialOrgs.length === 1 ? 'is' : 'are'}{' '}
        {props.trialOrgs.length} trial{' '}
        {props.trialOrgs.length === 1 ? 'organisation' : 'organisations'}.
      </p>

      <p className="govuk-body">Sorted by age; oldest first.</p>

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header">Organisation</th>
            <th className="govuk-table__header">Owner</th>
            <th className="govuk-table__header">Quota</th>
            <th className="govuk-table__header">Creation date</th>
            <th className="govuk-table__header">Status</th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.trialOrgs.map(organization => (
            <tr key={organization.guid} className="govuk-table__row">
              <td className="govuk-table__cell">
                <a
                  href={props.linkTo('admin.organizations.view', {
                    organizationGUID: organization.guid,
                  })}
                  className="govuk-link"
                >
                  {organization.name}
                </a>
              </td>
              <td className="govuk-table__cell">
                {organization.metadata.annotations.owner === undefined
                  ? 'Unknown'
                  : organization.metadata.annotations.owner}
              </td>
              <td className="govuk-table__cell">
                {
                  props.orgQuotaMapping[
                    organization.relationships.quota.data.guid
                  ].entity.name
                }
              </td>
              <td className="govuk-table__cell">
                {moment(organization.created_at).format(DATE)}
              </td>
              <td className="govuk-table__cell">
                {new Date() > props.orgTrialExpirys[organization.guid]
                  ? 'Expired'
                  : 'Expires'}{' '}
                {moment(props.orgTrialExpirys[organization.guid]).fromNow()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="govuk-heading-m">Billable accounts</h2>

      <p className="govuk-body">
        There {props.billableOrgs.length === 1 ? 'is' : 'are'}{' '}
        {props.billableOrgs.length} billable{' '}
        {props.billableOrgs.length === 1 ? 'organisation' : 'organisations'}.
      </p>

      <p className="govuk-body">Sorted by age; newest first.</p>

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header">Organisation</th>
            <th className="govuk-table__header">Owner</th>
            <th className="govuk-table__header">Quota</th>
            <th className="govuk-table__header">Creation date</th>
            <th className="govuk-table__header">Time since creation</th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.billableOrgs.map(organization => (
            <tr key={organization.guid} className="govuk-table__row">
              <td className="govuk-table__cell">
                <a
                  href={props.linkTo('admin.organizations.view', {
                    organizationGUID: organization.guid,
                  })}
                  className="govuk-link"
                >
                  {organization.name}
                </a>
              </td>
              <td className="govuk-table__cell">
                {organization.metadata.annotations.owner === undefined
                  ? 'Unknown'
                  : organization.metadata.annotations.owner}
              </td>
              <td className="govuk-table__cell">
                {
                  props.orgQuotaMapping[
                    organization.relationships.quota.data.guid
                  ].entity.name
                }
              </td>
              <td className="govuk-table__cell">
                {moment(organization.created_at).format(DATE)}
              </td>
              <td className="govuk-table__cell">
                Created {moment(organization.created_at).fromNow()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function CostReport(props: ICostReportProperties): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">Billables for {props.date}</h1>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-quarter">
          <h2 className="govuk-heading-m">
            {props.billableEventCount}{' '}
            <span className="govuk-caption-m">Billable events</span>
          </h2>
        </div>
        <div className="govuk-grid-column-one-quarter">
          <h2 className="govuk-heading-m">
            £{props.totalBillables.incVAT.toFixed(2)}{' '}
            <span className="govuk-caption-m">Total including VAT</span>
          </h2>
        </div>
        <div className="govuk-grid-column-one-quarter">
          <h2 className="govuk-heading-m">
            £{props.totalBillables.exVAT.toFixed(2)}{' '}
            <span className="govuk-caption-m">Total excluding VAT</span>
          </h2>
        </div>
        <div className="govuk-grid-column-one-quarter">
          <h2 className="govuk-heading-m">
            £{props.totalBillables.exVATWithAdminFee.toFixed(2)}{' '}
            <span className="govuk-caption-m">Total excluding VAT including fee</span>
          </h2>
        </div>
      </div>

      <h1 className="govuk-heading-l">
        Billables by organisation for {props.date}
      </h1>

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header" scope="col">
              Organization
            </th>
            <th className="govuk-table__header" scope="col">
              Quota
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Including VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT including fee
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.orgCostRecords.map(record => (
            <tr key={record.orgGUID} className="govuk-table__row">
              <th className="govuk-table__header" scope="row">
                {record.orgName}
              </th>
              <td className="govuk-table__cell">{record.quotaName}</td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.incVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVATWithAdminFee.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot />
      </table>

      <h1 className="govuk-heading-l">Billables by quota for {props.date}</h1>

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header" scope="col">
              Quota
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Including VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT including fee
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.quotaCostRecords.map(record => (
            <tr key={record.quotaGUID} className="govuk-table__row">
              <th className="govuk-table__header" scope="row">
                {record.quotaName}
              </th>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.incVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVATWithAdminFee.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export function CostByServiceReport(props: ICostByServiceReport): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">Billables by service for {props.date}</h1>

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header" scope="col">
              Service
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Including VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT including fee
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.billablesByService.map(record => (
            <tr key={record.serviceGroup} className="govuk-table__row">
              <td className="govuk-table__cell">{record.serviceGroup}</td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.incVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVATWithAdminFee.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot />
      </table>

      <h1 className="govuk-heading-l">
        Billables by organisation and service for {props.date}
      </h1>

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header" scope="col">
              Organization
            </th>
            <th className="govuk-table__header" scope="col">
              Service
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Including VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT including fee
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.billablesByOrganisationAndService.map(record => (
            <tr key={record.orgGUID} className="govuk-table__row">
              <td className="govuk-table__cell">
                {record.orgName}
              </td>
              <td className="govuk-table__cell">{record.serviceGroup}</td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.incVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVATWithAdminFee.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot />
      </table>

      <h1 className="govuk-heading-l">
        Billables by organisation and space and service for {props.date}
      </h1>

      <table className="govuk-table">
        <thead className="govuk-table__head">
          <tr className="govuk-table__row">
            <th className="govuk-table__header" scope="col">
              Organization
            </th>
            <th className="govuk-table__header" scope="col">
              Space
            </th>
            <th className="govuk-table__header" scope="col">
              Service
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Including VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT
            </th>
            <th
              className="govuk-table__header govuk-table__header--numeric"
              scope="col"
            >
              Excluding VAT including fee
            </th>
          </tr>
        </thead>
        <tbody className="govuk-table__body">
          {props.billablesByOrganisationAndSpaceAndService.map(record => (
            <tr key={record.spaceGUID} className="govuk-table__row">
              <td className="govuk-table__cell">
                {record.orgName}
              </td>
              <td className="govuk-table__cell">{record.spaceName}</td>
              <td className="govuk-table__cell">{record.serviceGroup}</td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.incVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVAT.toFixed(2)}
              </td>
              <td className="govuk-table__cell govuk-table__cell--numeric">
                £{record.exVATWithAdminFee.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot />
      </table>
    </>
  );
}

export function VisualisationPage(props: IVisualisationPage): ReactElement {
  return (
    <>
      <h1 className="govuk-heading-l">Billing flow for {props.date}</h1>

      {props.data ? (
        <>
          <SankeyInput data={props.data} />
          <svg id="sankey" className="sankey-box"></svg>
          <script src="/assets/d3.min.js"></script>
          <script src="/assets/d3-sankey.min.js"></script>
          <script src="/assets/sankey.js"></script>
        </>
      ) : (
        <h2 className="govuk-heading-m">No data for {props.date}</h2>
      )}
    </>
  );
}
