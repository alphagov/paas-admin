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
  GUID: string;
  name: string;
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
  const selectedSpaceParam = params.space ? params.space : 'All spaces';
  const selectedPlanParam = params.services ? params.services : 'All services';
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

  /* istanbul ignore next */
  const totals = {
    incVAT: events.reduce((sum, event) => sum + event.price.incVAT, 0),
    exVAT: events.reduce((sum, event) => sum + event.price.exVAT, 0),
  };

  const listOfPastYearMonths: {[i: string]: string} = {};

  for (let i = 0; i < 12; i++) {
    const month = moment().subtract(i, 'month').startOf('month');

    listOfPastYearMonths[month.format(YYYMMDD)] = `${month.format('MMMM')} ${month.format('YYYY')}`;
  }

  function filterList(itemsList: any, itemKeys: any, filterGUID: string) {
    const tempArray: string[] = [];
    const filteredItems = itemsList
      .filter((item: any) => {
        if (!tempArray.includes(item[filterGUID])) {
          tempArray.push(item[filterGUID]);
          return true;
        }
      })
      .map((item: any) => {
        const itemName = itemKeys.length > 1 ? getFilterName(item, itemKeys) : item[itemKeys];
        return { GUID : item[filterGUID], name: itemName };
      });
    return filteredItems;
  }

  const spaceKeys = ['space', 'entity', 'name'];
  const spaceFilters = filterList(items, spaceKeys, 'spaceGUID');

  function getFilterName(tempItem: any, itemKeys: string) {
    let namedItem = tempItem;
    for (const key of itemKeys) {
      namedItem = namedItem[key];
    }
    return namedItem;
  }

  function compare(a: IFilterTuple, b: IFilterTuple) {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  }

  const spaceDefault = { GUID: 'none', name: 'All spaces' };
  spaceFilters.sort(compare);
  spaceFilters.unshift(spaceDefault);

  function selectedFilter(filterCollection: any, selectedParameter: string) {
    return filterCollection.filter((filterItem: any) => {
      return filterItem.GUID === selectedParameter;
    })[0];
  }

  let selectedSpace: IFilterTuple = selectedFilter(spaceFilters, selectedSpaceParam);

  selectedSpace = selectedSpace ? selectedSpace : spaceDefault;

  function filterItems(itemsToFilter: any, filterGUID: string, selectedFilterItem: IFilterTuple) {
    return itemsToFilter.filter((item: any) => {
      if (selectedFilterItem.GUID === 'none') {
        return item;
      }
      if (selectedFilterItem.GUID === item[filterGUID]) {
        return item;
      }
    });
  }

  items = filterItems(items, 'spaceGUID', selectedSpace);

  const planKeys = ['planName'];
  const planFilters = filterList(items, planKeys, 'planGUID');
  const planDefault = { GUID: 'none', name: 'All services' };
  planFilters.sort(compare);
  planFilters.unshift(planDefault);

  let selectedPlan = selectedFilter(planFilters, selectedPlanParam);

  selectedPlan = selectedPlan ? selectedPlan : planDefault;

  items = filterItems(items, 'planGUID', selectedPlan);

  return { body: usageTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      organization,
      filter,
      totals,
      items,
      spaceFilters,
      planFilters,
      usdExchangeRate,
      isCurrentMonth:
        Object.keys(listOfPastYearMonths)[0] === params.rangeStart,
      listOfPastYearMonths,
      selectedMonth: params.rangeStart,
      selectedSpace,
      selectedPlan,
      currentMonth,
      isAdmin,
      isBillingManager,
      isManager,
    }) };
}
