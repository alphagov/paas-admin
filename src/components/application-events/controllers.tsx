import lodash from 'lodash';
import React from 'react';

import { Template } from '../../layouts';
import { AccountsClient, IAccountsUser } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { fromOrg } from '../breadcrumbs';

import { ApplicationEventDetailPage, ApplicationEventsPage } from './views';

export async function viewApplicationEvent(
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

  const [organization, space, application, event] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.application(params.applicationGUID),
    cf.auditEvent(eventGUID),
  ]);

  const eventActorGUID: string | undefined =
    event.actor.type === 'user' ? event.actor.guid : undefined;

  const eventActor: IAccountsUser | undefined = eventActorGUID
    ? await accountsClient.getUser(eventActorGUID)
    : undefined;

  const template = new Template(
    ctx.viewContext,
    `Application ${application.entity.name} Event details`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      text: space.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.applications.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    {
      text: application.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.applications.events.view', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
        applicationGUID: application.metadata.guid,
      }),
    },
    {
      text: 'Event',
    },
  ]);

  return {
    body: template.render(
      <ApplicationEventDetailPage
        actor={eventActor || undefined}
        application={application}
        event={event}
      />,
    ),
  };
}

export async function viewApplicationEvents(
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

  const [organization, space, application, pageOfEvents] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.application(params.applicationGUID),
    cf.auditEvents(page, /* targetGUIDs */ [params.applicationGUID]),
  ]);

  const { resources: events, pagination } = pageOfEvents;

  let eventActorEmails: { readonly [key: string]: string } = {};
  const userActorGUIDs = lodash
    .chain(events)
    .filter(e => e.actor.type === 'user')
    .map(e => e.actor.guid)
    .uniq()
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
    `Application ${application.entity.name} Events`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      text: space.entity.name,
      href: ctx.linkTo('admin.organizations.spaces.applications.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    { text: application.entity.name },
  ]);

  return {
    body: template.render(
      <ApplicationEventsPage
        actorEmails={eventActorEmails}
        application={application}
        events={events}
        linkTo={ctx.linkTo}
        organizationGUID={organization.metadata.guid}
        pagination={{ ...pagination, page }}
        routePartOf={ctx.routePartOf}
        spaceGUID={space.metadata.guid}
      />,
    ),
  };
}
