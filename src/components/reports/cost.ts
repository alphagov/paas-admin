import moment from 'moment';

import { BillingClient } from '../../lib/billing';
import CloudFoundryClient from '../../lib/cf';
import { IOrganization, IOrganizationQuota } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import costReportTemplate from './cost.njk';

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

export async function viewCostReport(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, 'YYYY-MM-DD').toDate();
  const rangeStop  = moment(rangeStart).add(1, 'month').toDate();

  const billingClient = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    accessToken: ctx.token.accessToken,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const orgs = await cf.organizations();
  const orgGUIDs = orgs.map(o => o.metadata.guid);

  const orgQuotas: {[key: string]: IOrganizationQuota} = (await Promise.all(
    orgs.map(async (org: IOrganization) => {
      const quota = await cf.organizationQuota(org.entity.quota_definition_guid);
      return {[org.metadata.guid]: quota};
    }),
  ))
  .reduce(/* istanbul ignore next */ (accumulator, quota) => {
    return { ...accumulator, ...quota };
  });

  const billableEvents = await billingClient.getBillableEvents({
    rangeStart, rangeStop, orgGUIDs,
  });

  const orgBillableEvents = aggregateBillingEvents(billableEvents);
  const orgCostRecords = createOrgCostRecords(
    orgs,
    orgQuotas,
    orgBillableEvents,
  );
  const quotaCostRecords = createQuotaCostRecords(orgCostRecords);

  const totalBillables = sumRecords(billableEvents);
  const billableEventCount = billableEvents.length;

  return {
    body: costReportTemplate.render({
      csrf: ctx.csrf,
      date: moment(rangeStart).format('MMMM YYYY'),
      orgCostRecords: Object.values(orgCostRecords),
      quotaCostRecords,
      totalBillables,
      billableEventCount,
      location: ctx.app.location,
    }),
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
