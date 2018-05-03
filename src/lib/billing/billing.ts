import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import moment from 'moment';
import qs from 'qs';

const DEFAULT_TIMEOUT = 30000;

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
        range_start: params.rangeStart,
        range_stop: params.rangeStop,
        org_guid: params.orgGUIDs,
      },
    });

    const data: ReadonlyArray<IBillableEventResponse> = response.data;

    return data.map(parseBillableEvent);
  }
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
    resourceType: ev.resource_name,
    orgGUID: ev.org_guid,
    spaceGUID: ev.space_guid,
    planGUID: ev.plan_guid,
    numberOfNodes: ev.number_of_nodes,
    memoryInMB: ev.memory_in_mb,
    storageInMB: ev.storage_in_mb,
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
