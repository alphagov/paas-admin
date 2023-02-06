import { add, format } from 'date-fns';
import lodash, { Dictionary, flatMap, groupBy, sum, sumBy, uniq } from 'lodash';
import React from 'react';

import { Template } from '../../layouts';
import { BillingClient } from '../../lib/billing';
import { IBillableEvent } from '../../lib/billing/types';
import CloudFoundryClient from '../../lib/cf';
import {
  IOrganization,
  IOrganizationQuota,
  ISpace,
  IV3OrganizationResource,
} from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';

import {
  CostByServiceReport,
  CostReport,
  OrganizationsReport,
  VisualisationPage,
} from './views';

const DATE = 'yyyy-MM-dd';

interface ICostable {
  readonly incVAT: number;
  readonly exVAT: number;
  readonly exVATWithAdminFee: number;
}

type ICostSummary = ICostable;

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

export interface IBillableByService {
  readonly serviceGroup: string;
  readonly incVAT: number;
  readonly exVAT: number;
  readonly exVATWithAdminFee: number;
}

export interface IBillableByOrganisation {
  readonly org: IV3OrganizationResource;
  readonly exVAT: number;
  readonly exVATWithAdminFee: number;
}

export interface IBillableByOrganisationAndService extends IBillableByService {
  readonly orgGUID: string;
  readonly orgName: string;
}

export interface IBillableByOrganisationAndSpaceAndService
  extends IBillableByOrganisationAndService {
  readonly spaceGUID: string;
  readonly spaceName: string;
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

interface IOrgAndOwner {
  readonly org: string;
  readonly owner: string;
}

function trialExpiryDate(creation: Date): Date {
  return add(new Date(creation), { days: 90 });
}

export function buildD3SankeyInput(
  billables: ReadonlyArray<IBillableByOrganisationAndService>,
  organisationsByOwner: ReadonlyArray<IOrgAndOwner>,
): ID3SankeyInput {
  const services = uniq(billables.map(x => x.serviceGroup));
  const orgNames = uniq(billables.map(x => x.orgName));
  const organisationsByOwnerWithBills = organisationsByOwner.filter(x =>
    orgNames.includes(x.org),
  );
  const owners = uniq(organisationsByOwnerWithBills.map(x => x.owner));
  const nodes = [...services, ...orgNames, ...owners];

  if (nodes.length - owners.length === 0) {
    return { links: [], nodes: [] };
  }

  const nodeIndexByName = nodes.reduce(
    (acc, x, index) => ({ ...acc, [x]: index }),
    {},
  ) as { readonly [_: string]: number };

  const billableLinks = billables.map(x => ({
    source: nodeIndexByName[x.serviceGroup],
    target: nodeIndexByName[x.orgName],
    value: x.exVAT,
  }));

  const ownerLinks = organisationsByOwnerWithBills.map(orgOwner => ({
    source: nodeIndexByName[orgOwner.org],
    target: nodeIndexByName[orgOwner.owner],
    value: sum(
      billables
        .filter(billable => billable.orgName === orgOwner.org)
        .map(billable => billable.exVAT),
    ),
  }));

  return {
    links: [...billableLinks, ...ownerLinks],
    nodes: nodes.map(x => ({ name: x })),
  };
}

export function sumRecords(records: ReadonlyArray<IBillableEvent>, adminFee: number): ICostSummary {
  const { exVAT, incVAT } = records.reduce((totals, record) => {
    return {
      exVAT: totals.exVAT + record.price.exVAT,
      incVAT: totals.incVAT + record.price.incVAT,
    };
  }, { exVAT: 0, incVAT: 0 });

  return { exVAT, exVATWithAdminFee: exVAT * (1 + adminFee), incVAT };
}

export function aggregateBillingEvents(
  billableEvents: ReadonlyArray<IBillableEvent>,
): { readonly [key: string]: ReadonlyArray<IBillableEvent> } {
  return billableEvents.reduce(
    (
      accumulator: { readonly [key: string]: ReadonlyArray<IBillableEvent> },
      billableEvent: IBillableEvent,
    ) => {
      const accEvents = accumulator[billableEvent.orgGUID] || [];

      return {
        ...accumulator,
        [billableEvent.orgGUID]: accEvents.concat([billableEvent]),
      };
    },
    {},
  );
}

export function createOrgCostRecords(
  orgs: ReadonlyArray<IOrganization>,
  orgQuotas: { readonly [key: string]: IOrganizationQuota },
  orgBillableEvents: { readonly [key: string]: ReadonlyArray<IBillableEvent> },
  adminFee: number,
): ReadonlyArray<IOrgCostRecord> {
  return orgs.map(org => {
    const quota = orgQuotas[org.metadata.guid];
    const billableEvents = orgBillableEvents[org.metadata.guid] || [];

    const incVAT = billableEvents.reduce((acc: number, e: IBillableEvent) => acc + e.price.incVAT, 0);
    const exVAT = billableEvents.reduce((acc: number, e: IBillableEvent) => acc + e.price.exVAT, 0);
    const exVATWithAdminFee = exVAT * (1 + adminFee);

    return {
      exVAT, exVATWithAdminFee,
      incVAT,
      orgGUID: org.metadata.guid,
      orgName: org.entity.name,
      quotaGUID: quota.metadata.guid,
      quotaName: quota.entity.name,
    };
  });
}

export function createQuotaCostRecords(
  records: ReadonlyArray<IOrgCostRecord>,
): ReadonlyArray<IQuotaCostRecord> {
  const costsByQuota = records.reduce(
    (
      accumulator: { readonly [key: string]: IQuotaCostRecord },
      record: IOrgCostRecord,
    ) => {
      const accumulatedRecord = accumulator[record.quotaGUID];
      const currentIncVAT = accumulatedRecord ? accumulatedRecord.incVAT : 0;
      const currentExVAT = accumulatedRecord ? accumulatedRecord.exVAT : 0;
      const currentExVATWithAdminFee = accumulatedRecord ? accumulatedRecord.exVATWithAdminFee : 0;

      const incVAT = currentIncVAT + record.incVAT;
      const exVAT = currentExVAT + record.exVAT;
      const exVATWithAdminFee = currentExVATWithAdminFee + (record.exVATWithAdminFee);

      const quota = {
        exVAT, exVATWithAdminFee, incVAT,
        quotaGUID: record.quotaGUID,
        quotaName: record.quotaName,
      };

      return { ...accumulator, [record.quotaGUID]: quota };
    },
    {},
  );

  return Object.values(costsByQuota);
}

function compareOrgName(a: { readonly orgName: string }, b: { readonly orgName: string }): number {
  return a.orgName.localeCompare(b.orgName);
}

function compareSpaceName(a: { readonly spaceName: string }, b: { readonly spaceName: string }): number {
  return a.spaceName.localeCompare(b.spaceName);
}

function comparePriceIncVAT(a: { readonly incVAT: number }, b: { readonly incVAT: number }): number {
  return b.incVAT - a.incVAT;
}

export function filterRealOrgs(
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  return orgs.filter(org => {
    if (org.name.match(/^(CATS|ACC|BACC|SMOKE|PERF)-/)) {
      return false;
    }

    return true;
  });
}

function filterTrialOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  const trialOrgs = orgs.filter(
    o => o.relationships.quota.data.guid === trialQuotaGUID,
  );

  // return the oldest orgs first
  return lodash.sortBy(trialOrgs, o => new Date(o.created_at));
}

