import moment from 'moment';
import uuid from 'uuid';

import { IContext } from '../app/context';
import { BillingClient } from '../lib/billing';
import { IParameters, IResponse } from '../lib/router';

import calculatorTemplate from './calculator.njk';

interface IService {
  readonly id: string;
  readonly kind: string;
  readonly plan: string;
  readonly description?: string;
  readonly memory?: string;
  readonly instances?: string;
}

type Estimate = ReadonlyArray<IService>;

interface IQuota {
  readonly instances: ReadonlyArray<IBillableEvent>;
  readonly exVAT: number;
  readonly incVAT: number;
}

export async function getCalculator(ctx: IContext, params: IParameters): Promise<IResponse> {
  const billing = new BillingClient({
    apiEndpoint: ctx.app.billingAPI,
  });

  const plans = await billing.getPricingPlans({
    rangeStart: moment().startOf('month').toDate(),
    rangeStop: moment().endOf('month').toDate(),
  });
  const servicesByName = hackAllTheUglyThingsPrettyPlease(plans);

  /* istanbul ignore next */ // The `|| 'unknown'` and the following ifstatement are not precisely exciting to test.
  const servicesByNameByVersion = Object.keys(servicesByName)
    .reduce((services: {[i: string]: object}, name: string) => {
      services[name] = servicesByName[name].reduce((servicesByVersion: {[i: string]: IPricingPlan[]}, service) => {
        const version = service.name.split('-').pop() || 'unknown';
        if (!servicesByVersion[version]) {
          servicesByVersion[version] = [];
        }
        servicesByVersion[version].push(service);

        return servicesByVersion;
      }, {});
      return services;
    }, {});

  const estimate = prepareEstimate(params, plans);
  const quota = await getQuota(billing, estimate);

  return {
    body: calculatorTemplate.render({
      estimate,
      quota,
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      services: servicesByNameByVersion,
    }),
  };
}

async function getQuota(billing: BillingClient, estimation: Estimate): Promise<IQuota> {
  const rangeStart = moment().startOf('month').toDate();
  const rangeStop =  moment().endOf('month').toDate();
  const estimatedEvents = estimation.reduce((events: IUsageEvent[], service: IService) => {
    if (service.id) {
      events.push({
        eventGUID: uuid.v4(),
        resourceGUID: service.id,
        resourceName: service.description || 'unknown',
        resourceType: service.kind,
        orgGUID: '00000001-0000-0000-0000-000000000000',
        spaceGUID: '00000001-0001-0000-0000-000000000000',
        eventStart: rangeStart,
        eventStop: rangeStop,
        // The following is a static GUID representing Compute Plan in Billing API.
        planGUID: service.plan || 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
        numberOfNodes: parseFloat(service.instances || '1'),
        memoryInMB: parseFloat(service.memory || '0') * 1024,
        storageInMB: 1024,
      });
    }

    return events;
  }, []);

  const forecastEvents = await billing.getForecastEvents({
    rangeStart,
    rangeStop,
    orgGUIDs: ['00000001-0000-0000-0000-000000000000'],
    events: estimatedEvents,
  });

  return {
    instances: forecastEvents,
    exVAT: forecastEvents.reduce((total: number, instance: IBillableEvent) => total + instance.price.exVAT, 0),
    incVAT: forecastEvents.reduce((total: number, instance: IBillableEvent) => total + instance.price.incVAT, 0),
  };
}

function prepareEstimate(params: IParameters, plans: ReadonlyArray<IPricingPlan>): Estimate {
  const {estimate, remove, ...services} = params;
  const oldEstimate: Estimate = JSON.parse(estimate || '[]');
  const serviceKinds: string[] = JSON.parse(JSON.stringify(Object.keys(services)));
  const newServices: IService[] = serviceKinds.reduce((list: IService[], kind: string) => {
    const service: IService = JSON.parse(JSON.stringify(services[kind]));

    list.push({
      ...service,
      kind,
      description: hackUglyPlanNamesPrettyPlease(plans, {...service, kind}) || service.description || 'unknown',
    });
    return list;
  }, []);

  const newEstimate = [
    ...(remove ? oldEstimate.reduce(removeFromEstimate(remove), []) : oldEstimate),
  ];

  for (const service of newServices) {
    if (service.kind === 'app' && (!service.description || !service.memory)) {
      continue;
    }

    newEstimate.push({
      ...service,
      id: uuid.v4(),
    });
  }

  return newEstimate;
}

function removeFromEstimate(list: ReadonlyArray<string>) {
  return (l: IService[], s: IService) => {
    if (!list.includes(s.id)) {
      l.push(s);
    }
    return l;
  };
}

// The name represents how badly we need to take that function away from this code.
// It is unreliable and should be done probably on the billing api side instead.
function hackAllTheUglyThingsPrettyPlease(plans: ReadonlyArray<IPricingPlan>) {
  const services: {[i: string]: IPricingPlan[]} = {};

  for (const plan of plans) {
    const [serviceName, planName] = plan.name.split(' ');

    if (['prometheus', 'cloudfront', 'task', 'app'].includes(serviceName)) {
      continue;
    }

    services[serviceName] = services[serviceName] || [];

    /* istanbul ignore next */
    if (!planName) {
      throw new Error('cannot coop with the data - hackAllTheUglyThingsPrettyPlease');
    }

    services[serviceName].push({
      ...plan,
      name: planName,
    });
  }

  return services;
}

function hackUglyPlanNamesPrettyPlease(plans: ReadonlyArray<IPricingPlan>, service: IService): string | null {
  if (service.plan) {
    const servicePlan = plans.find((plan: IPricingPlan) => plan.planGUID === service.plan);

    if (servicePlan) {
      return servicePlan.name.replace(service.kind, '').trim();
    }
  }

  return null;
}
