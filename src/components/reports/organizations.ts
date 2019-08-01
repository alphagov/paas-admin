import lodash from 'lodash';
import moment from 'moment';

import CloudFoundryClient from '../../lib/cf';
import { IOrganization, IOrganizationQuota } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';

import organizationsTemplate from './organizations.njk';

function trialExpiryDate(creation: Date): Date {
  return moment(creation).add(90, 'days').toDate();
}

function filterRealOrgs(
  orgs: ReadonlyArray<IOrganization>,
): ReadonlyArray<IOrganization> {
  return orgs
  .filter(org => {
    const name = org.entity.name;

    if (name.match(/^(CATS|ACC|BACC|SMOKE)-/)) {
      return false;
    }

    if (name === 'admin') {
      return false;
    }

    return true;
  })
  ;
}

function filterTrialOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IOrganization>,
): ReadonlyArray<IOrganization> {
  const trialOrgs = orgs.filter(
    o => o.entity.quota_definition_guid === trialQuotaGUID,
  );

  // return the oldest orgs first
  return lodash
    .sortBy(trialOrgs, o => new Date(o.metadata.created_at))
  ;
}

function filterBillableOrgs(
  trialQuotaGUID: string,
  orgs: ReadonlyArray<IOrganization>,
): ReadonlyArray<IOrganization> {
  const billableOrgs = orgs .filter(
    o => o.entity.quota_definition_guid !== trialQuotaGUID,
  );

  // return the newest orgs first (reverse)
  return lodash
    .sortBy(billableOrgs, o => new Date(o.metadata.created_at))
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

  const organizations = filterRealOrgs(await cf.organizations());

  const orgQuotaGUIDs = lodash.uniq(
    organizations.map(o => o.entity.quota_definition_guid),
  );

  const orgQuotas = await Promise.all(
    orgQuotaGUIDs.map(g => cf.organizationQuota(g)),
  );

  const trialQuotaGUID = trialQuotaCandidates[0].metadata.guid;
  const trialOrgs = filterTrialOrgs(trialQuotaGUID, organizations);
  const billableOrgs = filterBillableOrgs(trialQuotaGUID, organizations);

  const orgQuotaMapping = orgQuotas.reduce((
    mapping: {[key: string]: IOrganizationQuota},
    orgQuota: IOrganizationQuota,
  ) => {
    mapping[orgQuota.metadata.guid] = orgQuota;
    return mapping;
  }, {});

  const orgTrialExpirys = trialOrgs.reduce((
    mapping: {[key: string]: Date}, org: IOrganization,
  ) => {
    mapping[org.metadata.guid] = trialExpiryDate(
      new Date(org.metadata.created_at),
    );

    return mapping;
  }, {});

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