export function filterBillableOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  const billableOrgs = orgs.filter(
    o => o.relationships.quota.data.guid !== trialQuotaGUID,
  );

  // return the newest orgs first (reverse)
  return lodash.sortBy(billableOrgs, o => new Date(o.created_at)).reverse();
}

export function getBillablesByOrganisation(
  orgs: ReadonlyArray<IV3OrganizationResource>,
  billableEvents: ReadonlyArray<IBillableEvent>,
  adminFee: number,
): ReadonlyArray<IBillableByOrganisation> {
  const billableEventsByOrganisation = groupBy(billableEvents, e => e.orgGUID);

  return orgs.map(org => {
    const exVAT = sumBy(billableEventsByOrganisation[org.guid], x => x.price.exVAT) || 0;
    const exVATWithAdminFee = exVAT * (1 + adminFee);

    return {
      exVAT, exVATWithAdminFee,
      org,
    };
  });
}

export const testable = {
  filterBillableOrgs,
  filterRealOrgs,
  filterTrialOrgs,
  trialExpiryDate,
};

function getServiceGroup(billableEvent: IBillableEvent): string {
  const details = billableEvent.price.details;
  if (details.length < 1) {
    return 'unknown';
  }
  const firstPlan = details[0].planName;
  const planPrefix = firstPlan.split(' ')[0];

  switch (planPrefix) {
    case 'task':
    case 'staging':
    case 'app':
      return 'compute';
    default:
      return planPrefix;
  }
}

