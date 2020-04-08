import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';
import { fromOrg } from '../breadcrumbs';

import { ServicePage } from './views';

export async function viewService(
  ctx: IContext,
  params: IParameters,
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

  const isUserProvidedService = userProvidedServices.some(
    s => s.metadata.guid === params.serviceGUID,
  );

  const service = isUserProvidedService
    ? await cf.userServiceInstance(params.serviceGUID)
    : await cf.serviceInstance(params.serviceGUID);

  const servicePlan = !isUserProvidedService
    ? await cf.servicePlan(service.entity.service_plan_guid)
    : undefined;

  const summarisedService = {
    entity: service.entity,
    metadata: service.metadata,
    service: servicePlan
      ? await cf.service(servicePlan.entity.service_guid)
      : undefined,
    service_plan: servicePlan,
  };

  const template = new Template(
    ctx.viewContext,
    `${service.entity.name} - Service Overview`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.spaces.services.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
      text: space.entity.name,
    },
    { text: summarisedService.entity.name },
  ]);

  return {
    body: template.render(
      <ServicePage
        routePartOf={ctx.routePartOf}
        linkTo={ctx.linkTo}
        service={summarisedService}
        organizationGUID={organization.metadata.guid}
        spaceGUID={space.metadata.guid}
      />,
    ),
  };
}
