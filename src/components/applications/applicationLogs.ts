import { IContext } from '../app';
import { IParameters, IResponse } from '../../lib/router';
import applicationLogsTemplate from './logs.njk';
import CloudFoundryClient from '../../lib/cf';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_READ_ONLY_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR } from '../auth';
import { IRoute } from '../../lib/cf/types';
import { Request, Response } from 'express';
import EventSource from 'eventsource';
import { IAppConfig } from '../app/app';

function buildURL(route: IRoute): string {
  return [route.host, route.domain.name].filter(x => x).join('.') + route.path;
}

export function streamApplicationLogs(config: IAppConfig): (req: Request, res: Response) => Promise<void> {
  const reverseLogProxyGatewayAPI = config.reverseLogProxyGatewayAPI;
  return async (req: Request, res: Response) => {
    const accessToken = (req as any).token.accessToken;
    const sourceId = req.params.applicationGUID;
    const eventSource = new EventSource(
      `https://${reverseLogProxyGatewayAPI}/v2/read?log&source_id=${sourceId}`,
      { headers: { Authorization: accessToken }}
    );
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
    });
    res.write('\n\n');
    eventSource.onmessage = e => res.write(`data: ${e.data}\n\n`);
  }
}

export async function viewApplicationLogs(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );

  const [isManager, isBillingManager, application, space, organization, applicationSummary] = await Promise.all([
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager'),
    cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager'),
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

  return {
    body: applicationLogsTemplate.render({
      application: summarisedApplication,
      actualRuntimeInfo,
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      space,
      stack,
      organization,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}