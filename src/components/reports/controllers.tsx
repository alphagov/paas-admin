import lodash, {Dictionary, flatMap, groupBy, sum, sumBy, uniq} from 'lodash';
import moment from 'moment';
import React from 'react';

import { Template } from '../../layouts';
import { BillingClient } from '../../lib/billing';
import CloudFoundryClient from '../../lib/cf';
import { IOrganization, IOrganizationQuota, ISpace, IV3OrganizationResource } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';

import { CostByServiceReport, CostReport, OrganizationsReport, VisualisationPage } from './views';

const DATE = 'YYYY-MM-DD';

interface ICostable {
  readonly incVAT: number;
  readonly exVAT: number;
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
  serviceGroup: string;
  incVAT: number;
  exVAT: number;
}

export interface IBillableByOrganisation {
  org: IV3OrganizationResource;
  exVAT: number;
}

export interface IBillableByOrganisationAndService extends IBillableByService {
  orgGUID: string;
  orgName: string;
}

export interface IBillableByOrganisationAndSpaceAndService extends IBillableByOrganisationAndService {
  spaceGUID: string;
  spaceName: string;
}

interface ID3SankeyNode {
  name: string;
}

interface ID3SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface ID3SankeyInput {
  nodes: ReadonlyArray<ID3SankeyNode>;
  links: ReadonlyArray<ID3SankeyLink>;
}

interface IOrgAndOwner {
  org: string;
  owner: string;
}

function trialExpiryDate(creation: Date): Date {
  return moment(creation).add(90, 'days').toDate();
}

export function filterRealOrgs(
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  return orgs
  .filter(org => {
    if (org.name.match(/^(CATS|ACC|BACC|SMOKE|PERF)-/)) {
      return false;
    }

    if (org.name === 'admin') {
      return false;
    }

    return true;
  })
  ;
}

function filterTrialOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  const trialOrgs = orgs.filter(
    o => o.relationships.quota.data.guid === trialQuotaGUID,
  );

  // return the oldest orgs first
  return lodash
    .sortBy(trialOrgs, o => new Date(o.created_at))
  ;
}

export function filterBillableOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  const billableOrgs = orgs.filter(
    o => o.relationships.quota.data.guid !== trialQuotaGUID,
  );

  // return the newest orgs first (reverse)
  return lodash
    .sortBy(billableOrgs, o => new Date(o.created_at))
    .reverse()
  ;
}

export function getBillablesByOrganisation(
  orgs: ReadonlyArray<IV3OrganizationResource>,
  billableEvents: ReadonlyArray<IBillableEvent>,
): ReadonlyArray<IBillableByOrganisation> {
const billableEventsByOrganisation = groupBy(billableEvents, e => e.orgGUID);
return orgs.map((org) => ({
  org,
  exVAT: sumBy(billableEventsByOrganisation[org.guid], x => x.price.exVAT) || 0,
}));
}

export const testable = {
  trialExpiryDate,
  filterRealOrgs, filterTrialOrgs, filterBillableOrgs,
};

export async function viewOrganizationsReport(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const trialQuotaCandidates = await cf.quotaDefinitions({ name: 'default'});

  if (trialQuotaCandidates.length !== 1) {
    throw new Error('Could not find default quota');
  }

  const organizations = filterRealOrgs(await cf.v3Organizations());

  const orgQuotaGUIDs = lodash.uniq(
    organizations.map(o => o.relationships.quota.data.guid),
  );

  const orgQuotas = await Promise.all(
    orgQuotaGUIDs.map(g => cf.organizationQuota(g)),
  );

  const trialQuotaGUID = trialQuotaCandidates[0].metadata.guid;
  const trialOrgs = filterTrialOrgs(trialQuotaGUID, organizations);
  const billableOrgs = filterBillableOrgs(trialQuotaGUID, organizations);

  const orgQuotaMapping: {[key: string]: IOrganizationQuota} = lodash
    .keyBy(orgQuotas, q => q.metadata.guid)
  ;

  const orgTrialExpirys: {[key: string]: Date} = lodash
    .chain(trialOrgs)
    .keyBy(org => org.guid)
    .mapValues(org => trialExpiryDate(new Date(org.created_at)))
    .value()
  ;

  const template = new Template(ctx.viewContext, `Organizations Report`);

  return {
    body: template.render(<OrganizationsReport
      linkTo={ctx.linkTo}
      organizations={organizations}
      trialOrgs={trialOrgs}
      billableOrgs={billableOrgs}
      orgQuotaMapping={orgQuotaMapping}
      orgTrialExpirys={orgTrialExpirys}
    />),
  };
}

