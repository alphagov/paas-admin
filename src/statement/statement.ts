import moment from 'moment';
import { IContext } from '../app/context';
import { CLOUD_CONTROLLER_ADMIN, CLOUD_CONTROLLER_GLOBAL_AUDITOR, CLOUD_CONTROLLER_READ_ONLY_ADMIN } from '../auth';
import CloudFoundryClient from '../cf';
import { ISpace } from '../cf/types';
import { BillingClient } from '../lib/billing';
import { IParameters, IResponse, NotFoundError } from '../lib/router';

import usageTemplate from './statement.njk';

interface IResourceUsage {
  readonly resourceGUID: string;
  readonly resourceName: string;
  readonly resourceType: string;
  readonly orgGUID: string;
  readonly spaceGUID: string;
  readonly space?: ISpace;
  readonly planGUID: string;
  readonly planName: string;
  readonly price: {
    incVAT: number;
    exVAT: number;
  };
}

interface IResourceGroup {
  readonly [key: string]: IResourceUsage;
}

const YYYMMDD = 'YYYY-MM-DD';

export async function viewStatement(ctx: IContext, params: IParameters): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, YYYMMDD);
  if (!rangeStart.isValid()) {
    throw new Error('invalid rangeStart provided');
  }

  if (rangeStart.date() > 1) {
    throw new Error('expected rangeStart to be the first of the month');
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
  });

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );
  const isManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'org_manager');
  const isBillingManager = await cf.hasOrganizationRole(params.organizationGUID, ctx.token.userID, 'billing_manager');

  /* istanbul ignore next */
  if (!isAdmin && !isManager && !isBillingManager) {
    throw new NotFoundError('not found');
  }

  const organization = await cf.organization(params.organizationGUID);
  const spaces = await cf.spaces(params.organizationGUID);

  const billingClient = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    accessToken: ctx.token.accessToken,
  });

  const filter = {
    rangeStart: rangeStart.toDate(),
    rangeStop: rangeStart.add(1, 'month').toDate(),
    orgGUIDs: [organization.metadata.guid],
  };

  const events = await billingClient.getBillableEvents(filter);

  /* istanbul ignore next */
  const cleanEvents = events.map(ev => ({
    ...ev,
    resourceName: /__conduit_\d+__/.test(ev.resourceName) ?
      'conduit-tunnel' : ev.resourceName,
  }));

  let usdExchangeRate: number = 1;

  /* istanbul ignore next */
  const itemsObject: IResourceGroup = cleanEvents.reduce((resources: IResourceGroup, event: IBillableEvent) => {
    const key = [event.orgGUID, event.spaceGUID, event.planGUID, event.resourceName].join(':');
    const {[key]: resource, ...rest} = resources;

    event.price.details.forEach(detail => {
      if (detail.currencyCode === 'USD') {
        usdExchangeRate = detail.currencyRate;
      }
    });

    if (!resource) {
      return {...rest, [key]: {
        ...event,
        planName: event.price.details.map(pc => pc.planName.replace('Free', 'micro'))
          .find(name => name !== '') || 'unknown',
        space: spaces.find(s => s.metadata.guid === event.spaceGUID),
      }};
    }

    const {price, ...resourceFields} = resource;
    return {...rest, [key]: {
      ...resourceFields,
      price: {
        exVAT: price.exVAT + event.price.exVAT,
        incVAT: price.incVAT + event.price.incVAT,
      },
    }};
  }, {});

  const items = Object.values(itemsObject);

  /* istanbul ignore next */
  const totals = {
    incVAT: events.reduce((sum, event) => sum + event.price.incVAT, 0),
    exVAT: events.reduce((sum, event) => sum + event.price.exVAT, 0),
  };

  return {
    body: usageTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      filter,
      totals,
      items,
      usdExchangeRate,
      isAdmin,
      isBillingManager,
      isManager,
    }),
  };
}
