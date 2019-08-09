import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import appLogsTemplate from './app-logs.njk';
import CloudFoundryClient from '../../lib/cf';

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
  return {
    body: appLogsTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      application, space, organization,
    }),
  };
}