function getFirstBillableEventQuotaGUID(billableEvents: ReadonlyArray<IBillableEvent>): string | undefined {
  return billableEvents && billableEvents[0] && billableEvents[0].quotaGUID;
}

export async function viewCostReport(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, DATE);
  const rangeStop  = moment(rangeStart).add(1, 'month');

  let serviceFilter = (_: IBillableEvent) => true;
  if (params.service) {
    serviceFilter = (billableEvent: IBillableEvent) => billableEvent.price.details.some(
      details => details.planName.includes(params.service),
    );
  }

  const billingClient = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    accessToken: ctx.token.accessToken,
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
    return !(name.match(/^(CAT|SMOKE|PERF|ACC)/));
  });
  const orgGUIDs = orgs.map(o => o.metadata.guid);

  const billableEvents = await billingClient.getBillableEvents({
    rangeStart: rangeStart.toDate(), rangeStop: rangeStop.toDate(), orgGUIDs,
  }).then(events => events.filter(serviceFilter));

  const orgBillableEvents = aggregateBillingEvents(billableEvents);

  const orgQuotas: {[key: string]: IOrganizationQuota} = (await Promise.all(
    orgs.map(async (org: IOrganization) => {
      const orgQuotaGUID =
        getFirstBillableEventQuotaGUID(orgBillableEvents[org.metadata.guid]) ||
        org.entity.quota_definition_guid;
      const quota = await cf.organizationQuota(orgQuotaGUID);
      return {[org.metadata.guid]: quota};
    }),
  ))
  .reduce(/* istanbul ignore next */ (accumulator, quota) => {
    return { ...accumulator, ...quota };
  });

  const orgCostRecords = createOrgCostRecords(
    orgs,
    orgQuotas,
    orgBillableEvents,
  );
  const quotaCostRecords = createQuotaCostRecords(orgCostRecords);

  const totalBillables = sumRecords(billableEvents);
  const billableEventCount = billableEvents.length;

  const template = new Template(ctx.viewContext, `Costs Report`);
  template.subnav = { items: [
    { text: 'Summary', link: ctx.linkTo('admin.reports.cost', { rangeStart: rangeStart.format(DATE) }),
      active: true },
    { text: 'By service', link: ctx.linkTo('admin.reports.costbyservice', { rangeStart: rangeStart.format(DATE) }) },
    { text: 'Visualisation', link: ctx.linkTo('admin.reports.visualisation', { rangeStart: rangeStart.format(DATE) }) },
  ] };

  return {
    body: template.render(<CostReport
      date={moment(rangeStart).format('MMMM YYYY')}
      billableEventCount={billableEventCount}
      totalBillables={totalBillables}
      orgCostRecords={Object.values(orgCostRecords)}
      quotaCostRecords={quotaCostRecords}
    />),
  };
}

export function aggregateBillingEvents(
  billableEvents: ReadonlyArray<IBillableEvent>,
): {readonly [key: string]: ReadonlyArray<IBillableEvent>} {
  return billableEvents
    .reduce(
      (
        accumulator: {[key: string]: ReadonlyArray<IBillableEvent>},
        billableEvent: IBillableEvent,
      ) => {
        const accEvents = accumulator[billableEvent.orgGUID] || [];
        return {
          ...accumulator,
          [billableEvent.orgGUID]: accEvents.concat([billableEvent]),
        };
      }, {});
}

