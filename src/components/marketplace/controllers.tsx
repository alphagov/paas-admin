import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';

import { IPaaSServiceMetadata, IPaaSServicePlanMetadata, MarketplaceItemPage, MarketplacePage } from './views';


export async function listServices(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: 'PUBLIC',
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const services = await cf.services<IPaaSServiceMetadata>();

  const template = new Template(ctx.viewContext, 'GOV.UK PaaS marketplace');

  return {
    body: template.render(<MarketplacePage
      linkTo={ctx.linkTo}
      services={services}
    />),
  };
}

export async function viewService(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: 'PUBLIC',
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [service, plans] = await Promise.all([
    cf.v3Service<IPaaSServiceMetadata>(params.serviceGUID),
    cf.v3ServicePlans<IPaaSServicePlanMetadata>(params.serviceGUID),
  ]);

  const versions = Array.from(new Set(plans
    .filter(plan => !!plan.broker_catalog.metadata.AdditionalMetadata?.version)
    .map(plan => `${plan.broker_catalog.metadata.AdditionalMetadata!.version!}`)
    .sort((first: any, second: any) => second - first)));

  const version = params.version || versions[0];

  const template = new Template(
    ctx.viewContext,
    `GOV.UK PaaS marketplace - Service - ${service.broker_catalog.metadata.displayName}`,
  );

  template.breadcrumbs = [
    {
      href: ctx.linkTo('marketplace.view'),
      text: 'GOV.UK PaaS marketplace',
    },
    {
      text: service.broker_catalog.metadata.displayName,
    },
  ];

  return {
    body: template.render(<MarketplaceItemPage
      linkTo={ctx.linkTo}
      service={service}
      plans={plans.filter(plan => `${plan.broker_catalog.metadata.AdditionalMetadata?.version}` === version)}
      version={version}
      versions={versions}
    />),
  };
}
