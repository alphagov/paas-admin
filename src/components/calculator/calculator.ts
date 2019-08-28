import {sum} from 'lodash';
import moment from 'moment';
import uuid from 'uuid';

import { BillingClient } from '../../lib/billing';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import calculatorTemplate from './calculator.njk';
import * as formulaGrammar from './formulaGrammar.pegjs';

interface IQuote {
  readonly events: ReadonlyArray<IBillableEvent>;
  readonly exVAT: number;
  readonly incVAT: number;
}

export interface IResourceItem {
  planGUID: string;
  numberOfNodes: string;
  memoryInMB: string;
  storageInMB: string;
}

interface ICalculatorState {
  monthOfEstimate: string;
  rangeStart: string;
  rangeStop: string;
  items: ReadonlyArray<IResourceItem>;
  plans: ReadonlyArray<IPricingPlan>;
}

interface IVersionedPricingPlan extends IPricingPlan {
  version: string;
  variant: string;
}

function toVersionedPricingPlans(plan: IPricingPlan): IVersionedPricingPlan {
  const parts = plan.planName.split('-');
  const version = parts.slice(-1).join('');
  const variant = parts.slice(0, -1).join('-');
  return {
    ...plan,
    version,
    variant,
  };
}

function whitelistServices(p: IPricingPlan): boolean {
  const whitelist = [
    'app',
    'postgres',
    'mysql',
    'redis',
    'elasticsearch',
    'aws-s3-bucket',
  ];
  return whitelist.some(name => name === p.serviceName);
}

function blacklistCompose(p: IPricingPlan): boolean {
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

export async function getCalculator(ctx: IContext, params: IParameters): Promise<IResponse> {
  const monthOfEstimate = moment().format('MMMM YYYY');
  const rangeStart = params.rangeStart || moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = params.rangeStop || moment().endOf('month').format('YYYY-MM-DD');
  const billing = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
    logger: ctx.app.logger,
  });
  const plans = (await billing.getPricingPlans({
    rangeStart: moment(rangeStart).toDate(),
    rangeStop: moment(rangeStop).toDate(),
  })).filter(whitelistServices)
     .filter(blacklistCompose)
     .map(toVersionedPricingPlans)
     .sort(bySize);
  const state: ICalculatorState = {
    monthOfEstimate,
    rangeStart,
    rangeStop,
    items: params.items || [],
    plans,
  };
  let quote: IQuote = { events: [], exVAT: 0, incVAT: 0 };
  if (params.items && params.items.length) {
    quote = await getQuote(state);
  }

  return {
    body: calculatorTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
      state,
      quote,
    }),
  };
}

async function getQuote(state: ICalculatorState): Promise<IQuote> {
  const rangeStart = moment(state.rangeStart);
  const rangeStop = moment(state.rangeStop);
  const forecastEvents = state.items.map((item: IResourceItem) => {
    const plan = state.plans.find(p => p.planGUID === item.planGUID);
    const defaultEvent: IBillableEvent = {
      eventGUID: uuid.v1(),
      resourceGUID: uuid.v4(),
      resourceName: 'unknown',
      resourceType: 'unknown',
      orgGUID: '00000001-0000-0000-0000-000000000000',
      spaceGUID: '00000001-0001-0000-0000-000000000000',
      spaceName: 'spaceName',
      eventStart: rangeStart.toDate(),
      eventStop: rangeStop.toDate(),
      planGUID: item.planGUID,
      numberOfNodes: parseFloat(item.numberOfNodes),
      memoryInMB: parseFloat(item.memoryInMB),
      storageInMB: parseFloat(item.storageInMB),
      price: {
        exVAT: 0,
        incVAT: 0,
        details: [],
      },
    };
    if (!plan) {
      return defaultEvent;
    }
    if (plan.serviceName === 'app') {
      const appEvent = {
        ...defaultEvent,
        resourceName: plan.planName,
        resourceType: plan.serviceName,
        price: {
          ...defaultEvent.price,
          exVAT: calculateQuote(
            defaultEvent.memoryInMB,
            defaultEvent.storageInMB,
            defaultEvent.numberOfNodes,
            plan,
          ),
        },
      };
      return appEvent;
    }
    const serviceEvent = {
      ...defaultEvent,
      resourceName: plan.planName,
      resourceType: plan.serviceName,
      numberOfNodes: plan.numberOfNodes,
      memoryInMB: plan.memoryInMB,
      storageInMB: plan.storageInMB,
      price: {
        ...defaultEvent.price,
        exVAT: calculateQuote(
          plan.memoryInMB,
          plan.storageInMB,
          plan.numberOfNodes,
          plan,
        ),
      },
    };
    return serviceEvent;
  });

  return {
    events: (forecastEvents as IBillableEvent[]),
    exVAT: forecastEvents.reduce((total: number, instance: IBillableEvent) => total + instance.price.exVAT, 0),
    incVAT: forecastEvents.reduce((total: number, instance: IBillableEvent) => total + instance.price.incVAT, 0),
  };
}

function calculateQuote(memoryInMB: number, storageInMB: number, numberOfNodes: number, plan: IPricingPlan): number  {
  return sum(plan.components.map(c => {
    const thirtyDaysInSeconds = 30 * 24 * 60 * 60;
    const formula = c.formula
      .replace('$memory_in_mb', memoryInMB.toString())
      .replace('$storage_in_mb', storageInMB.toString())
      .replace('$number_of_nodes', numberOfNodes.toString())
      .replace('$time_in_seconds', thirtyDaysInSeconds.toString());
    return formulaGrammar.parse(formula);
  }));
}
