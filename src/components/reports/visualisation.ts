import {groupBy, sum, uniq} from 'lodash';
import moment from 'moment';

import { getBillableEventsByOrganisationAndService } from '.';
import BillingClient from '../../lib/billing';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { IBillableByOrganisationAndService } from './cost-by-service';
import visualisationTemplate from './visualisation.njk';

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

export async function viewVisualisation(
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

  const orgs = (await cf.v3Organizations())
    .filter(org => !org.name.match(/^(CAT|SMOKE|PERF|B?ACC)/));

  const orgsByGUID = groupBy(orgs, x => x.guid);
  const orgGUIDs = Object.keys(orgsByGUID);

  const billableEvents = await billingClient.getBillableEvents({
    rangeStart, rangeStop, orgGUIDs,
  });

  const billablesByOrganisationAndService = getBillableEventsByOrganisationAndService(billableEvents, orgsByGUID);
  /* istanbul ignore next */
  const organisationsByOwner = orgs.map(x => ({owner: x.metadata.annotations.owner || 'Other', org: x.name}));
  const data = buildD3SankeyInput(billablesByOrganisationAndService, organisationsByOwner);

  return {
    body: visualisationTemplate.render({
      report: 'visualisation',
      linkTo: ctx.linkTo,
      rangeStart: moment(rangeStart).format('YYYY-MM-DD'),
      context: ctx.viewContext,
      date: moment(rangeStart).format('MMMM YYYY'),
      data: data.nodes.length > 0 ? data : null,
    }),
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
