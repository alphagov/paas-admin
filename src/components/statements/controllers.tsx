import { add, format, isValid, startOfMonth, sub } from 'date-fns';
import React from 'react';

import { Template } from '../../layouts';
import { BillingClient } from '../../lib/billing';
import { IBillableEvent } from '../../lib/billing/types';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';
import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
} from '../auth';
import { IOrganizationSkeleton, fromOrg } from '../breadcrumbs';
import { UserFriendlyError } from '../errors';

import { IFilterResource, StatementsPage } from './views';

interface IResourceUsage {
  readonly resourceGUID: string;
  readonly resourceName: string;
  readonly resourceType: string;
  readonly orgGUID: string;
  readonly spaceGUID: string;
  readonly spaceName: string;
  readonly planGUID: string;
  readonly planName: string;
  readonly price: {
    readonly incVAT: number;
    readonly exVAT: number;
  };
}

interface IResourceGroup {
  readonly [key: string]: IResourceUsage;
}

interface IFilterTuple {
  readonly guid: string;
  readonly name: string;
}

interface IResourceWithResourceName {
  readonly resourceName: string;
}

interface IResourceWithPlanName {
  readonly planName: string;
}

export type ISortableBy = 'name' | 'space' | 'plan' | 'amount';
export type ISortableDirection = 'asc' | 'desc';

export interface ISortable {
  readonly sort: ISortableBy;
  readonly order: ISortableDirection;
}

const YYYMMDD = 'yyyy-MM-dd';



export function sortByName(a: IFilterTuple, b: IFilterTuple): number {
  if (a.name < b.name) {
    return -1;
  }
  if (a.name > b.name) {
    return 1;
  }

  return 0;
}

export function sortByResourceName(a: IResourceWithResourceName, b: IResourceWithResourceName): number {
  if (a.resourceName < b.resourceName) {
    return -1;
  }
  if (a.resourceName > b.resourceName) {
    return 1;
  }

  return 0;
}

export function sortByPlan(a: IResourceWithPlanName, b: IResourceWithPlanName): number {
  if (a.planName < b.planName) {
    return -1;
  }
  if (a.planName > b.planName) {
    return 1;
  }

  return 0;
}

export function sortBySpace(a: IResourceUsage, b: IResourceUsage): number {
  if (a.spaceName < b.spaceName) {
    return -1;
  }
  if (a.spaceName > b.spaceName) {
    return 1;
  }

  return 0;
}

export function composeCSV(
  items: ReadonlyArray<IResourceUsage>,
  adminFee: number,
): string {
  const lines = ['Name,Space,Plan,Ex VAT,Inc VAT'];

  for (const item of items) {
    const fields = [
      item.resourceName,
      item.spaceName,
      item.planName,
      item.price.exVAT.toFixed(2),
      item.price.incVAT.toFixed(2),
    ];

    lines.push(fields.join(','));
  }

  /* istanbul ignore next */
  const totals = {
    exVAT: items.reduce((sum, event) => sum + event.price.exVAT, 0),
    incVAT: items.reduce((sum, event) => sum + event.price.incVAT, 0),
  };
  const adminFees = {
    exVAT: totals.exVAT * adminFee,
    incVAT: totals.incVAT * adminFee,
  };
  const toatlsIncludingAdminFee = {
    exVAT: (totals.exVAT + adminFees.exVAT).toFixed(2),
    incVAT: (totals.incVAT + adminFees.incVAT).toFixed(2),
  };

  lines.push(',,,,');
  lines.push(
    `10% Administration fees,,,${adminFees.exVAT.toFixed(
      2,
    )},${adminFees.incVAT.toFixed(2)}`,
  );
  lines.push(
    `Total,,,${toatlsIncludingAdminFee.exVAT},${toatlsIncludingAdminFee.incVAT}`,
  );

  return lines.join('\n');
}

