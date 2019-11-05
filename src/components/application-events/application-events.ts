import CloudFoundryClient, {eventTypeDescriptions} from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app';
import { fromOrg, IBreadcrumb } from '../breadcrumbs';
import applicationEventsTemplate from './application-events.njk';

export async function viewApplicationEvents(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const [organization, space, application, events] = await Promise.all([
    cf.organization(params.organizationGUID),
    cf.space(params.spaceGUID),
    cf.application(params.applicationGUID),
    cf.auditEvents(/* targetGUIDs */ [params.applicationGUID]),
  ]);

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
      organization, space, application, events, breadcrumbs,
      eventTypeDescriptions,
    }),
  };
}
