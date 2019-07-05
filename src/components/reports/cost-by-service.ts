import {Dictionary, flatMap, groupBy, sumBy} from 'lodash';
import moment from 'moment';

import { BillingClient } from '../../lib/billing';
import CloudFoundryClient from '../../lib/cf';
import { IOrganization } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import costReportTemplate from './cost-by-service.njk';

interface IBillableByService {
  serviceGroup: string;
  incVAT: number;
  exVAT: number;
}

interface IBillableByOrganisationAndService extends IBillableByService {
  orgGUID: string;
  orgName: string;
}

export async function viewCostByServiceReport(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, 'YYYY-MM-DD').toDate();
  const rangeStop  = moment(rangeStart).add(1, 'month').toDate();

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

  const orgs = (await cf.organizations())
    .filter(org => !org.entity.name.match(/^(CAT|SMOKE|PERF|ACC)/));

  const orgsByGUID = groupBy(orgs, x => x.metadata.guid);
  const orgGUIDs = Object.keys(orgsByGUID);

  const billableEvents = await billingClient.getBillableEvents({
    rangeStart, rangeStop, orgGUIDs,
  });

  const billablesByService = getBillableEventsByService(billableEvents);
  const billablesByOrganisationAndService = getBillableEventsByOrganisationAndService(billableEvents, orgsByGUID);

  return {
    body: costReportTemplate.render({
      csrf: ctx.csrf,
      date: moment(rangeStart).format('MMMM YYYY'),
      billablesByService,
      billablesByOrganisationAndService,
      location: ctx.app.location,
    }),
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
    orgsByGUID: Dictionary<ReadonlyArray<IOrganization>>,
  ): ReadonlyArray<IBillableByOrganisationAndService> {
  const billableEventsByOrgGUID = Object.entries(groupBy(billableEvents, x => x.orgGUID));
  return flatMap(
    billableEventsByOrgGUID,
    ([orgGUID, billableEventsForOrg]) => {
      const org = (orgsByGUID[orgGUID] || [])[0];
      const orgName = org ? org.entity.name : 'unknown';
      return getBillableEventsByService(billableEventsForOrg)
        .map(x => ({...x, orgGUID, orgName}));
    })
    .sort((a, b) => compareOrgName(a, b) || comparePriceIncVAT(a, b));
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

function comparePriceIncVAT(a: {readonly incVAT: number}, b: {readonly incVAT: number}) {
  return b.incVAT - a.incVAT;
}