export function createOrgCostRecords(
  orgs: ReadonlyArray<IOrganization>,
  orgQuotas: {readonly [key: string]: IOrganizationQuota},
  orgBillableEvents: {readonly [key: string]: ReadonlyArray<IBillableEvent>},
): ReadonlyArray<IOrgCostRecord> {
  return orgs
  .map(org => {
    const quota = orgQuotas[org.metadata.guid];
    const billableEvents = orgBillableEvents[org.metadata.guid] || [];

    const incVAT = billableEvents.reduce(
      (acc: number, e: IBillableEvent) => acc + e.price.incVAT, 0,
    );
    const exVAT = billableEvents.reduce(
      (acc: number, e: IBillableEvent) => acc + e.price.exVAT, 0,
    );

    return {
      orgGUID: org.metadata.guid,
      orgName: org.entity.name,
      quotaGUID: quota.metadata.guid,
      quotaName: quota.entity.name,
      incVAT, exVAT,
    };
  });
}

export function createQuotaCostRecords(
  records: ReadonlyArray<IOrgCostRecord>,
): ReadonlyArray<IQuotaCostRecord> {
  const costsByQuota = records
  .reduce((
    accumulator: {[key: string]: IQuotaCostRecord},
    record: IOrgCostRecord,
  ) => {
    const accumulatedRecord = accumulator[record.quotaGUID];
    const currentIncVAT = accumulatedRecord ? accumulatedRecord.incVAT : 0;
    const currentExVAT = accumulatedRecord ? accumulatedRecord.exVAT : 0;

    const quota = {
      quotaGUID: record.quotaGUID,
      quotaName: record.quotaName,
      incVAT: currentIncVAT + record.incVAT,
      exVAT: currentExVAT + record.exVAT,
    };

    return { ...accumulator, [record.quotaGUID]: quota};
  }, {});

  return Object.values(costsByQuota);
}

export function sumRecords(
  records: ReadonlyArray<IBillableEvent>,
): ICostSummary {
  let incVAT = 0;
  let exVAT = 0;

  records.forEach(record => {
    incVAT += record.price.incVAT;
    exVAT += record.price.exVAT;
  });

  return { incVAT, exVAT };
}

export async function viewCostByServiceReport(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, DATE);
  const rangeStop  = moment(rangeStart).add(1, 'month');

  const billingClient = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    accessToken: ctx.token.accessToken,
    logger: ctx.app.logger,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgs = (await cf.v3Organizations())
    .filter(org => !org.name.match(/^(CAT|SMOKE|PERF|ACC|BACC)/));
  const orgsByGUID = groupBy(orgs, x => x.guid);
  const orgGUIDs = Object.keys(orgsByGUID);

  const billableEvents = await billingClient.getBillableEvents({
    rangeStart: rangeStart.toDate(), rangeStop: rangeStop.toDate(), orgGUIDs,
  });

  const spaces = await cf.spaces();
  const spacesByGUID = groupBy(spaces, x => x.metadata.guid);

  const billablesByService = getBillableEventsByService(billableEvents);
  const billablesByOrganisationAndService = getBillableEventsByOrganisationAndService(billableEvents, orgsByGUID);
  const billablesByOrganisationAndSpaceAndService = getBillableEventsByOrganisationAndSpaceAndService(
    billableEvents, orgsByGUID, spacesByGUID);

  const template = new Template(ctx.viewContext, `Costs By Service Report`);
  template.subnav = { items: [
    { text: 'Summary', link: ctx.linkTo('admin.reports.cost', { rangeStart: rangeStart.format(DATE) }) },
    { text: 'By service', link: ctx.linkTo('admin.reports.costbyservice', { rangeStart: rangeStart.format(DATE) }),
      active: true },
    { text: 'Visualisation', link: ctx.linkTo('admin.reports.visualisation', { rangeStart: rangeStart.format(DATE) }) },
  ] };

  return {
    body: template.render(<CostByServiceReport
      date={moment(rangeStart).format('MMMM YYYY')}
      billablesByService={billablesByService}
      billablesByOrganisationAndService={billablesByOrganisationAndService}
      billablesByOrganisationAndSpaceAndService={billablesByOrganisationAndSpaceAndService}
    />),
  };
}

