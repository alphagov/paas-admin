import lodash from 'lodash';

import {AccountsClient, IAccountsUser} from '../../lib/accounts';
import CloudFoundryClient, {eventTypeDescriptions} from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { fromOrg, IBreadcrumb } from '../breadcrumbs';
import applicationEventsTemplate from './application-events.njk';

export async function viewApplicationEvents(ctx: IContext, params: IParameters): Promise<IResponse> {
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

  const [organization, space, application, pageOfEvents] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.application(params.applicationGUID),
    cf.auditEvents(page, /* targetGUIDs */ [params.applicationGUID]),
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
      href: ctx.linkTo('admin.organizations.spaces.applications.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    { text: application.entity.name },
  ]);

  return {
    body: applicationEventsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      organization, space, application, breadcrumbs,
      events, eventTypeDescriptions, eventActorEmails,
      pagination, page,
    }),
  };
}
