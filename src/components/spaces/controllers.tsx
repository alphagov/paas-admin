import lodash from 'lodash';
import React from 'react';

import { Template } from '../../layouts';
import { AccountsClient, IAccountsUser } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import {
  IApplication,
  IOrganizationUserRoles,
  IRoute,
  IServiceInstance,
  ISpace,
} from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';
import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
} from '../auth';
import { fromOrg } from '../breadcrumbs';

import {
  ApplicationsPage,
  BackingServicePage,
  EventPage,
  EventsPage,
  IStripedUserServices,
  SpacesPage,
} from './views';

function buildURL(route: IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

async function hydrateAccountsUsernames(
  userRoles: ReadonlyArray<IOrganizationUserRoles>,
  accountsClient: AccountsClient,
): Promise<ReadonlyArray<IOrganizationUserRoles>> {
  const users = await Promise.all(
    userRoles.map(async (user: IOrganizationUserRoles) => {
      const accountsUser = await accountsClient.getUser(user.metadata.guid);

      const username: string =
        accountsUser && accountsUser.username
          ? accountsUser.username
          : user.entity.username;

      return {
        entity: {
          active: user.entity.active,
          admin: user.entity.admin,
          audited_organizations_url: user.entity.audited_organizations_url,
          audited_spaces_url: user.entity.audited_spaces_url,
          billing_managed_organizations_url: user.entity.billing_managed_organizations_url,
          default_space_guid: user.entity.default_space_guid,
          managed_organizations_url: user.entity.managed_organizations_url,
          managed_spaces_url: user.entity.managed_spaces_url,
          organization_roles: user.entity.organization_roles,
          organizations_url: user.entity.organizations_url,
          spaces_url: user.entity.spaces_url,
          username,
        },
        metadata: user.metadata,
      };
    }),
  );

  return users as ReadonlyArray<IOrganizationUserRoles>;
}

export async function viewSpaceEvent(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
  });

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const eventGUID = params.eventGUID;

  const [organization, space, event] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.auditEvent(eventGUID),
  ]);

  const eventActorGUID: string | undefined =
    event.actor.type === 'user' ? event.actor.guid : undefined;

  const eventActor: IAccountsUser | null | undefined = eventActorGUID
    ? await accountsClient.getUser(eventActorGUID)
    : undefined;

  const template = new Template(
    ctx.viewContext,
    ` Space ${space.entity.name} Event details`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.spaces.events.view', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
      text: space.entity.name,
    },
    {
      text: 'Event',
    },
  ]);

  return {
    body: template.render(
      <EventPage actor={eventActor} event={event} space={space} />,
    ),
  };
}

export async function viewSpaceEvents(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
  });

  const page: number =
    params.page === undefined ? 1 : parseInt(params.page, 10);

  const [organization, space, pageOfEvents] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.auditEvents(
      page,
      /* targetGUIDs */ undefined,
      /* spaceGUIDs */ [params.spaceGUID],
    ),
  ]);

  const { resources: events, pagination } = pageOfEvents;

  let eventActorEmails: { readonly [key: string]: string } = {};
  const userActorGUIDs = lodash
    .chain(events)
    .filter(e => e.actor.type === 'user')
    .map(e => e.actor.guid)
    .value();
  const userTargetGUIDs = lodash
    .chain(events)
    .filter(e => e.target.type === 'user')
    .map(e => e.target.guid)
    .value();
  const userGUIDs = lodash.uniq(userActorGUIDs.concat(userTargetGUIDs));

  if (userGUIDs.length > 0) {
    const actorAccounts: ReadonlyArray<IAccountsUser> = await accountsClient.getUsers(
      userGUIDs,
    );

    eventActorEmails = lodash
      .chain(actorAccounts)
      .keyBy(account => account.uuid)
      .mapValues(account => account.email)
      .value();
  }

  const template = new Template(
    ctx.viewContext,
    `Space ${space.entity.name} Events`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    { text: space.entity.name },
  ]);

  return {
    body: template.render(
      <EventsPage
        linkTo={ctx.linkTo}
        actorEmails={eventActorEmails}
        events={events}
        organizationGUID={organization.metadata.guid}
        space={space}
        routePartOf={ctx.routePartOf}
        pagination={{ ...pagination, page }}
      />,
    ),
  };
}

