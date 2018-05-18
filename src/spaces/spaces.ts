import { IContext } from '../app/context';
import CloudFoundryClient from '../cf';
import {
  IApplication,
  IApplicationSummary,
  IOrganizationUserRoles,
  IRoute,
  ISpace,
} from '../cf/types';
import { IParameters, IResponse } from '../lib/router';

import spaceApplicationsTemplate from './applications.njk';
import spaceBackingServicesTemplate from './backing-services.njk';
import spacesTemplate from './spaces.njk';

function buildURL(route: IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

export async function listApplications(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const space = await cf.space(params.spaceGUID);
  const applications = await cf.applications(params.spaceGUID);
  const organization = await cf.organization(space.entity.organization_guid);

  const summarisedSpace = {
    entity: {
      ...space.entity,
      ...await cf.spaceSummary(space.metadata.guid),
    },
    metadata: space.metadata,
  };

  const summarisedApplications = await Promise.all(applications.map(async (application: IApplication) => {
    const summary = await cf.applicationSummary(application.metadata.guid);

    return {
      metadata: application.metadata,
      entity: {
        ...application.entity,
        ...summary,

        urls: summary.routes.map(buildURL),
      },
    };
  }));

  return {
    body: spaceApplicationsTemplate.render({
      applications: summarisedApplications,
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      space: summarisedSpace,
    }),
  };
}

export async function listBackingServices(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const space = await cf.space(params.spaceGUID);
  const organization = await cf.organization(space.entity.organization_guid);

  const summarisedSpace = {
    entity: {
      ...space.entity,
      ...await cf.spaceSummary(space.metadata.guid),
    },
    metadata: space.metadata,
  };

  return {
    body: spaceBackingServicesTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      space: summarisedSpace,
    }),
  };
}

export async function listSpaces(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const spaces = await cf.spaces(params.organizationGUID);
  const organization = await cf.organization(params.organizationGUID);
  const users = await cf.usersForOrganization(params.organizationGUID);
  const managers = users.filter((user: IOrganizationUserRoles) =>
    user.entity.organization_roles.some(role => role === 'org_manager'),
  );

  const summarisedSpaces = await Promise.all(spaces.map(async (space: ISpace) => {
    const summary = await cf.spaceSummary(space.metadata.guid);

    return {
      entity: {
        ...space.entity,
        ...summary,

        running_apps: summary.apps.filter((app: IApplicationSummary) => app.running_instances > 0),
        stopped_apps: summary.apps.filter((app: IApplicationSummary) => app.running_instances === 0),
        memory_allocated: summary.apps.reduce((allocated: number, app: IApplicationSummary) =>
          allocated + app.memory, 0),
        quota: space.entity.space_quota_definition_guid ?
          await cf.spaceQuota(space.entity.space_quota_definition_guid) : null,
      },
      metadata: space.metadata,
    };
  }));

  const summerisedOrganization = {
    entity: {
      ...organization.entity,

      quota: await cf.organizationQuota(organization.entity.quota_definition_guid),
      memory_allocated: summarisedSpaces
        .reduce((allocated: number, space: {entity: {memory_allocated: number}}) => {
          return allocated + space.entity.memory_allocated;
        }, 0),
    },
    metadata: organization.metadata,
  };

  return {
    body: spacesTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      managers,
      organization: summerisedOrganization,
      spaces: summarisedSpaces,
      users,
    }),
  };
}
