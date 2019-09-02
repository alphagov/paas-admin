import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';
import { IBreadcrumb } from '../breadcrumbs';

import appLogsTemplate from './app-logs.njk';
import CloudFoundryClient from '../../lib/cf';
import { IAppConfig } from '../app';
import { Request, Response } from 'express';
import EventSource from 'eventsource';

export async function viewAppLogs(
  ctx: IContext, params: IParameters,
): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });
  const [application, space, organization] = await Promise.all([
    cf.application(params.applicationGUID),
    cf.space(params.spaceGUID),
    cf.organization(params.organizationGUID),
  ]);

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
    { text: application.entity.name },
  ];

  return {
    body: appLogsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      application, space, organization,
      breadcrumbs,
    }),
  };
}

export function streamApplicationLogs(config: IAppConfig): (req: Request, res: Response) => Promise<void> {
  const reverseLogProxyGatewayAPI = config.reverseLogProxyGatewayAPI;
  return async (req: Request, res: Response) => {
    const accessToken = (req as any).token.accessToken;
    const sourceId = req.params.applicationGUID;
    const url = `${reverseLogProxyGatewayAPI}/v2/read?log&source_id=${sourceId}`;
    const eventSource = new EventSource(
      url,
      { headers: { Authorization: `bearer ${accessToken}` }},
    );
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    res.write('\n\n');

    eventSource.onmessage = (e) => {
      res.write(`data: ${e.data}\n\n`);
    };

    eventSource.onerror = (e) => {
      config.logger.error(e);
      res.write(`event: error\ndata:\n\n`);
    };

    req.connection.on('close', () => eventSource.close());
  };
}
