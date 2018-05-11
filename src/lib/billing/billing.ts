import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import moment from 'moment';
import qs from 'qs';

const DEFAULT_TIMEOUT = 30000;

interface IBillingClientConfig {
  readonly apiEndpoint: string;
  readonly accessToken?: string;
}

export default class BillingClient {
  constructor(private readonly config: IBillingClientConfig) {
    this.config = config;
  }

  public async request(req: AxiosRequestConfig): Promise<AxiosResponse> {
    return request({
      baseURL: this.config.apiEndpoint,
      headers: {
        Authorization: `Bearer ${this.config.accessToken}`,
      },
      paramsSerializer(params) {
        return qs.stringify(params, {
          indices: false,
        });
      },
      ...req,
    });
  }

  public async getBillableEvents(params: IEventFilter): Promise<ReadonlyArray<IBillableEvent>> {
    const response = await this.request({
      url: '/billable_events',
      params: {
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
        org_guid: params.orgGUIDs,
      },
    });

    const data: ReadonlyArray<IBillableEventResponse> = response.data;

    return data.map(parseBillableEvent);
  }

  public async getForecastEvents(params: IForecastParameters): Promise<ReadonlyArray<IBillableEvent>> {
    const response = await this.request({
      url: '/forecast_events',
      params: {
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
        org_guid: params.orgGUIDs,
        events: JSON.stringify(params.events.map(parseUsageEventResponse)),
      },
    });

    const data: ReadonlyArray<IBillableEventResponse> = response.data;

    return data.map(parseBillableEvent);
  }

  public async getPricingPlans(params: IRangeable): Promise<ReadonlyArray<IPricingPlan>> {
    const response = await this.request({
      url: '/pricing_plans',
      params: {
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
      },
    });

    const data: ReadonlyArray<IPricingPlanResponse> = response.data;

    return data.map(parsePricingPlan);
  }
}

function parseDate(d: Date): string {
  const m = moment(d);
  return m.format('YYYY-MM-DD');
}

function parseTimestamp(s: string): Date {
  const m = moment(s, moment.ISO_8601);
  if (!m.isValid()) {
    throw new Error(`invalid date format: ${s}`);
  }

  return moment(s, moment.ISO_8601).toDate();
}

function parseNumber(s: string): number {
  const n = parseFloat(s);

  if (isNaN(n)) {
    throw new Error(`failed to parse '${s}' as a number`);
  }

  return n;
}

function parseUsageEvent(ev: IUsageEventResponse): IUsageEvent {
  return {
    eventGUID: ev.event_guid,
    eventStart: parseTimestamp(ev.event_start),
    eventStop: parseTimestamp(ev.event_stop),
    resourceGUID: ev.resource_guid,
    resourceName: ev.resource_name,
    resourceType: ev.resource_type,
    orgGUID: ev.org_guid,
    spaceGUID: ev.space_guid,
    planGUID: ev.plan_guid,
    numberOfNodes: ev.number_of_nodes,
    memoryInMB: ev.memory_in_mb,
    storageInMB: ev.storage_in_mb,
  };
}

function parseUsageEventResponse(ev: IUsageEvent): IUsageEventResponse {
  return {
    event_guid: ev.eventGUID,
    event_start: parseDate(ev.eventStart),
    event_stop: parseDate(ev.eventStop),
    resource_guid: ev.resourceGUID,
    resource_name: ev.resourceName,
    resource_type: ev.resourceType,
    org_guid: ev.orgGUID,
    space_guid: ev.spaceGUID,
    plan_guid: ev.planGUID,
    number_of_nodes: ev.numberOfNodes,
    memory_in_mb: ev.memoryInMB,
    storage_in_mb: ev.storageInMB,
  };
}

function parsePriceComponent(pc: IPriceComponentResponse): IPriceComponent {
  return {
    name: pc.name,
    planName: pc.plan_name,
    start: parseTimestamp(pc.start),
    stop: parseTimestamp(pc.stop),
    VATCode: pc.vat_code,
    VATRate: parseNumber(pc.vat_rate),
    currencyCode: pc.currency_code,
    currencyRate: parseNumber(pc.currency_rate),
    incVAT: parseNumber(pc.inc_vat),
    exVAT: parseNumber(pc.ex_vat),
  };
}

function parseBillableEvent(ev: IBillableEventResponse): IBillableEvent {
  return {
    ...parseUsageEvent(ev),
    price: {
      incVAT: parseNumber(ev.price.inc_vat),
      exVAT: parseNumber(ev.price.ex_vat),
      details: ev.price.details.map(parsePriceComponent),
    },
  };
}

function parsePricingPlan(plan: IPricingPlanResponse): IPricingPlan {
  return {
    name: plan.name,
    planGUID: plan.plan_guid,
    validFrom: parseTimestamp(plan.valid_from),
    components: plan.components.map(parseComponentResponse),
    numberOfNodes: plan.number_of_nodes,
    memoryInMB: plan.memory_in_mb,
    storageInMB: plan.storage_in_mb,
  };
}

// function parsePricingPlanResponse(plan: IPricingPlan): IPricingPlanResponse {
//   return {
//     name: plan.name,
//     plan_guid: plan.planGUID,
//     valid_from: parseDate(plan.validFrom),
//     components: plan.components.map(parseComponent),
//     number_of_nodes: plan.numberOfNodes,
//     memory_in_mb: plan.memoryInMB,
//     storage_in_mb: plan.storageInMB,
//   };
// }

// function parseComponent(component: IComponent): IComponentResponse {
//   return {
//     name: component.name,
//     currency_code: component.currencyCode,
//     formula: component.formula,
//     vat_code: component.vatCode,
//   };
// }

function parseComponentResponse(component: IComponentResponse): IComponent {
  return {
    name: component.name,
    currencyCode: component.currency_code,
    formula: component.formula,
    vatCode: component.vat_code,
  };
}

async function request(req: AxiosRequestConfig): Promise<AxiosResponse> {
  const reqWithDefaults = {
    method: 'get',
    validateStatus,
    timeout: DEFAULT_TIMEOUT,
    ...req,
  };

  const response = await axios.request(reqWithDefaults);

  if (response.status < 200 || response.status >= 300) {
    let msg = `billing: ${reqWithDefaults.method} ${reqWithDefaults.url} failed with status ${response.status}`;

    if (typeof response.data === 'object') {
      msg = `${msg} and data ${JSON.stringify(response.data)}`;
    }

    throw new Error(msg);
  }

  return response;
}

function validateStatus(status: number) {
  return status > 0 && status < 501;
}