export async function listApplications(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [space, applications, organization] = await Promise.all([
    cf.space(params.spaceGUID),
    cf.applications(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  const summarisedApplications = await Promise.all(
    applications.map(async (application: IApplication) => {
      const summary = await cf.applicationSummary(application.metadata.guid);

      return {
        entity: application.entity,
        metadata: application.metadata,
        summary,
        urls: summary.routes.map(buildURL),
      };
    }),
  );

  const template = new Template(
    ctx.viewContext,
    `Space ${space.entity.name} Applications`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    { text: space.entity.name },
  ]);

  return {
    body: template.render(
      <ApplicationsPage
        applications={summarisedApplications}
        linkTo={ctx.linkTo}
        organizationGUID={organization.metadata.guid}
        routePartOf={ctx.routePartOf}
        space={space}
      />,
    ),
  };
}

export async function listBackingServices(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [space, services, userServices, organization] = await Promise.all([
    cf.space(params.spaceGUID),
    cf.spaceServices(params.spaceGUID),
    cf.userServices(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

  const summarisedServices = await Promise.all(
    services.map(async (service: IServiceInstance) => {
      const [plan, serviceDefinition] = await Promise.all([
        cf.servicePlan(service.entity.service_plan_guid),
        cf.service(service.entity.service_guid),
      ]);

      return {
        definition: serviceDefinition,
        entity: service.entity,
        metadata: service.metadata,
        plan,
      };
    }),
  );

  const template = new Template(
    ctx.viewContext,
    `Space ${space.entity.name} Backing services`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    { text: space.entity.name },
  ]);

  return {
    body: template.render(
      <BackingServicePage
        linkTo={ctx.linkTo}
        organizationGUID={organization.metadata.guid}
        routePartOf={ctx.routePartOf}
        services={[
          ...summarisedServices,
          ...((userServices as unknown) as ReadonlyArray<IStripedUserServices>),
        ]}
        space={space}
      />,
    ),
  };
}

export async function listSpaces(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );

  const [
    isManager,
    isBillingManager,
    spaces,
    organization,
    users,
  ] = await Promise.all([
    cf.hasOrganizationRole(
      params.organizationGUID,
      ctx.token.userID,
      'org_manager',
    ),
    cf.hasOrganizationRole(
      params.organizationGUID,
      ctx.token.userID,
      'billing_manager',
    ),
    cf.orgSpaces(params.organizationGUID),
    cf.organization(params.organizationGUID),
    cf.usersForOrganization(params.organizationGUID).then(async orgUsers => {
      return await hydrateAccountsUsernames(orgUsers, accountsClient);
    }),
  ]);

  const summarisedSpaces = await Promise.all(
    spaces.map(async (space: ISpace) => {
      const [applications, quota] = await Promise.all([
        await cf.applications(space.metadata.guid),
        space.entity.space_quota_definition_guid
          ? await cf.spaceQuota(space.entity.space_quota_definition_guid)
          : await Promise.resolve(undefined),
      ]);

      const runningApps = applications.filter(app => app.entity.state.toLowerCase() !== 'stopped');
      const stoppedApps = applications.filter(app => app.entity.state.toLowerCase() === 'stopped');

      const spaceMemoryAllocated = runningApps.reduce(
        (allocated: number, app: IApplication) =>
          allocated + app.entity.memory * app.entity.instances,
        0,
      );

      return {
        apps: applications,
        entity: space.entity,
        memory_allocated: spaceMemoryAllocated,
        metadata: space.metadata,
        quota: quota,
        running_apps: runningApps,
        stopped_apps: stoppedApps,
      };
    }),
  );

  const memoryAllocated = summarisedSpaces.reduce(
    (allocated: number, space: { readonly memory_allocated: number }) =>
      allocated + space.memory_allocated,
    0,
  );
  const summarisedOrganization = {
    entity: organization.entity,
    memory_allocated: memoryAllocated,
    metadata: organization.metadata,
    quota: await cf.organizationQuota(
      organization.entity.quota_definition_guid,
    ),
  };

  const template = new Template(
    ctx.viewContext,
    `Organisation ${summarisedOrganization.entity.name} Overview`,
  );
  template.breadcrumbs = [
    { href: ctx.linkTo('admin.organizations'), text: 'Organisations' },
    { text: organization.entity.name },
  ];

  return {
    body: template.render(
      <SpacesPage
        isAdmin={isAdmin}
        isBillingManager={isBillingManager}
        isManager={isManager}
        linkTo={ctx.linkTo}
        organization={summarisedOrganization}
        spaces={summarisedSpaces}
        users={users}
      />,
    ),
  };
}