export function order(list: ReadonlyArray<IResourceUsage>, sort: ISortable): ReadonlyArray<IResourceUsage> {
  const items = [...list];

  switch (sort.sort) {
    case 'plan':
      items.sort(sortByPlan);
      break;
    case 'space':
      items.sort(sortBySpace);
      break;
    case 'amount':
      items.sort((x, y) => x.price.incVAT - y.price.incVAT);
      break;
    case 'name':
    default:
      items.sort(sortByResourceName);
  }

  return sort.order === 'asc' ? items : items.reverse();
}

export async function statementRedirection(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const date = params.rangeStart ? new Date(params.rangeStart) : new Date();

  return await Promise.resolve({
    redirect: ctx.linkTo('admin.statement.view', {
      ...params,
      rangeStart: format(startOfMonth(date), YYYMMDD),
    }),
  });
}

export async function viewStatement(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const rangeStart = new Date(params.rangeStart);
  const filterSpace = params.space ? params.space : 'none';
  const filterService = params.service ? params.service : 'none';
  if (!isValid(rangeStart)) {
    throw new Error('Billing Statement: invalid rangeStart provided');
  }

  if (rangeStart.getDate() > 1) {
    throw new Error(
      'Billing Statement: expected rangeStart to be the first day of the month',
    );
  }

  const currentMonth = format(rangeStart, 'MMMM');

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

  let organization: IOrganizationSkeleton = {
    metadata: { guid: params.organizationGUID },
    entity: { name: 'deleted-org' },
  };

  // we still want to check bills for deleted orgs
  try {
    organization = await cf.organization(params.organizationGUID);
  } catch(e) {
    /* istanbul ignore next */
    if (e.code != 404 && !isAdmin) {
      throw e;
    }
  }

  if (!isAdmin) {
    const [isManager, isBillingManager] = await Promise.all([
      cf.hasOrganizationRole(
        params.organizationGUID,
        ctx.token.userID,
        'org_manager',
      ),
      cf.hasOrganizationRole(
        params.organizationGUID,
        ctx.token.userID,
        'billing_manager',
      ),
    ]);

    /* istanbul ignore next */
    if (!isManager && !isBillingManager) {
      throw new UserFriendlyError(
        'Billing is currently unavailable, please try again later.',
      );
    }
  }

  const billingClient = new BillingClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.billingAPI,
    logger: ctx.app.logger,
  });

  const filter = {
    orgGUIDs: [organization.metadata.guid],
    rangeStart: rangeStart,
    rangeStop: add(rangeStart, { months: 1 }),
  };

  let events;
  try {
    events = await billingClient.getBillableEvents(filter);
  } catch {
    throw new UserFriendlyError(
      'Billing is currently unavailable, please try again later.',
    );
  }

  /* istanbul ignore next */
  const cleanEvents = events.map(ev => ({
    ...ev,
    resourceName: /__conduit_\d+__/.test(ev.resourceName)
      ? 'conduit-tunnel'
      : ev.resourceName,
  }));

  const currencyRates = await billingClient.getCurrencyRates(filter);
  const usdCurrencyRates = currencyRates.filter(
    currencyRate => currencyRate.code === 'USD',
  );

  /* istanbul ignore next */
  const itemsObject: IResourceGroup = cleanEvents.reduce(
    (resources: IResourceGroup, event: IBillableEvent) => {
      const key = [
        event.orgGUID,
        event.spaceGUID,
        event.planGUID,
        event.resourceName,
      ].join(':');
      const { [key]: resource, ...rest } = resources;

      if (!resource) {
        return {
          ...rest,
          [key]: {
            ...event,
            planName:
              event.price.details
                .map(pc => pc.planName.replace('Free', 'micro'))
                .find(name => name !== '') || 'unknown',
          },
        };
      }

      const { price, ...resourceFields } = resource;

      return {
        ...rest,
        [key]: {
          ...resourceFields,
          price: {
            exVAT: price.exVAT + event.price.exVAT,
            incVAT: price.incVAT + event.price.incVAT,
          },
        },
      };
    },
    {},
  );

  const items = Object.values(itemsObject);

  const listOfPastYearMonths: { [i: string]: string } = {};

  for (let i = 0; i < 12; i++) {
    const month = sub(startOfMonth(new Date()), { months: i });

    listOfPastYearMonths[format(month, YYYMMDD)] = `${format(month, 'MMMM yyyy')}`;
  }

  const orderBy = params.sort || 'name';
  const orderDirection = params.order || 'asc';

  const spaces = items.reduce((all: ReadonlyArray<IFilterResource>, next) => {
    return !all.find(i => i.guid === next.spaceGUID) ? [ ...all, { guid: next.spaceGUID, name: next.spaceName } ] : all;
  }, []);

  const plans = items.reduce((all: ReadonlyArray<IFilterResource>, next) => {
    return !all.find(i => i.guid === next.planGUID) ? [ ...all, { guid: next.planGUID, name: next.planName } ] : all;
  }, []);

  const listSpaces = [
    { guid: 'none', name: 'All spaces' },
    ...[...spaces].sort(sortByName),
  ];
  const listPlans = [
    { guid: 'none', name: 'All Services' },
    ...[...plans].sort(sortByName),
  ];

  const unorderedFilteredItems = items.filter(
    item =>
      (filterSpace === 'none' || item.spaceGUID === filterSpace) &&
      (filterService === 'none' || item.planGUID === filterService),
  );
  const filteredItems = order(unorderedFilteredItems, {
    order: orderDirection,
    sort: orderBy,
  });

  if (params.download) {
    return {
      download: {
        data: composeCSV(filteredItems, ctx.app.adminFee),
        name: `statement-${format(filter.rangeStop, YYYMMDD)}.csv`,
      },
    };
  }

  /* istanbul ignore next */
  const totals = {
    exVAT: filteredItems.reduce((sum, event) => sum + event.price.exVAT, 0),
    incVAT: filteredItems.reduce((sum, event) => sum + event.price.incVAT, 0),
  };

  const updatedTitle = `Organisation ${organization.entity.name} Monthly billing statement\
    for ${currentMonth}\
    ${listSpaces
      .filter(space => space.guid === (params.space || 'none'))
      .map(space => (space.guid === 'none' ? '' : `in ${space.name.toLowerCase()} space`))
    }
    ${listPlans
      .filter(service => service.guid === (params.service || 'none'))
      .map(service => (service.guid === 'none' ? '' : `with ${service.name.toLowerCase()} services`))
    }\
    ordered by ${orderBy === 'amount' ? 'Inc VAT' : orderBy} column
    in ${orderDirection === 'asc' ? 'ascending' : 'descending'} order
  `;

  const template = new Template(ctx.viewContext, updatedTitle);
  template.breadcrumbs = fromOrg(ctx, organization, [
    { text: 'Monthly billing statement' },
  ]);

  return {
    body: template.render(
      <StatementsPage
        listOfPastYearMonths={listOfPastYearMonths}
        spaces={listSpaces}
        plans={listPlans}
        currentMonth={currentMonth}
        adminFee={ctx.app.adminFee}
        totals={totals}
        usdCurrencyRates={usdCurrencyRates}
        isCurrentMonth={
          Object.keys(listOfPastYearMonths)[0] === params.rangeStart
        }
        csrf={ctx.viewContext.csrf}
        filterMonth={params.rangeStart}
        filterService={listPlans.find(
          i => i.guid === (params.service || 'none'),
        )}
        filterSpace={listSpaces.find(i => i.guid === (params.space || 'none'))}
        linkTo={ctx.linkTo}
        organizationGUID={organization.metadata.guid}
        organisationName={organization.entity.name}
        orderBy={orderBy}
        orderDirection={orderDirection}
        items={filteredItems}
      />,
    ),
  };
}

export async function downloadCSV(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  return await viewStatement(ctx, { ...params, download: true });
}
