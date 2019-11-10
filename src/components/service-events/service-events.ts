import lodash from 'lodash';

import {AccountsClient, IAccountsUser} from '../../lib/accounts';
import CloudFoundryClient, {eventTypeDescriptions} from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { fromOrg, IBreadcrumb } from '../breadcrumbs';
import serviceEventTemplate from './service-event.njk';
import serviceEventsTemplate from './service-events.njk';

export async function viewServiceEvent(ctx: IContext, params: IParameters): Promise<IResponse> {
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

  const [organization, space, service, event] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.serviceInstance(params.serviceGUID),
    cf.auditEvent(eventGUID),
  ]);

  const eventActorGUID: string | undefined = event.actor.type === 'user'
    ? event.actor.guid
    : undefined
  ;

  const eventActor: IAccountsUser | null | undefined = eventActorGUID
    ? await accountsClient.getUser(eventActorGUID)
    : undefined
  ;

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = fromOrg(ctx, organization, [
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
    body: serviceEventTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      organization, space, service, breadcrumbs,
      event, eventTypeDescriptions, eventActor,
    }),
  };
}

export async function viewServiceEvents(ctx: IContext, params: IParameters): Promise<IResponse> {
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

  const page: number = params.page === undefined ? 1 : parseInt(params.page, 10);

  const [organization, space, service, pageOfEvents] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.serviceInstance(params.serviceGUID),
    cf.auditEvents(page, /* targetGUIDs */ [params.serviceGUID]),
  ]);

  const {resources: events, pagination} = pageOfEvents;

  let eventActorEmails: {[key: string]: string} = {};
  const userActorGUIDs = lodash
    .chain(events)
    .filter(e => e.actor.type === 'user')
    .map(e => e.actor.guid)
    .uniq()
    .value()
  ;

  if (userActorGUIDs.length > 0) {
    const actorAccounts: ReadonlyArray<IAccountsUser> = await accountsClient.getUsers(userActorGUIDs);

    eventActorEmails = lodash
      .chain(actorAccounts)
      .keyBy(account => account.uuid)
      .mapValues(account => account.email)
      .value()
    ;
  }

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = fromOrg(ctx, organization, [
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
    body: serviceEventsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      organization, space, service, breadcrumbs,
      events, eventTypeDescriptions, eventActorEmails,
      pagination, page,
    }),
  };
}
