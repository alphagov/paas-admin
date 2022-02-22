export interface IRangeable {
  readonly rangeStart: Date;
  readonly rangeStop: Date;
}

export interface IEventFilter extends IRangeable {
  readonly orgGUIDs: ReadonlyArray<string>;
}

export interface IForecastParameters extends IEventFilter {
  readonly events: ReadonlyArray<IUsageEvent>;
}

export interface IPricingPlanResponse {
  readonly name: string;
  readonly plan_guid: string;
  readonly valid_from: string;
  readonly components: ReadonlyArray<IComponentResponse>;
  readonly number_of_nodes: number;
  readonly memory_in_mb: number;
  readonly storage_in_mb: number;
}

export interface IPricingPlan {
  readonly planName: string;
  readonly planGUID: string;
  readonly serviceName: string;
  readonly validFrom: Date;
  readonly components: ReadonlyArray<IComponent>;
  readonly numberOfNodes: number;
  readonly memoryInMB: number;
  readonly storageInMB: number;
}

export interface IComponentResponse {
  readonly name: string;
  readonly formula: string;
  readonly vat_code: string;
  readonly currency_code: string;
}

export interface IComponent {
  readonly name: string;
  readonly formula: string;
  readonly vatCode: string;
  readonly currencyCode: string;
}

export interface IPriceComponent {
  readonly name: string;
  readonly planName: string;
  readonly start: Date;
  readonly stop: Date;
  readonly VATCode: string;
  readonly VATRate: number;
  readonly currencyCode: string;
  readonly incVAT: number;
  readonly exVAT: number;
}

interface IPrice {
  readonly incVAT: number;
  readonly exVAT: number;
  readonly details: ReadonlyArray<IPriceComponent>;
}

export interface IUsageEvent {
  readonly eventGUID: string;
  readonly eventStart: Date;
  readonly eventStop: Date;
  readonly resourceGUID: string;
  readonly resourceName: string;
  readonly resourceType: string;
  readonly orgGUID: string;
  readonly spaceGUID: string;
  readonly spaceName: string;
  readonly planGUID: string;
  readonly numberOfNodes: number;
  readonly memoryInMB: number;
  readonly storageInMB: number;
}

export interface IBillableEvent extends IUsageEvent {
  readonly price: IPrice;
  readonly quotaGUID?: string;
}

export interface IUsageEventResponse {
  readonly event_guid: string;
  readonly event_start: string;
  readonly event_stop: string;
  readonly resource_guid: string;
  readonly resource_name: string;
  readonly resource_type: string;
  readonly org_guid: string;
  readonly space_guid: string;
  readonly space_name: string;
  readonly plan_guid: string;
  readonly number_of_nodes: number;
  readonly memory_in_mb: number;
  readonly storage_in_mb: number;
}

export interface IBillableEventResponse extends IUsageEventResponse {
  readonly quota_definition_guid?: string;
  readonly price: {
    readonly inc_vat: string;
    readonly ex_vat: string;
    readonly details: ReadonlyArray<IPriceComponentResponse>;
  };
}

export interface IFlatBillableEventResponse  {
  readonly org_guid: string;
  readonly org_name: string;
  readonly org_quota_definition_guid: string;
  readonly plan_guid: string;
  readonly plan_name: string;
  readonly space_guid: string;
  readonly space_name: string;
  readonly resource_guid: string;
  readonly resource_type: string;
  readonly resource_name: string;
  readonly component_name: string;
  readonly charge_gbp_inc_vat: string;
  readonly charge_gbp_exc_vat: string;
  readonly charge_usd_exc_vat: string;
}

export interface IPriceComponentResponse {
  readonly name: string;
  readonly plan_name: string;
  readonly start: string;
  readonly stop: string;
  readonly vat_code: string;
  readonly vat_rate: string;
  readonly currency_code: string;
  readonly currency_rate: string;
  readonly inc_vat: string;
  readonly ex_vat: string;
}

export interface IRateResponse {
  readonly code: string;
  readonly valid_from: string;
  readonly rate: string;
}

export interface IRate {
  readonly code: string;
  readonly validFrom: Date;
  readonly rate: number;
}