export function getBillableEventsByService(
  billableEvents: ReadonlyArray<IBillableEvent>,
  adminFee: number,
): ReadonlyArray<IBillableByService> {
  const billableEventsByService = Object.entries(
    groupBy(billableEvents, getServiceGroup),
  );

  return billableEventsByService
    .map(([serviceGroup, billableEventsForService]) => {
      const incVAT = sumBy(billableEventsForService, x => x.price.incVAT);
      const exVAT = sumBy(billableEventsForService, x => x.price.exVAT);
      const exVATWithAdminFee = exVAT * (1 + adminFee);

      return { exVAT, exVATWithAdminFee, incVAT, serviceGroup };
    })
    .sort(comparePriceIncVAT)
  ;
}

export function getBillableEventsByOrganisationAndService(
  billableEvents: ReadonlyArray<IBillableEvent>,
  orgsByGUID: Dictionary<ReadonlyArray<IV3OrganizationResource>>,
  adminFee: number,
): ReadonlyArray<IBillableByOrganisationAndService> {
  const billableEventsByOrgGUID = Object.entries(
    groupBy(billableEvents, x => x.orgGUID),
  );

  return flatMap(billableEventsByOrgGUID, ([orgGUID, billableEventsForOrg]) => {
    const org = (orgsByGUID[orgGUID] || [])[0];
    const orgName = org ? org.name : 'unknown';

    return getBillableEventsByService(billableEventsForOrg, adminFee).map(x => ({
      ...x,
      orgGUID,
      orgName,
    }));
  }).sort((a, b) => compareOrgName(a, b) || comparePriceIncVAT(a, b));
}

export function getBillableEventsByOrganisationAndSpaceAndService(
  billableEvents: ReadonlyArray<IBillableEvent>,
  orgsByGUID: Dictionary<ReadonlyArray<IV3OrganizationResource>>,
  spacesByGUID: Dictionary<ReadonlyArray<ISpace>>,
  adminFee: number,
): ReadonlyArray<IBillableByOrganisationAndSpaceAndService> {
  const billableEventsByOrgGUID = Object.entries(
    groupBy(billableEvents, x => x.orgGUID),
  );

  return flatMap(billableEventsByOrgGUID, ([orgGUID, billableEventsForOrg]) => {
    const org = (orgsByGUID[orgGUID] || [])[0];
    const orgName = org ? org.name : 'unknown';
    const orgBillableEventsBySpaceGUID = Object.entries(
      groupBy(billableEventsForOrg, x => x.spaceGUID),
    );

    return flatMap(
      orgBillableEventsBySpaceGUID,
      ([spaceGUID, billableEventsForSpace]) => {
        const space = (spacesByGUID[spaceGUID] || [])[0];
        const spaceName = space ? space.entity.name : 'unknown';

        return getBillableEventsByService(billableEventsForSpace, adminFee).map(x => ({
          ...x,
          orgGUID,
          orgName,
          spaceGUID,
          spaceName,
        }));
      },
    );
  }).sort(
    (a, b) =>
      compareOrgName(a, b) ||
      compareSpaceName(a, b) ||
      comparePriceIncVAT(a, b),
  );
}

function getFirstBillableEventQuotaGUID(billableEvents: ReadonlyArray<IBillableEvent>): string | undefined {
  return billableEvents && billableEvents[0] && billableEvents[0].quotaGUID;
}

export async function viewPmoOrgSpendReportCSV(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = new Date(params.rangeStart);
  const rangeStop = add(new Date(rangeStart), { months: 1 });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const billingClient = new BillingClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.billingAPI,
    logger: ctx.app.logger,
  });

  const trialQuotaCandidates = await cf.quotaDefinitions({ name: 'default' });
  /* istanbul ignore next */
  if (trialQuotaCandidates.length !== 1) {
    throw new Error('Could not find default quota');
  }
  const trialQuotaGUID = trialQuotaCandidates[0].metadata.guid;

  const realOrgs = filterRealOrgs(await cf.v3Organizations());
  const billableOrgs = filterBillableOrgs(trialQuotaGUID, realOrgs);

  const billableOrgsByGUID = groupBy(billableOrgs, x => x.guid);
  const billableOrgGUIDs = Object.keys(billableOrgsByGUID);
  const billableEvents = await billingClient.getBillableEvents({
    orgGUIDs: billableOrgGUIDs,
    rangeStart: rangeStart,
    rangeStop: rangeStop,
  });
  const billablesByOrganisation = getBillablesByOrganisation(
    billableOrgs,
    billableEvents,
    ctx.app.adminFee,
  );

  const nameMonth = format(rangeStart, 'yyyy-MM');
  const nameLocation = ctx.app.location.toLowerCase();

  const csvData = [
    ['Billing month', 'Org', 'Region', 'Unique ID', 'Spend in GBP without VAT'],
    ...billablesByOrganisation.map(billablesForOrg => [
      format(rangeStart, 'MMMM yyyy'),
      billablesForOrg.org.name,
      ctx.app.location,
      billablesForOrg.org.guid,
      (
        billablesForOrg.exVAT +
        billablesForOrg.exVAT * ctx.app.adminFee
      ).toFixed(2),
    ]),
  ];

  return {
    download: {
      data: csvData.map(line => line.join(',')).join('\n'),
      name: `paas-pmo-org-spend-${nameLocation}-${nameMonth}.csv`,
    },
    mimeType: 'text/csv',
  };
}

