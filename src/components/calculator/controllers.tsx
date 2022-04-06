import { randomUUID } from 'crypto';

import { endOfMonth, format, startOfMonth } from 'date-fns';
import { isMatch, sum } from 'lodash';
import React from 'react';

import { Template } from '../../layouts';
import { BillingClient } from '../../lib/billing';
import { IBillableEvent, IPricingPlan, IRate } from '../../lib/billing/types';
import { IParameters, IResponse } from '../../lib/router';
import { IContext } from '../app/context';

import * as formulaGrammar from './formulaGrammar.pegjs';
import {
  CalculatorPage,
  ICalculatorState,
  IQuote,
  IResourceItem,
} from './views';


interface IVersionedPricingPlan extends IPricingPlan {
  readonly version: string;
}

function calculateQuote(
  memoryInMB: number,
  storageInMB: number,
  numberOfNodes: number,
  plan: IPricingPlan,
  currencyRate: IRate,
): number {
  return (
    sum(
      plan.components.map(c => {
        const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
        const formula = c.formula
          .replace('$memory_in_mb', memoryInMB.toString())
          .replace('$storage_in_mb', storageInMB.toString())
          .replace('$number_of_nodes', numberOfNodes.toString())
          .replace('$time_in_seconds', thirtyDaysInSeconds.toString());

        return formulaGrammar.parse(formula);
      }),
    ) * currencyRate.rate
  );
}

async function getQuote(
  billing: BillingClient,
  state: ICalculatorState,
): Promise<IQuote> {
  const rangeStart = new Date(state.rangeStart);
  const rangeStop = new Date(state.rangeStop);
  const rates = await billing.getCurrencyRates({
    rangeStart,
    rangeStop,
  });
  const latestUsdRate = rates.find(currencyRate => currencyRate.code === 'USD');
  /* istanbul ignore if */
  if (!latestUsdRate) {
    throw new Error('could not find an exchange rate for GBP to USD');
  }
  const forecastEvents = state.items.map((item: IResourceItem) => {
    const plan = state.plans.find(p => p.planGUID === item.planGUID);
    const defaultEvent: IBillableEvent = {
      eventGUID: randomUUID(),
      eventStart: rangeStart,
      eventStop: rangeStop,
      memoryInMB: parseFloat(item.memoryInMB),
      numberOfNodes: parseFloat(item.numberOfNodes),
      orgGUID: '00000001-0000-0000-0000-000000000000',
      planGUID: item.planGUID,
      price: {
        details: [],
        exVAT: 0,
        incVAT: 0,
      },
      resourceGUID: randomUUID(),
      resourceName: 'unknown',
      resourceType: 'unknown',
      spaceGUID: '00000001-0001-0000-0000-000000000000',
      spaceName: 'spaceName',
      storageInMB: parseFloat(item.storageInMB),
    };
    if (!plan) {
      return defaultEvent;
    }
    if (plan.serviceName === 'app') {
      const appEvent = {
        ...defaultEvent,
        price: {
          ...defaultEvent.price,
          exVAT: calculateQuote(
            defaultEvent.memoryInMB,
            defaultEvent.storageInMB,
            defaultEvent.numberOfNodes,
            plan,
            latestUsdRate,
          ),
        },
        resourceName: plan.planName,
        resourceType: plan.serviceName,
      };

      return appEvent;
    }
    const serviceEvent = {
      ...defaultEvent,
      memoryInMB: plan.memoryInMB,
      numberOfNodes: plan.numberOfNodes,
      price: {
        ...defaultEvent.price,
        exVAT: calculateQuote(
          plan.memoryInMB,
          plan.storageInMB,
          plan.numberOfNodes,
          plan,
          latestUsdRate,
        ),
      },
      resourceName: plan.planName,
      resourceType: plan.serviceName,
      storageInMB: plan.storageInMB,
    };

    return serviceEvent;
  });

  return {
    events: forecastEvents as ReadonlyArray<IBillableEvent>,
    exVAT: forecastEvents.reduce(
      (total: number, instance: IBillableEvent) => total + instance.price.exVAT,
      0,
    ),
    incVAT: forecastEvents.reduce(
      (total: number, instance: IBillableEvent) =>
        total + instance.price.incVAT,
      0,
    ),
  };
}

function toVersionedPricingPlans(plan: IPricingPlan): IVersionedPricingPlan {
  const versions = plan.planName.match(/\d+(.[\d]+)?/);
  if (versions !== null) {
    return { ...plan, version: versions[0] };
  }

  return { ...plan, version: 'unknown' };
}

function safelistServices(p: IPricingPlan): boolean {
  const safelist = [
    {serviceName: 'app'},
    {serviceName: 'postgres'},
    {serviceName: 'mysql'},
    {serviceName: 'redis'},
    {serviceName: 'opensearch'},
    {serviceName: 'aws-s3-bucket'},
    {serviceName: 'influxdb'},
    // both sqs queue types are priced the same and a meaningless plan
    // selector is weird and ugly
    {serviceName: 'aws-sqs-queue', planName: 'standard'},
  ];

  return safelist.some(query => isMatch(p, query));
}

function filterComposeIOServices(p: IPricingPlan): boolean {
  return !/compose/.test(p.planName);
}

function sizeToNumber(s: string): string {
  return s
    .replace(/^micro/, '0')
    .replace(/^tiny/, '1')
    .replace(/^small/, '2')
    .replace(/^medium/, '3')
    .replace(/^large/, '4')
    .replace(/^xlarge/, '5');
}

function bySize(a: IPricingPlan, b: IPricingPlan): number {
  const nameA = sizeToNumber(a.planName);
  const nameB = sizeToNumber(b.planName);

  return nameA > nameB ? 1 : -1;
}

export async function getCalculator(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const monthOfEstimate = format(new Date(), 'MMMM yyyy');
  /* istanbul ignore next */
  const rangeStart = params.rangeStart ? new Date(params.rangeStart) : startOfMonth(new Date());
  /* istanbul ignore next */
  const rangeStop = params.rangeStop ? new Date(params.rangeStop) : endOfMonth(new Date());
  const billing = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    logger: ctx.app.logger,
  });

  const plans = (
    await billing.getPricingPlans({
      rangeStart: rangeStart,
      rangeStop: rangeStop,
    })
  )
    .filter(safelistServices)
    .filter(filterComposeIOServices)
    .map(toVersionedPricingPlans)
    .sort(bySize);
  const state = {
    items: params.items || [],
    monthOfEstimate,
    plans,
    rangeStart,
    rangeStop,
  };

  const template = new Template(ctx.viewContext, 'Estimate your monthly costs');

  if (params.items && params.items.length) {
    const quote = await getQuote(billing, state);

    return {
      body: template.render(<CalculatorPage state={state} quote={quote} />),
    };
  }

  const defaultQuote: IQuote = { events: [], exVAT: 0, incVAT: 0 };

  return {
    body: template.render(<CalculatorPage state={state} quote={defaultQuote} />),
  };
}