export function getBillableEventsByService(
    billableEvents: ReadonlyArray<IBillableEvent>,
  ): ReadonlyArray<IBillableByService> {
  const billableEventsByService = Object.entries(groupBy(billableEvents, getServiceGroup));
  return billableEventsByService
    .map(([serviceGroup, billableEventsForService]) => ({
      serviceGroup,
      incVAT: sumBy(billableEventsForService, x => x.price.incVAT),
      exVAT: sumBy(billableEventsForService, x => x.price.exVAT),
    }))
    .sort(comparePriceIncVAT);
}

export function getBillableEventsByOrganisationAndService(
    billableEvents: ReadonlyArray<IBillableEvent>,
    orgsByGUID: Dictionary<ReadonlyArray<IV3OrganizationResource>>,
  ): ReadonlyArray<IBillableByOrganisationAndService> {
  const billableEventsByOrgGUID = Object.entries(groupBy(billableEvents, x => x.orgGUID));
  return flatMap(
    billableEventsByOrgGUID,
    ([orgGUID, billableEventsForOrg]) => {
      const org = (orgsByGUID[orgGUID] || [])[0];
      const orgName = org ? org.name : 'unknown';
      return getBillableEventsByService(billableEventsForOrg)
        .map(x => ({...x, orgGUID, orgName}));
    })
    .sort((a, b) => compareOrgName(a, b) || comparePriceIncVAT(a, b));
}

export function getBillableEventsByOrganisationAndSpaceAndService(
    billableEvents: ReadonlyArray<IBillableEvent>,
    orgsByGUID: Dictionary<ReadonlyArray<IV3OrganizationResource>>,
    spacesByGUID: Dictionary<ReadonlyArray<ISpace>>,
  ): ReadonlyArray<IBillableByOrganisationAndSpaceAndService> {
  const billableEventsByOrgGUID = Object.entries(groupBy(billableEvents, x => x.orgGUID));
  return flatMap(
    billableEventsByOrgGUID,
    ([orgGUID, billableEventsForOrg]) => {
      const org = (orgsByGUID[orgGUID] || [])[0];
      const orgName = org ? org.name : 'unknown';
      const orgBillableEventsBySpaceGUID = Object.entries(groupBy(billableEventsForOrg, x => x.spaceGUID));
      return flatMap(
        orgBillableEventsBySpaceGUID,
        ([spaceGUID, billableEventsForSpace]) => {
          const space = (spacesByGUID[spaceGUID] || [])[0];
          const spaceName = space ? space.entity.name : 'unknown';
          return getBillableEventsByService(billableEventsForSpace)
            .map(x => ({...x, orgGUID, orgName, spaceGUID, spaceName}));
        });
    })
    .sort((a, b) => compareOrgName(a, b) || compareSpaceName(a, b) || comparePriceIncVAT(a, b));
}

function getServiceGroup(billableEvent: IBillableEvent) {
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
    default: return planPrefix;
  }
}

function compareOrgName(a: {readonly orgName: string}, b: {readonly orgName: string}) {
  return a.orgName.localeCompare(b.orgName);
}

function compareSpaceName(a: {readonly spaceName: string}, b: {readonly spaceName: string}) {
  return a.spaceName.localeCompare(b.spaceName);
}

function comparePriceIncVAT(a: {readonly incVAT: number}, b: {readonly incVAT: number}) {
  return b.incVAT - a.incVAT;
}

