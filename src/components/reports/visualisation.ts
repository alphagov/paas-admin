import {groupBy, uniq} from 'lodash';
import moment from 'moment';

import { getBillableEventsByOrganisationAndService } from '.';
import BillingClient from '../../lib/billing';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import visualisationTemplate from './visualisation.njk';

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

  const orgs = (await cf.organizations())
    .filter(org => !org.entity.name.match(/^(CAT|SMOKE|PERF|ACC)/));

  const orgsByGUID = groupBy(orgs, x => x.metadata.guid);
  const orgGUIDs = Object.keys(orgsByGUID);

  const billableEvents = await billingClient.getBillableEvents({
    rangeStart, rangeStop, orgGUIDs,
  });

  const billablesByOrganisationAndService = getBillableEventsByOrganisationAndService(billableEvents, orgsByGUID);

  const services = uniq(billablesByOrganisationAndService.map(x => x.serviceGroup));
  const orgNames = uniq(billablesByOrganisationAndService.map(x => x.orgName));
  const nodes = services.concat(orgNames);
  const nodeIndexByName = nodes.reduce((acc, x, index) => ({...acc, [x]: index}), {}) as any;
  const data = {
    nodes: nodes.map(x => ({name: x})),
    links: billablesByOrganisationAndService.map(x => ({
      source: nodeIndexByName[x.serviceGroup],
      target: nodeIndexByName[x.orgName],
      value: x.incVAT,
    })),
  };

  return {
    body: visualisationTemplate.render({
      report: 'visualisation',
      linkTo: ctx.linkTo,
      rangeStart: moment(rangeStart).format('YYYY-MM-DD'),
      csrf: ctx.csrf,
      date: moment(rangeStart).format('MMMM YYYY'),
      data: nodes.length > 0 ? data : null,
      location: ctx.app.location,
    }),
  };
}
