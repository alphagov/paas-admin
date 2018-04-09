import { IContext } from '../app/context';
import * as cf from '../cf/types';
import { IParameters, IResponse } from '../lib/router';

import spaceOverviewTemplate from './overview.njk';
import spacesTemplate from './spaces.njk';

function buildURL(route: cf.IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

export async function listApplications(ctx: IContext, params: IParameters): Promise<IResponse> {
  const space = await ctx.cf.space(params.spaceGUID);
  const applications = await ctx.cf.applications(params.spaceGUID);
  const organization = await ctx.cf.organization(space.entity.organization_guid);

  const summarisedSpace = {
    entity: {
      ...space.entity,
      ...await ctx.cf.spaceSummary(space.metadata.guid),
    },
    metadata: space.metadata,
  };

  const summarisedApplications = await Promise.all(applications.map(async (application: cf.IApplication) => {
    const summary = await ctx.cf.applicationSummary(application.metadata.guid);

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
    body: spaceOverviewTemplate.render({
      applications: summarisedApplications,
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      space: summarisedSpace,
    }),
  };
}

export async function listSpaces(ctx: IContext, params: IParameters): Promise<IResponse> {
  const spaces = await ctx.cf.spaces(params.organizationGUID);
  const organization = await ctx.cf.organization(params.organizationGUID);
  const users = await ctx.cf.usersForOrganization(params.organizationGUID);
  const managers = users.filter((user: cf.IOrganizationUserRoles) =>
    user.entity.organization_roles.some(role => role === 'org_manager'),
  );

  const summarisedSpaces = await Promise.all(spaces.map(async (space: cf.ISpace) => {
    const summary = await ctx.cf.spaceSummary(space.metadata.guid);

    return {
      entity: {
        ...space.entity,
        ...summary,

        running_apps: summary.apps.filter((app: cf.IApplicationSummary) => app.running_instances > 0),
        stopped_apps: summary.apps.filter((app: cf.IApplicationSummary) => app.running_instances === 0),
        memory_allocated: summary.apps.reduce((allocated: number, app: cf.IApplicationSummary) =>
          allocated + app.memory, 0),
        quota: space.entity.space_quota_definition_guid ?
          await ctx.cf.spaceQuota(space.entity.space_quota_definition_guid) : null,
      },
      metadata: space.metadata,
    };
  }));

  const summerisedOrganization = {
    entity: {
      ...organization.entity,

      quota: await ctx.cf.organizationQuota(organization.entity.quota_definition_guid),
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
