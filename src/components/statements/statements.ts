import moment from 'moment';

import { BillingClient } from '../../lib/billing';
import CloudFoundryClient from '../../lib/cf';
import { ISpace } from '../../lib/cf/types';
import { IParameters, IResponse, NotFoundError } from '../../lib/router';

import { IContext } from '../app/context';
import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
} from '../auth';

import usageTemplate from './statements.njk';

interface IResourceUsage {
  readonly resourceGUID: string;
  readonly resourceName: string;
  readonly resourceType: string;
  readonly orgGUID: string;
  readonly spaceGUID: string;
  readonly space: ISpace;
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

interface IFilterTuple {
  readonly metadata: {
    readonly guid: string;
  };
  readonly entity: {
    readonly name: string;
  };
}

interface IResourceWithSpace {
  readonly space: {
    readonly entity: {
      readonly name: string;
    };
  };
}

interface IResourceWithResourceName {
  readonly resourceName: string;
}

interface IResourceWithPlanName {
  readonly planName: string;
}

export type ISortableBy = 'name' | 'space' | 'plan';
export type ISortableDirection = 'asc' | 'desc';

export interface ISortable {
  readonly sort: ISortableBy;
  readonly order: ISortableDirection;
}

const YYYMMDD = 'YYYY-MM-DD';

export async function statementRedirection(ctx: IContext, params: IParameters): Promise<IResponse> {
  const date = params.rangeStart ? moment(params.rangeStart) : moment();

  return {
    redirect: ctx.linkTo('admin.statement.view', {
      ...params,
      rangeStart: date.startOf('month').format(YYYMMDD),
    }),
  };
}

export async function viewStatement(ctx: IContext, params: IParameters): Promise<IResponse> {
  const rangeStart = moment(params.rangeStart, YYYMMDD);
  const filterSpace = params.space ? params.space : 'none';
  const filterService = params.service ? params.service : 'none';
  if (!rangeStart.isValid()) {
    throw new Error('invalid rangeStart provided');
  }

  if (rangeStart.date() > 1) {
    throw new Error('expected rangeStart to be the first of the month');
  }

  const currentMonth = rangeStart.format('MMMM');

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

  let items = Object.values(itemsObject);

  const listOfPastYearMonths: {[i: string]: string} = {};

  for (let i = 0; i < 12; i++) {
    const month = moment().subtract(i, 'month').startOf('month');

    listOfPastYearMonths[month.format(YYYMMDD)] = `${month.format('MMMM')} ${month.format('YYYY')}`;
  }

  const plans = items.reduce((all: any[], next) => {
    if (!all.find(i => i.entity.name === next.planName)) {
      all.push({metadata: {guid: next.planGUID}, entity: {name: next.planName}});
    }

    return all;
  }, []);

  if (filterSpace !== 'none') {
    items = items.reduce((all: IResourceUsage[], next: IResourceUsage) => {
      if (next.spaceGUID === params.space) {
        all.push(next);
      }
      return all;
    }, []);
  }

  if (filterService !== 'none') {
    items = items.reduce((all: IResourceUsage[], next: IResourceUsage) => {
      if (next.planGUID === params.service) {
        all.push(next);
      }
      return all;
    }, []);
  }

  const orderBy = params.sort || 'name';
  const orderDirection = params.order || 'asc';

  const listSpaces = [{metadata: {guid: 'none'}, entity: {name: 'All spaces'}}, ...spaces.sort(sortByName)];
  const listPlans = [{metadata: {guid: 'none'}, entity: {name: 'All Services'}}, ...plans.sort(sortByName)];

  const filteredItems = order(items, {sort: orderBy, order: orderDirection});

  /* istanbul ignore next */
  const totals = {
    incVAT: filteredItems.reduce((sum, event) => sum + event.price.incVAT, 0),
    exVAT: filteredItems.reduce((sum, event) => sum + event.price.exVAT, 0),
  };

  return { body: usageTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      filter,
      totals,
      items: filteredItems,
      spaces: listSpaces,
      plans: listPlans,
      usdExchangeRate,
      isCurrentMonth:
        Object.keys(listOfPastYearMonths)[0] === params.rangeStart,
      listOfPastYearMonths,
      filterMonth: params.rangeStart,
      filterSpace: listSpaces.find(i => i.metadata.guid === (params.space || 'none')),
      filterService: listPlans.find(i => i.metadata.guid === (params.service || 'none')),
      orderBy,
      orderDirection,
      currentMonth,
      isAdmin,
      isBillingManager,
      isManager,
    }) };
}

 // tslint:disable-next-line:readonly-array
export function order(items: IResourceUsage[], sort: ISortable): IResourceUsage[] {
  switch (sort.sort) {
    case 'plan':
      items.sort(sortByPlan);
      break;
    case 'space':
      items.sort(sortBySpace);
      break;
    case 'name':
    default:
      items.sort(sortByResourceName);
  }

  return sort.order === 'asc' ? items : items.reverse();
}

export function sortByName(a: IFilterTuple, b: IFilterTuple) {
  if (a.entity.name < b.entity.name) {
    return -1;
  }
  if (a.entity.name > b.entity.name) {
    return 1;
  }
  return 0;
}

export function sortByResourceName(a: IResourceWithResourceName, b: IResourceWithResourceName) {
  if (a.resourceName < b.resourceName) {
    return -1;
  }
  if (a.resourceName > b.resourceName) {
    return 1;
  }
  return 0;
}

export function sortByPlan(a: IResourceWithPlanName, b: IResourceWithPlanName) {
  if (a.planName < b.planName) {
    return -1;
  }
  if (a.planName > b.planName) {
    return 1;
  }
  return 0;
}

export function sortBySpace(a: IResourceWithSpace, b: IResourceWithSpace) {
  if (a.space.entity.name < b.space.entity.name) {
    return -1;
  }
  if (a.space.entity.name > b.space.entity.name) {
    return 1;
  }
  return 0;
}
