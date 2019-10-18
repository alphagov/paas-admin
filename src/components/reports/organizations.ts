import lodash from 'lodash';
import moment from 'moment';

import CloudFoundryClient from '../../lib/cf';
import { IOrganizationQuota, IV3OrganizationResource } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';

import organizationsTemplate from './organizations.njk';

function trialExpiryDate(creation: Date): Date {
  return moment(creation).add(90, 'days').toDate();
}

function filterRealOrgs(
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  return orgs
  .filter(org => {
    if (org.name.match(/^(CATS|ACC|BACC|SMOKE)-/)) {
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

function filterBillableOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IV3OrganizationResource>,
): ReadonlyArray<IV3OrganizationResource> {
  const billableOrgs = orgs .filter(
    o => o.relationships.quota.data.guid !== trialQuotaGUID,
  );

  // return the newest orgs first (reverse)
  return lodash
    .sortBy(billableOrgs, o => new Date(o.created_at))
    .reverse()
  ;
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

  return {
    body: organizationsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      trialOrgs,
      billableOrgs,
      orgQuotaMapping,
      orgTrialExpirys,
      organizations,
    }),
  };
}