export async function viewPmoOrgSpendReportCSV(ctx: IContext, params: IParameters): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, DATE);
  const rangeStop  = moment(rangeStart).add(1, 'month');

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const billingClient = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    accessToken: ctx.token.accessToken,
    logger: ctx.app.logger,
  });

  const trialQuotaCandidates = await cf.quotaDefinitions({name: 'default'});
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
    rangeStart: rangeStart.toDate(), rangeStop: rangeStop.toDate(), orgGUIDs: billableOrgGUIDs,
  });
  const billablesByOrganisation = getBillablesByOrganisation(billableOrgs, billableEvents);

  const nameMonth = moment(rangeStart).format('YYYY-MM');
  const nameLocation = ctx.app.location.toLowerCase();

  const csvData = [
    ['Billing month', 'Org', 'Region', 'Unique ID', 'Spend in GBP without VAT'],
    ...billablesByOrganisation.map(billablesForOrg => [
      moment(rangeStart).format('MMMM YYYY'),
      billablesForOrg.org.name,
      ctx.app.location,
      billablesForOrg.org.guid,
      (billablesForOrg.exVAT + (billablesForOrg.exVAT * ctx.app.adminFee)).toFixed(2),
    ]),
  ];

  return {
    mimeType: 'text/csv',
    download: {
      name: `paas-pmo-org-spend-${nameLocation}-${nameMonth}.csv`,
      data: csvData.map(line => line.join(',')).join('\n'),
    },
  };
}

export async function viewVisualisation(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, DATE);
  const rangeStop  = moment(rangeStart).add(1, 'month');

  const billingClient = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    accessToken: ctx.token.accessToken,
    logger: ctx.app.logger,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const orgs = (await cf.v3Organizations())
    .filter(org => !org.name.match(/^(CAT|SMOKE|PERF|B?ACC)/));

  const orgsByGUID = groupBy(orgs, x => x.guid);
  const orgGUIDs = Object.keys(orgsByGUID);

  const billableEvents = await billingClient.getBillableEvents({
    rangeStart: rangeStart.toDate(), rangeStop: rangeStop.toDate(), orgGUIDs,
  });

  const billablesByOrganisationAndService = getBillableEventsByOrganisationAndService(billableEvents, orgsByGUID);
  /* istanbul ignore next */
  const organisationsByOwner = orgs.map(x => ({owner: x.metadata.annotations.owner || 'Other', org: x.name}));
  const data = buildD3SankeyInput(billablesByOrganisationAndService, organisationsByOwner);

  const template = new Template(ctx.viewContext, `Costs Report Visualisation`);
  template.subnav = { items: [
    { text: 'Summary', link: ctx.linkTo('admin.reports.cost', { rangeStart: rangeStart.format(DATE) }) },
    { text: 'By service', link: ctx.linkTo('admin.reports.costbyservice', { rangeStart: rangeStart.format(DATE) }) },
    { text: 'Visualisation', link: ctx.linkTo('admin.reports.visualisation', { rangeStart: rangeStart.format(DATE) }),
      active: true },
  ] };

  return {
    body: template.render(<VisualisationPage
      date={moment(rangeStart).format('MMMM YYYY')}
      data={data.nodes.length > 0 ? data : undefined}
    />),
  };
}

export function buildD3SankeyInput(
  billables: ReadonlyArray<IBillableByOrganisationAndService>,
  organisationsByOwner: ReadonlyArray<IOrgAndOwner>): ID3SankeyInput {
  const services = uniq(billables.map(x => x.serviceGroup));
  const orgNames = uniq(billables.map(x => x.orgName));
  const organisationsByOwnerWithBills = organisationsByOwner.filter(x => orgNames.includes(x.org));
  const owners = uniq(organisationsByOwnerWithBills.map(x => x.owner));
  const nodes = [...services, ...orgNames, ...owners];

  if (nodes.length - owners.length === 0) {
    return { nodes: [], links: [] };
  }

  const nodeIndexByName = nodes
    .reduce((acc, x, index) => ({...acc, [x]: index}), {}) as {[_: string]: number};

  const billableLinks = billables.map(x => ({
    source: nodeIndexByName[x.serviceGroup],
    target: nodeIndexByName[x.orgName],
    value: x.exVAT,
  }));

  const ownerLinks = organisationsByOwnerWithBills.map(orgOwner => ({
    source: nodeIndexByName[orgOwner.org],
    target: nodeIndexByName[orgOwner.owner],
    value: sum(billables.filter(billable => billable.orgName === orgOwner.org).map(billable => billable.exVAT)),
  }));

  return {
    nodes: nodes.map(x => ({name: x})),
    links: [...billableLinks, ...ownerLinks],
  };
}
