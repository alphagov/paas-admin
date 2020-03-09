import React from 'react';

import { Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IRoute } from '../../lib/cf/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';
import { fromOrg } from '../breadcrumbs';

import { ApplicationPage } from './views';

function buildURL(route: IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

export async function viewApplication(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [
    application,
    space,
    organization,
    applicationSummary,
  ] = await Promise.all([
    cf.application(params.applicationGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
    cf.applicationSummary(params.applicationGUID),
  ]);

  const summarisedApplication = {
    entity: application.entity,
    metadata: application.metadata,
    summary: applicationSummary,
    urls: applicationSummary.routes.map(buildURL),
  };

  const stack = await cf.stack(application.entity.stack_guid);

  const appRuntimeInfo = [
    [
      { text: 'Detected Buildpack' },
      { text: summarisedApplication.entity.detected_buildpack },
    ],
    [{ text: 'Stack' }, { text: stack.entity.name }],
  ];
  const dockerRuntimeInfo = [
    [
      { text: 'Docker Image' },
      { text: summarisedApplication.entity.docker_image },
    ],
  ];
  const isDocker = summarisedApplication.entity.docker_image != null;
  const actualRuntimeInfo = isDocker ? dockerRuntimeInfo : appRuntimeInfo;

  const template = new Template(
    ctx.viewContext,
    `${application.entity.name} - Application Overview`,
  );
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.spaces.applications.list', {
        organizationGUID: organization.metadata.guid,
        spaceGUID: space.metadata.guid,
      }),
      text: space.entity.name,
    },
    { text: summarisedApplication.entity.name },
  ]);

  return {
    body: template.render(
      <ApplicationPage
        application={summarisedApplication}
        routePartOf={ctx.routePartOf}
        linkTo={ctx.linkTo}
        organizationGUID={organization.metadata.guid}
        spaceGUID={space.metadata.guid}
        additionalRuntimeInfo={actualRuntimeInfo}
      />,
    ),
  };
}
