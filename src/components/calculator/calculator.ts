import moment from 'moment';
import uuid from 'uuid';

import { BillingClient } from '../../lib/billing';
import { IParameters, IResponse } from '../../lib/router';

import { IContext } from '../app/context';

import calculatorTemplate from './calculator.njk';

interface IQuote {
  readonly events: ReadonlyArray<IBillableEvent>;
  readonly exVAT: number;
  readonly incVAT: number;
}

interface IResourceItem {
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

function byEventGUID(e1: IBillableEvent, e2: IBillableEvent) {
  return e1.eventGUID > e2.eventGUID ? 1 : -1;
}

export async function getCalculator(ctx: IContext, params: IParameters): Promise<IResponse> {
  const monthOfEstimate = moment().format('MMMM YYYY');
  const rangeStart = params.rangeStart || moment().startOf('month').format('YYYY-MM-DD');
  const rangeStop = params.rangeStop || moment().endOf('month').format('YYYY-MM-DD');
  const billing = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
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
  const quote = await getQuote(billing, state);

  return {
    body: calculatorTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      state,
      quote,
      location: ctx.app.location,
    }),
  };
}

async function getQuote(billing: BillingClient, state: ICalculatorState): Promise<IQuote> {
  const rangeStart = moment(state.rangeStart);
  const rangeStop = moment(state.rangeStop);
  const usageEvents = state.items.reduce((events: IUsageEvent[], item: IResourceItem) => {
    return [
      ...events,
      {
        eventGUID: uuid.v1(),
        resourceGUID: uuid.v4(),
        resourceName: (state.plans.find(p => p.planGUID === item.planGUID) || {planName: 'unknown'}).planName,
        resourceType: (state.plans.find(p => p.planGUID === item.planGUID) || {serviceName: 'unknown'}).serviceName,
        orgGUID: '00000001-0000-0000-0000-000000000000',
        spaceGUID: '00000001-0001-0000-0000-000000000000',
        spaceName: 'spaceName',
        eventStart: rangeStart.toDate(),
        eventStop: rangeStop.toDate(),
        planGUID: item.planGUID,
        numberOfNodes: parseFloat(item.numberOfNodes),
        memoryInMB: parseFloat(item.memoryInMB),
        storageInMB: parseFloat(item.storageInMB),
      },
    ];
  }, []);

  const forecastEvents = await billing.getForecastEvents({
    rangeStart: rangeStart.toDate(),
    rangeStop: rangeStop.toDate(),
    orgGUIDs: ['00000001-0000-0000-0000-000000000000'],
    events: usageEvents,
  });

  return {
    events: (forecastEvents as IBillableEvent[]).sort(byEventGUID),
    exVAT: forecastEvents.reduce((total: number, instance: IBillableEvent) => total + instance.price.exVAT, 0),
    incVAT: forecastEvents.reduce((total: number, instance: IBillableEvent) => total + instance.price.incVAT, 0),
  };
}
