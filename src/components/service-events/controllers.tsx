import lodash from 'lodash';
import React from 'react';
import { validate as uuidValidate } from 'uuid';

import { Template } from '../../layouts';
import { AccountsClient, IAccountsUser } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { fromOrg } from '../breadcrumbs';

import { ServiceEventDetailPage, ServiceEventsPage } from './views';

export async function viewServiceEvent(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    secret: ctx.app.accountsSecret,
    logger: ctx.app.logger,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const eventGUID = params.eventGUID;

  const [organization, space, service, event, userProvidedServices] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.serviceInstance(params.serviceGUID),
    cf.auditEvent(eventGUID),
    cf.userServices(params.spaceGUID),
  ]);

  const isUserProvidedService = userProvidedServices.some(
    s => s.metadata.guid === params.serviceGUID,
  );

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

  const eventActorGUID: string | undefined =
    event.actor.type === 'user' && uuidValidate(event.actor.guid)
      ? event.actor.guid
      : undefined;

  const eventActor: IAccountsUser | null | undefined = eventActorGUID
    ? await accountsClient.getUser(eventActorGUID)
    : undefined;

  const template = new Template(
    ctx.viewContext,
    `Service ${service.entity.name} Event details`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      text: space.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.services.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    {
      text: service.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.services.events.view', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
        serviceGUID: service.metadata.guid,
      }),
    },
    {
      text: 'Event',
    },
  ]);

  return {
    body: template.render(
      <ServiceEventDetailPage
        actor={eventActor}
        event={event}
        service={summarisedService}
      />,
    ),
  };
}

export async function viewServiceEvents(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    secret: ctx.app.accountsSecret,
    logger: ctx.app.logger,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const page: number =
    params.page === undefined ? 1 : parseInt(params.page, 10);

  const [organization, space, service, pageOfEvents, userProvidedServices] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.serviceInstance(params.serviceGUID),
    cf.auditEvents(page, /* targetGUIDs */ [params.serviceGUID]),
    cf.userServices(params.spaceGUID),
  ]);

  const isUserProvidedService = userProvidedServices.some(
    s => s.metadata.guid === params.serviceGUID,
  );

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

  const { resources: events, pagination } = pageOfEvents;

  let eventActorEmails: { readonly [key: string]: string } = {};
  const userActorGUIDs = lodash
    .chain(events)
    .filter(e => e.actor.type === 'user')
    .map(e => e.actor.guid)
    .uniq()
    .filter(guid => uuidValidate(guid))
    .value();

  if (userActorGUIDs.length > 0) {
    const actorAccounts: ReadonlyArray<IAccountsUser> = await accountsClient.getUsers(
      userActorGUIDs,
    );

    eventActorEmails = lodash
      .chain(actorAccounts)
      .keyBy(account => account.uuid)
      .mapValues(account => account.email)
      .value();
  }

  const template = new Template(
    ctx.viewContext,
    `Service ${service.entity.name} Events`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      text: space.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.services.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    { text: service.entity.name },
  ]);

  return {
    body: template.render(
      <ServiceEventsPage
        actorEmails={eventActorEmails}
        events={events}
        linkTo={ctx.linkTo}
        organizationGUID={organization.metadata.guid}
        pagination={{ ...pagination, page }}
        routePartOf={ctx.routePartOf}
        service={summarisedService}
        spaceGUID={space.metadata.guid}
      />,
    ),
  };
}
