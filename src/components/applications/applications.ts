import CloudFoundryClient from '../../lib/cf';
import { IRoute } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';
import { IBreadcrumb } from '../breadcrumbs';

import applicationOverviewTemplate from './overview.njk';

function buildURL(route: IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

export async function viewApplication(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [application, space, organization, applicationSummary] = await Promise.all([
    cf.application(params.applicationGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
    cf.applicationSummary(params.applicationGUID),
  ]);

  const summarisedApplication = {
    entity: {
      ...application.entity,
      ...applicationSummary,
      urls: applicationSummary.routes.map(buildURL),
    },
    metadata: application.metadata,
  };

  const stack = await cf.stack(application.entity.stack_guid);

  const appRuntimeInfo = [
    [
      {text: 'Detected Buildpack'},
      {text: summarisedApplication.entity.detected_buildpack},
    ],
    [
      {text: 'Stack'},
      {text: stack.entity.name},
    ],
  ];
  const dockerRuntimeInfo = [
    [
      {text: 'Docker Image'},
      {text: summarisedApplication.entity.docker_image},
    ],
  ];
  const isDocker = summarisedApplication.entity.docker_image != null;
  const actualRuntimeInfo = isDocker ? dockerRuntimeInfo : appRuntimeInfo;

  const breadcrumbs: ReadonlyArray<IBreadcrumb> = [
    { text: 'Organisations', href: ctx.linkTo('admin.organizations') },
    {
      text: organization.entity.name ,
      href: ctx.linkTo('admin.organizations.view', {organizationGUID: organization.metadata.guid}),
    },
    { text: space.entity.name },
    {
      text: 'Applications',
      href: ctx.linkTo('admin.organizations.spaces.applications.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
    },
    { text: summarisedApplication.entity.name },
  ];

  return {
    body: applicationOverviewTemplate.render({
      application: summarisedApplication,
      actualRuntimeInfo,
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      space,
      stack,
      organization,
      breadcrumbs,
    }),
  };
}
