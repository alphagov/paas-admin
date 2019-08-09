import moment from 'moment';

import CloudFoundryClient from '../../lib/cf';
import PromClient from '../../lib/prom';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import serviceMetricsTemplate from './service-metrics.njk';

export async function viewServiceMetrics(
  ctx: IContext, params: IParameters,
): Promise<IResponse> {

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [userProvidedServices, space, organization] = await Promise.all([
    cf.userServices(params.spaceGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  const isUserProvidedService = userProvidedServices.some(s => s.metadata.guid === params.serviceGUID);

  const service = isUserProvidedService ?
    await cf.userServiceInstance(params.serviceGUID) :
  await cf.serviceInstance(params.serviceGUID);

  const servicePlan = !isUserProvidedService ? await cf.servicePlan(service.entity.service_plan_guid) : null;

  const summarisedService = {
    entity: service.entity,
    metadata: service.metadata,
    service_plan: {
      ...servicePlan,
      service: servicePlan ? await cf.service(servicePlan.entity.service_guid) : null,
    },
  };

  return {
    body: serviceMetricsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      space, organization,
      service: summarisedService,
    }),
  };
}

export async function dataServiceMetrics(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {

  const sourceID = params.serviceGUID;
  const instantTime = moment()
    .subtract(3, 'minutes') // RDS metrics take time to percolate
    .toDate()
  ;
  const historicTime = moment()
    .subtract(3, 'minutes') // RDS metrics take time to percolate
    .subtract(3, 'hours')
    .toDate()
  ;
  const timeStep = 30;

  const prom = new PromClient(
    'https://metric-store.tlwr.dev.cloudpipelineapps.digital',
    ctx.token.accessToken,
    ctx.app.logger,
  );

  const [
    freeStorageSpace,
  ] = await Promise.all([
    `avg by (source_id) (free_storage_space{source_id="${sourceID}"})`,
  ].map(q => prom.getValue(q, instantTime)));
  const [
    freeStorageSpaceSeries,
    cpuSeries,
  ] = await Promise.all([
    `avg by (source_id) (free_storage_space{source_id="${sourceID}"})`,
    `avg by (source_id) (cpu{source_id="${sourceID}"})`,
  ].map(q => prom.getSeries(q, timeStep, historicTime, instantTime)));

  return {
    body: JSON.stringify({
      values: {
        freeStorageSpace,
      },
      series: {
        freeStorageSpaceSeries,
        cpuSeries,
      },
    }),
  };
}
