interface IRangeable {
  readonly rangeStart: Date;
  readonly rangeStop: Date;
}

interface IEventFilter extends IRangeable {
  readonly orgGUIDs: ReadonlyArray<string>;
}

interface IForecastParameters extends IEventFilter {
  readonly events: ReadonlyArray<IUsageEvent>;
}

interface IPricingPlanResponse {
  readonly name: string;
  readonly plan_guid: string;
  readonly valid_from: string;
  readonly components: ReadonlyArray<IComponentResponse>;
  readonly number_of_nodes: number;
  readonly memory_in_mb: number;
  readonly storage_in_mb: number;
}

interface IPricingPlan {
  readonly name: string;
  readonly metadata: IPricingPlanMetadata;
  readonly planGUID: string;
  readonly validFrom: Date;
  readonly components: ReadonlyArray<IComponent>;
  readonly numberOfNodes: number;
  readonly memoryInMB: number;
  readonly storageInMB: number;
}

// Our Billing API provides one unstructured name field for each pricing plan.
// We parse that into structured metadata about the plan. Here's an example.
//
// 1. The Billing API gives us this pricing plan name:
//
//    "mysql large-ha-5.7"
//
// 2. For the service name, use everything before the first space:
//
//    serviceName = "mysql"
//
// 3. For the planName, use everything after the first space:
//
//    planName = "large-ha-5.7"
//
// 4. For the plan version, use everything after the final dash in the plan name:
//
//    planVersion = "5.7"
//
// 5. For the plan variant, use everything before the final dash in the plan name:
//
//    planVariant = "large-ha"
//
// 6. If there are no dashes in the plan name, we populate the plan version and
//    leave the plan variant empty.
//
// This works well for complex services which expose a version of the
// underlying database engine as well as the database's configuration.
//
// But we also expose simpler things through the Billing API (e.g.,
// Cloud Foundry app running costs.) For those, the parsing still works well.
// Say the pricing plan name from the Billing API is:
//
//     "aws-s3-bucket default"
//
// That parses to:
//
//     serviceName = "aws-s3-bucket"
//     planName    = "default"
//     planVersion = "default"
//     planVariant = ""
//
// By clustering pricing plans by serviceName and planVersion, we can then render
// a pretty Pricing Calculator.
//
// FIXME: extracting metadata from the planName is not a reliable
// method, and we do not want to have to give paas-admin scopes to look up
// this information in cf. A better solution is to get paas-billing to
// provide this information.
interface IPricingPlanMetadata {
  readonly serviceName: string;
  readonly planName: string;
  readonly planVersion: string;
  readonly planVariant: string;
}

interface IComponentResponse {
  readonly name: string;
  readonly formula: string;
  readonly vat_code: string;
  readonly currency_code: string;
}

interface IComponent {
  readonly name: string;
  readonly formula: string;
  readonly vatCode: string;
  readonly currencyCode: string;
}

interface IPriceComponent {
  readonly name: string;
  readonly planName: string;
  readonly start: Date;
  readonly stop: Date;
  readonly VATCode: string;
  readonly VATRate: number;
  readonly currencyCode: string;
  readonly currencyRate: number;
  readonly incVAT: number;
  readonly exVAT: number;
}

interface IPrice {
  readonly incVAT: number;
  readonly exVAT: number;
  readonly details: ReadonlyArray<IPriceComponent>;
}

interface IUsageEvent {
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

interface IBillableEvent extends IUsageEvent {
  readonly price: IPrice;
  readonly quotaGUID?: string;
}

interface IUsageEventResponse {
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

interface IBillableEventResponse extends IUsageEventResponse {
  readonly quota_definition_guid?: string;
  price: {
    readonly inc_vat: string;
    readonly ex_vat: string;
    readonly details: ReadonlyArray<IPriceComponentResponse>;
  };
}

interface IPriceComponentResponse {
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
