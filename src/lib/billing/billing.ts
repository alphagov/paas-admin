import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { format, isValid } from 'date-fns';
import { BaseLogger } from 'pino';
import qs from 'qs';

import { intercept } from '../axios-logger/axios';

import * as t from './types';

const DEFAULT_TIMEOUT = 300000;

interface IBillingClientConfig {
  readonly apiEndpoint: string;
  readonly accessToken?: string;
  readonly logger: BaseLogger;
}

function parseDate(d: Date): string {
  return format(new Date(d), 'yyyy-MM-dd');
}

function parseTimestamp(s: string): Date {
  const m = new Date(s);
  if (!isValid(m)) {
    throw new Error(`BillingClient: invalid date format: ${s}`);
  }

  return m;
}

function parseNumber(s: string): number {
  const n = parseFloat(s);

  if (isNaN(n)) {
    throw new Error(`BillingClient: failed to parse '${s}' as a number`);
  }

  return n;
}

function parseUsageEvent(ev: t.IUsageEventResponse): t.IUsageEvent {
  return {
    eventGUID: ev.event_guid,
    eventStart: parseTimestamp(ev.event_start),
    eventStop: parseTimestamp(ev.event_stop),
    memoryInMB: ev.memory_in_mb,
    numberOfNodes: ev.number_of_nodes,
    orgGUID: ev.org_guid,
    planGUID: ev.plan_guid,
    resourceGUID: ev.resource_guid,
    resourceName: ev.resource_name,
    resourceType: ev.resource_type,
    spaceGUID: ev.space_guid,
    spaceName: ev.space_name,
    storageInMB: ev.storage_in_mb,
  };
}

function parseUsageEventResponse(ev: t.IUsageEvent): t.IUsageEventResponse {
  return {
    event_guid: ev.eventGUID,
    event_start: parseDate(ev.eventStart),
    event_stop: parseDate(ev.eventStop),
    memory_in_mb: ev.memoryInMB,
    number_of_nodes: ev.numberOfNodes,
    org_guid: ev.orgGUID,
    plan_guid: ev.planGUID,
    resource_guid: ev.resourceGUID,
    resource_name: ev.resourceName,
    resource_type: ev.resourceType,
    space_guid: ev.spaceGUID,
    space_name: ev.spaceName,
    storage_in_mb: ev.storageInMB,
  };
}

function parsePriceComponent(pc: t.IPriceComponentResponse): t.IPriceComponent {
  return {
    currencyCode: pc.currency_code,
    exVAT: parseNumber(pc.ex_vat),
    incVAT: parseNumber(pc.inc_vat),
    name: pc.name,
    planName: pc.plan_name,
    start: parseTimestamp(pc.start),
    stop: parseTimestamp(pc.stop),
    VATCode: pc.vat_code,
    VATRate: parseNumber(pc.vat_rate),
  };
}

function parseBillableEvent(ev: t.IBillableEventResponse): t.IBillableEvent {
  return {
    ...parseUsageEvent(ev),
    price: {
      details: ev.price.details.map(parsePriceComponent),
      exVAT: parseNumber(ev.price.ex_vat),
      incVAT: parseNumber(ev.price.inc_vat),
    },
    quotaGUID: ev.quota_definition_guid,
  };
}

function parseComponentResponse(component: t.IComponentResponse): t.IComponent {
  return {
    currencyCode: component.currency_code,
    formula: component.formula,
    name: component.name,
    vatCode: component.vat_code,
  };
}

function parsePricingPlan(plan: t.IPricingPlanResponse): t.IPricingPlan {
  // NOTE: extracting the serviceName from the planName is not a reliable
  // method, and we do not want to have to give paas-admin scopes to look up
  // this information if cf. A better solution is to get paas-billing should
  // provide this information
  const [serviceName, ...planName] = plan.name.split(/\s+/);

  return {
    components: plan.components.map(parseComponentResponse),
    memoryInMB: plan.memory_in_mb,
    numberOfNodes: plan.number_of_nodes,
    planGUID: plan.plan_guid,
    planName: planName.join('-'),
    serviceName,
    storageInMB: plan.storage_in_mb,
    validFrom: parseTimestamp(plan.valid_from),
  };
}

function parseRate(rate: t.IRateResponse): t.IRate {
  return {
    code: rate.code,
    rate: parseNumber(rate.rate),
    validFrom: parseTimestamp(rate.valid_from),
  };
}

function validateStatus(status: number): boolean {
  return status > 0 && status < 501;
}

async function request(
  req: AxiosRequestConfig,
  logger: BaseLogger,
): Promise<AxiosResponse> {
  const reqWithDefaults: AxiosRequestConfig = {
    method: 'get',
    timeout: DEFAULT_TIMEOUT,
    validateStatus,
    ...req,
  };

  const instance = axios.create();
  intercept(instance, 'billing', logger);

  const response = await instance.request(reqWithDefaults);

  if (response.status < 200 || response.status >= 300) {
    const msg = `BillingClient: ${reqWithDefaults.method} ${reqWithDefaults.url} failed with status ${response.status}`;

    /* istanbul ignore else  */
    if (typeof reqWithDefaults.params === 'object') {
      throw new Error(`${msg} and params ${JSON.stringify(reqWithDefaults.params)}`);
    } else if (typeof response.data === 'object') {
      throw new Error(`${msg} and data ${JSON.stringify(response.data)}`);
    }
  }

  return response;
}

export default class BillingClient {
  constructor(private readonly config: IBillingClientConfig) {
    this.config = config;
  }

  public async request(req: AxiosRequestConfig): Promise<AxiosResponse> {
    return await request(
      {
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
      },
      this.config.logger,
    );
  }

  public async getBillableEvents(
    params: t.IEventFilter,
  ): Promise<ReadonlyArray<t.IBillableEvent>> {
    const response = await this.request({
      params: {
        org_guid: params.orgGUIDs,
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
      },
      url: '/billable_events',
    });

    const data: ReadonlyArray<t.IBillableEventResponse> = response.data;

    return data.map(parseBillableEvent);
  }

  public async getForecastEvents(params: t.IForecastParameters): Promise<ReadonlyArray<t.IBillableEvent>> {
    const response = await this.request({
      params: {
        events: JSON.stringify(params.events.map(parseUsageEventResponse)),
        org_guid: params.orgGUIDs,
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
      },
      url: '/forecast_events',
    });

    const data: ReadonlyArray<t.IBillableEventResponse> = response.data;

    return data.map(parseBillableEvent);
  }

  public async getPricingPlans(
    params: t.IRangeable,
  ): Promise<ReadonlyArray<t.IPricingPlan>> {
    const response = await this.request({
      params: {
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
      },
      url: '/pricing_plans',
    });

    const data: ReadonlyArray<t.IPricingPlanResponse> = response.data;

    return data.map(parsePricingPlan);
  }

  public async getCurrencyRates(
    params: t.IRangeable,
  ): Promise<ReadonlyArray<t.IRate>> {
    const response = await this.request({
      params: {
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
      },
      url: '/currency_rates',
    });

    const data: ReadonlyArray<t.IRateResponse> = response.data;

    return data.map(parseRate);
  }

  public async getVATRates(params: t.IRangeable): Promise<ReadonlyArray<t.IRate>> {
    const response = await this.request({
      params: {
        range_start: parseDate(params.rangeStart),
        range_stop: parseDate(params.rangeStop),
      },
      url: '/vat_rates',
    });

    const data: ReadonlyArray<t.IRateResponse> = response.data;

    return data.map(parseRate);
  }
}