export async function viewVisualisation(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = new Date(params.rangeStart);
  const rangeStop = add(rangeStart, { months: 1 });

  const billingClient = new BillingClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.billingAPI,
    logger: ctx.app.logger,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgs = (await cf.v3Organizations()).filter(
    org => !org.name.match(/^(CAT|SMOKE|PERF|B?ACC)/),
  );

  const orgsByGUID = groupBy(orgs, x => x.guid);
  const orgGUIDs = Object.keys(orgsByGUID);

  const billableEvents = await billingClient.getBillableEvents({
    orgGUIDs,
    rangeStart: rangeStart,
    rangeStop: rangeStop,
  });

  const billablesByOrganisationAndService = getBillableEventsByOrganisationAndService(
    billableEvents,
    orgsByGUID,
    ctx.app.adminFee,
  );
  /* istanbul ignore next */
  const organisationsByOwner = orgs.map(x => ({
    org: x.name,
    owner: x.metadata.annotations.owner || 'Other',
  }));
  const data = buildD3SankeyInput(
    billablesByOrganisationAndService,
    organisationsByOwner,
  );

  const template = new Template(ctx.viewContext, 'Costs Report Visualisation');
  template.subnav = {
    items: [
      {
        link: ctx.linkTo('admin.reports.cost', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'Summary',
      },
      {
        link: ctx.linkTo('admin.reports.costbyservice', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'By service',
      },
      {
        active: true,
        link: ctx.linkTo('admin.reports.visualisation', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'Visualisation',
      },
    ],
  };

  return {
    body: template.render(
      <VisualisationPage
        date={format(rangeStart, 'MMMM yyyy')}
        data={data.nodes.length > 0 ? data : undefined}
      />,
    ),
  };
}

export async function viewCostByServiceReport(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = new Date(params.rangeStart);
  const rangeStop = add(rangeStart, { months: 1 });

  const billingClient = new BillingClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.billingAPI,
    logger: ctx.app.logger,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgs = (await cf.v3Organizations()).filter(
    org => !org.name.match(/^(CAT|SMOKE|PERF|ACC|BACC)/),
  );
  const orgsByGUID = groupBy(orgs, x => x.guid);
  const orgGUIDs = Object.keys(orgsByGUID);

  const billableEvents = await billingClient.getBillableEvents({
    orgGUIDs,
    rangeStart: rangeStart,
    rangeStop: rangeStop,
  });

  const spaces = await cf.spaces();
  const spacesByGUID = groupBy(spaces, x => x.metadata.guid);

  const billablesByService = getBillableEventsByService(billableEvents, ctx.app.adminFee);
  const billablesByOrganisationAndService = getBillableEventsByOrganisationAndService(
    billableEvents,
    orgsByGUID,
    ctx.app.adminFee,
  );
  const billablesByOrganisationAndSpaceAndService = getBillableEventsByOrganisationAndSpaceAndService(
    billableEvents,
    orgsByGUID,
    spacesByGUID,
    ctx.app.adminFee,
  );

  const template = new Template(ctx.viewContext, 'Costs By Service Report');
  template.subnav = {
    items: [
      {
        link: ctx.linkTo('admin.reports.cost', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'Summary',
      },
      {
        active: true,
        link: ctx.linkTo('admin.reports.costbyservice', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'By service',
      },
      {
        link: ctx.linkTo('admin.reports.visualisation', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'Visualisation',
      },
    ],
  };

  return {
    body: template.render(
      <CostByServiceReport
        date={format(rangeStart, 'MMMM yyyy')}
        billablesByService={billablesByService}
        billablesByOrganisationAndService={billablesByOrganisationAndService}
        billablesByOrganisationAndSpaceAndService={
          billablesByOrganisationAndSpaceAndService
        }
      />,
    ),
  };
}

export async function viewOrganizationsReport(
  ctx: IContext,
  _params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const trialQuotaCandidates = await cf.quotaDefinitions({ name: 'default' });

  if (trialQuotaCandidates.length !== 1) {
    throw new Error('Could not find default quota');
  }

  const organizations = filterRealOrgs(await cf.v3Organizations());

  const orgQuotaGUIDs = lodash.uniq(
    organizations.map(o => o.relationships.quota.data.guid),
  );

  const orgQuotas = await Promise.all(
    orgQuotaGUIDs.map(async g => await cf.organizationQuota(g)),
  );

  const trialQuotaGUID = trialQuotaCandidates[0].metadata.guid;
  const trialOrgs = filterTrialOrgs(trialQuotaGUID, organizations);
  const billableOrgs = filterBillableOrgs(trialQuotaGUID, organizations);

  const orgQuotaMapping: { readonly [key: string]: IOrganizationQuota } = lodash.keyBy(
    orgQuotas,
    q => q.metadata.guid,
  );

  const orgTrialExpirys: { readonly [key: string]: Date } = lodash
    .chain(trialOrgs)
    .keyBy(org => org.guid)
    .mapValues(org => trialExpiryDate(new Date(org.created_at)))
    .value();

  const template = new Template(ctx.viewContext, 'Organisations Report');

  return {
    body: template.render(
      <OrganizationsReport
        linkTo={ctx.linkTo}
        organizations={organizations}
        trialOrgs={trialOrgs}
        billableOrgs={billableOrgs}
        orgQuotaMapping={orgQuotaMapping}
        orgTrialExpirys={orgTrialExpirys}
      />,
    ),
  };
}

export async function viewCostReport(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = new Date(params.rangeStart);
  const rangeStop = add(rangeStart, { months: 1 });

  const serviceFilter = (billableEvent: IBillableEvent): boolean =>
    billableEvent.price.details.some(details =>
      details.planName.includes(params.service),
    );

  const billingClient = new BillingClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.billingAPI,
    logger: ctx.app.logger,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgs = (await cf.organizations()).filter(org => {
    const name = org.entity.name;

    // ignore orgs used by tests
    return !name.match(/^(CAT|SMOKE|PERF|ACC)/);
  });
  const orgGUIDs = orgs.map(o => o.metadata.guid);

  const originalBillableEvents = await billingClient.getBillableEvents({
    orgGUIDs,
    rangeStart: rangeStart,
    rangeStop: rangeStop,
  });

  const billableEvents = params.service ? originalBillableEvents.filter(serviceFilter) : originalBillableEvents;

  const orgBillableEvents = aggregateBillingEvents(billableEvents);

  const orgQuotas: { readonly [key: string]: IOrganizationQuota } = (
    await Promise.all(
      orgs.map(async (org: IOrganization) => {
        const orgQuotaGUID =
          getFirstBillableEventQuotaGUID(
            orgBillableEvents[org.metadata.guid],
          ) || org.entity.quota_definition_guid;
        const quota = await cf.organizationQuota(orgQuotaGUID);

        return { [org.metadata.guid]: quota };
      }),
    )
  ).reduce(
    /* istanbul ignore next */ (accumulator, quota) => {
      return { ...accumulator, ...quota };
    },
  );

  const orgCostRecords = createOrgCostRecords(
    orgs,
    orgQuotas,
    orgBillableEvents,
    ctx.app.adminFee,
  );
  const quotaCostRecords = createQuotaCostRecords(orgCostRecords);

  const totalBillables = sumRecords(billableEvents, ctx.app.adminFee);
  const billableEventCount = billableEvents.length;

  const template = new Template(ctx.viewContext, 'Costs Report');
  template.subnav = {
    items: [
      {
        active: true,
        link: ctx.linkTo('admin.reports.cost', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'Summary',
      },
      {
        link: ctx.linkTo('admin.reports.costbyservice', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'By service',
      },
      {
        link: ctx.linkTo('admin.reports.visualisation', {
          rangeStart: format(rangeStart, DATE),
        }),
        text: 'Visualisation',
      },
    ],
  };

  return {
    body: template.render(
      <CostReport
        date={format(rangeStart, 'MMMM yyyy')}
        billableEventCount={billableEventCount}
        totalBillables={totalBillables}
        orgCostRecords={Object.values(orgCostRecords)}
        quotaCostRecords={quotaCostRecords}
      />,
    ),
  };
}
