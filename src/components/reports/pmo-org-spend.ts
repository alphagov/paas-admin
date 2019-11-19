import {groupBy, sortBy, sumBy} from 'lodash';
import moment from 'moment';

import { BillingClient } from '../../lib/billing';
import CloudFoundryClient from '../../lib/cf';
import { IV3OrganizationResource } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';

import pmoOrgSpendTemplate from './pmo-org-spend.csv.njk';

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

export function filterBillableOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  const billableOrgs = orgs.filter(
    o => o.relationships.quota.data.guid !== trialQuotaGUID,
  );

  // return the newest orgs first (reverse)
  return sortBy(billableOrgs, o => new Date(o.created_at))
    .reverse()
  ;
}

export interface IBillableByOrganisation {
  org: IV3OrganizationResource;
  exVAT: number;
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

export async function viewPmoOrgSpendReportCSV(ctx: IContext, params: IParameters): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, 'YYYY-MM-DD').toDate();
  const rangeStop  = moment(rangeStart).add(1, 'month').toDate();

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
    rangeStart, rangeStop, orgGUIDs: billableOrgGUIDs,
  });
  const billablesByOrganisation = getBillablesByOrganisation(billableOrgs, billableEvents);

  const nameMonth = moment(rangeStart).format('YYYY-MM');
  const nameLocation = ctx.app.location.toLowerCase();
  return {
    mimeType: 'text/csv',
    download: {
      name: `paas-pmo-org-spend-${nameLocation}-${nameMonth}.csv`,
      data: pmoOrgSpendTemplate.render({
        location: ctx.app.location,
        month: moment(rangeStart).format('MMMM YYYY'),
        billablesByOrganisation,
        adminFee: ctx.app.adminFee,
      }),
    },
  };
}
