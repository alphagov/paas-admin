import { RDS } from 'aws-sdk';
import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse, NotFoundError } from '../../lib/router';
import { IContext } from '../app/context';
import { fromOrg } from '../breadcrumbs';
import { UserFriendlyError } from '../errors';

import { IServiceLogItem, ServiceLogsPage, ServicePage } from './views';

const UNSUPPORTED_SERVICE_LOGS_REQUEST = 'Service Logs are only available for Postgres and MySQL instances.';

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

export async function listServiceLogs(ctx: IContext, params: IParameters): Promise<IResponse> {
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

  if (isUserProvidedService) {
    throw new UserFriendlyError(UNSUPPORTED_SERVICE_LOGS_REQUEST);
  }

  const serviceInstance = await cf.serviceInstance(params.serviceGUID);
  const service = await cf.service(serviceInstance.entity.service_guid);

  if (!['postgres', 'mysql'].includes(service.entity.label)) {
    throw new UserFriendlyError(UNSUPPORTED_SERVICE_LOGS_REQUEST);
  }

  const rds = new RDS();
  const fileList = await rds.describeDBLogFiles({
    DBInstanceIdentifier: `rdsbroker-${serviceInstance.metadata.guid}`,
    MaxRecords: 72,
  }).promise();

  const template = new Template(
    ctx.viewContext,
    `${serviceInstance.entity.name} - Service Logs`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.spaces.services.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
      text: space.entity.name,
    },
    {
      href: ctx.linkTo('admin.organizations.spaces.services.view', {
        organizationGUID: organization.metadata.guid,
        serviceGUID: serviceInstance.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
      text: serviceInstance.entity.name,
    },
    { text: 'Logs' },
  ]);

  return {
    body: template.render(<ServiceLogsPage
      files={fileList.DescribeDBLogFiles as ReadonlyArray<IServiceLogItem>}
      linkTo={ctx.linkTo}
      organizationGUID={organization.metadata.guid}
      routePartOf={ctx.routePartOf}
      service={serviceInstance}
      spaceGUID={space.metadata.guid}
    />),
  };
}

export async function downloadServiceLogs(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  if (!params.filename) {
    throw new NotFoundError('The `filename` parameter needs to be provided.');
  }

  const userProvidedServices = await cf.userServices(params.spaceGUID);

  const isUserProvidedService = userProvidedServices.some(
    s => s.metadata.guid === params.serviceGUID,
  );

  if (isUserProvidedService) {
    throw new UserFriendlyError(UNSUPPORTED_SERVICE_LOGS_REQUEST);
  }

  const serviceInstance = await cf.serviceInstance(params.serviceGUID);
  const service = await cf.service(serviceInstance.entity.service_guid);

  if (!['postgres', 'mysql'].includes(service.entity.label)) {
    throw new UserFriendlyError(UNSUPPORTED_SERVICE_LOGS_REQUEST);
  }

  const rds = new RDS();
  const file = await rds.downloadDBLogFilePortion({
    DBInstanceIdentifier: `rdsbroker-${serviceInstance.metadata.guid}`,
    LogFileName: params.filename,
  }).promise();

  return {
    download: {
      data: file.LogFileData || '\n',
      name: `db-${serviceInstance.metadata.guid}-${params.filename.replace('/', '-')}.log`,
    },
    mimeType: 'text/plain',
  };
}
