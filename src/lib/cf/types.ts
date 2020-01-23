export interface IMetadata {
  readonly guid: string;
  readonly url: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface IResource {
  readonly entity: {
    readonly name: string;
  };
  readonly metadata: IMetadata;
}

export interface IRoute {
  readonly domain: {
    readonly guid: string;
    readonly name: string;
  };
  readonly guid: string;
  readonly host: string;
  readonly path: string;
  readonly port: number | null;
}

export interface IApplication {
  readonly entity: IApplicationEntity;
  readonly metadata: IMetadata;
}

interface IApplicationBase {
  readonly buildpack: string | null;
  readonly command: string | null;
  readonly console: boolean;
  readonly debug: string | null;
  readonly detected_buildpack: string | null;
  readonly detected_start_command: string;
  readonly diego: boolean;
  readonly disk_quota: number;
  readonly docker_credentials: {
    readonly password: string | null;
    readonly username: string | null;
  };
  readonly docker_image: string | null;
  readonly enable_ssh: boolean;
  readonly environment_json: object | null;
  readonly health_check_timeout: string | null;
  readonly health_check_type: string;
  readonly instances: number;
  readonly memory: number;
  readonly name: string;
  readonly package_state: string;
  readonly package_updated_at: string;
  readonly ports: ReadonlyArray<number> | null;
  readonly production: boolean;
  readonly service_count: number;
  readonly service_names: ReadonlyArray<string>;
  readonly space_guid: string;
  readonly stack_guid: string;
  readonly staging_failed_description: string | null;
  readonly staging_failed_reason: string | null;
  readonly staging_task_id: string | null;
  readonly state: string;
  readonly urls: ReadonlyArray<string>;
  readonly version: string;
}

export interface IApplicationEntity extends IApplicationBase {
  readonly events_url: string;
  readonly route_mappings_url: string;
  readonly routes_url: string;
  readonly service_bindings_url: string;
  readonly space_url: string;
  readonly stack_url: string;
}

export interface IApplicationSummary extends IApplicationBase {
  readonly detected_buildpack_guid: string | null;
  readonly guid: string;
  readonly health_check_http_endpoint: string;
  readonly running_instances: number;
  readonly routes: ReadonlyArray<IRoute>;
  readonly services: ReadonlyArray<{
    readonly guid: string;
    readonly name: string;
    readonly bound_app_count: number;
    readonly last_operation: string | null;
    readonly dashboard_url: string | null;
    readonly service_broker_name: string;
    readonly maintenance_info: {
      readonly version: string;
      readonly description: string;
    };
    readonly service_plan: {
      readonly guid: string;
      readonly name: string;
      readonly maintenance_info: {
        readonly version: string;
        readonly description: string;
      };
      readonly service: {
        readonly guid: string;
        readonly label: string;
        readonly provider: string | null;
        readonly version: string | null;
      };
    };
  }>;
  readonly available_domains: ReadonlyArray<{
    readonly guid: string;
    readonly name: string;
    readonly router_group_guid: string;
    readonly router_group_type: string;
    readonly owning_organization_guid: string;
  }>;
}

export interface IInfo {
  readonly api_version: string;
  readonly app_ssh_endpoint: string;
  readonly app_ssh_host_key_fingerprint: string;
  readonly app_ssh_oauth_client: string;
  readonly authorization_endpoint: string;
  readonly build: string;
  readonly description: string;
  readonly logging_endpoint: string;
  readonly min_cli_version: string;
  readonly min_recommended_cli_version: string;
  readonly name: string;
  readonly routing_endpoint: string;
  readonly support: string;
  readonly token_endpoint: string;
  readonly version: string;
}

export type OrganizationUserRoles = 'org_user' | 'org_manager' | 'org_auditor' | 'billing_manager';
export type OrganizationUserRoleEndpoints = 'users' | 'managers' | 'auditors' | 'billing_managers';

export interface IOrganizationRequest {
  readonly name: string;
  readonly quota_definition_guid: string;
}

export interface IOrganization {
  readonly entity: {
    readonly app_events_url: string;
    readonly auditors_url: string;
    readonly billing_enabled: boolean,
    readonly billing_managers_url: string;
    readonly domains_url: string;
    readonly managers_url: string;
    readonly name: string;
    readonly private_domains_url: string;
    readonly quota_definition_guid: string;
    readonly quota_definition_url: string;
    readonly space_quota_definitions_url: string;
    readonly spaces_url: string;
    readonly status: string;
    readonly users_url: string;
  };
  readonly metadata: IMetadata;
}

interface IV3Addressable {
  readonly guid: string;
}

interface IV3Metadata extends IV3Addressable {
  readonly created_at: string;
  readonly updated_at: string;
}

interface IV3Link {
  href: string;
}

interface IV3Pagination {
  total_results: number;
  total_pages: number;
  first: IV3Link;
  last: IV3Link;
  next?: IV3Link;
  previous?: IV3Link;
}

export interface IV3OrganizationResource extends IV3Metadata {
  name: string;
  suspended: boolean;
  relationships: {
    quota: {
      data: {
        guid: string;
      },
    },
  };
  links: {
    self: IV3Link;
    domains: IV3Link;
    default_domain: IV3Link;
  };
  metadata: {
    labels: {};
    annotations: {
      owner?: string;
    };
  };
}

export interface IV3Response<T> {
  readonly pagination: IV3Pagination;
  readonly resources: ReadonlyArray<T>;
}

export interface IOrganizationQuota {
  readonly entity: {
    readonly app_instance_limit: number;
    readonly app_task_limit: number;
    readonly instance_memory_limit: number;
    readonly memory_limit: number;
    readonly name: string;
    readonly non_basic_services_allowed: boolean;
    readonly total_private_domains: number;
    readonly total_reserved_route_ports: number;
    readonly total_routes: number;
    readonly total_service_keys: number;
    readonly total_services: number;
    readonly trial_db_allowed: boolean;
  };
  readonly metadata: IMetadata;
}

export interface IOrganizationUserRoles {
  readonly entity: {
    readonly active: boolean;
    readonly admin: boolean;
    readonly audited_organizations_url: string;
    readonly audited_spaces_url: string;
    readonly billing_managed_organizations_url: string;
    readonly default_space_guid: string | null;
    readonly managed_organizations_url: string;
    readonly managed_spaces_url: string;
    readonly organization_roles: ReadonlyArray<OrganizationUserRoles>;
    readonly organizations_url: string;
    readonly spaces_url: string;
    readonly username: string;
  };
  readonly metadata: IMetadata;
}

export interface IService {
  readonly entity: {
    readonly active: boolean;
    readonly bindable: boolean;
    readonly description: string;
    readonly documentation_url: string | null;
    readonly extra: string | null;
    readonly info_url: string | null;
    readonly label: string;
    readonly long_description: string | null,
    readonly plan_updateable: boolean;
    readonly provider: string | null;
    readonly requires: ReadonlyArray<string>;
    readonly service_broker_guid: string;
    readonly service_plans_url: string;
    readonly tags: ReadonlyArray<string>;
    readonly unique_id: string;
    readonly url: string | null;
    readonly version: string | null;
  };
  readonly metadata: IMetadata;
}

export interface IServicePlan {
  readonly entity: {
    readonly active: boolean;
    readonly bindable: boolean;
    readonly description: string;
    readonly extra: string | null;
    readonly free: boolean;
    readonly name: string;
    readonly public: boolean; // tslint:disable-line:no-reserved-keywords
    readonly service_guid: string;
    readonly service_instances_url: string;
    readonly service_url: string;
    readonly unique_id: string;
  };
  readonly metadata: IMetadata;
}

export interface IServiceInstance {
  readonly entity: {
    readonly credentials: object;
    readonly dashboard_url?: null,
    readonly gateway_data: null,
    readonly last_operation?: {
      readonly created_at: string;
      readonly description?: string;
      readonly state: string;
      readonly type: string; // tslint:disable-line:no-reserved-keywords
      readonly updated_at: string;
    };
    readonly name: string;
    readonly routes_url: string;
    readonly service_bindings_url: string;
    readonly service_guid: string;
    readonly service_keys_url: string;
    readonly service_plan_guid: string;
    readonly service_plan_url: string;
    readonly service_url: string;
    readonly space_guid: string;
    readonly space_url: string;
    readonly tags: ReadonlyArray<string>;
    readonly type: string; // tslint:disable-line:no-reserved-keywords
  };
  readonly metadata: IMetadata;
}

export interface IServiceSummary {
  readonly guid: string;
  readonly name: string;
  readonly bound_app_count: number;
  readonly dashboard_url: string | null;
  readonly last_operation: {
    readonly created_at: string;
    readonly description: string;
    readonly state: string;
    readonly updated_at: string;
  };
  readonly service_plan: {
    readonly guid: string;
    readonly name: string;
    readonly service: {
      readonly guid: string;
      readonly label: string;
      readonly provider: string;
      readonly version: string;
    };
  };
  readonly shared_from: {
    readonly organization_name: string;
    readonly space_guid: string;
    readonly space_name: string;
  };
}

export interface ISpace {
  readonly entity: {
    readonly allow_ssh: boolean,
    readonly app_events_url: string;
    readonly apps_url: string;
    readonly auditors_url: string;
    readonly developers_url: string;
    readonly domains_url: string;
    readonly events_url: string;
    readonly managers_url: string;
    readonly name: string;
    readonly organization_guid: string;
    readonly organization_url: string;
    readonly routes_url: string;
    readonly security_groups_url: string;
    readonly service_instances_url: string;
    readonly space_quota_definition_guid: string | null,
    readonly staging_security_groups_url: string;
  };
  readonly metadata: IMetadata;
}

export interface ISpaceQuota {
  readonly entity: {
    readonly app_instance_limit: number;
    readonly app_task_limit: number;
    readonly instance_memory_limit: number;
    readonly memory_limit: number;
    readonly name: string;
    readonly non_basic_services_allowed: boolean;
    readonly organization_guid: string;
    readonly organization_url: string;
    readonly spaces_url: string;
    readonly total_reserved_route_ports: number;
    readonly total_routes: number;
    readonly total_service_keys: number;
    readonly total_services: number;
  };
  readonly metadata: IMetadata;
}

export interface ISpaceUserRoles {
  readonly entity: {
    readonly active: boolean;
    readonly admin: boolean;
    readonly audited_organizations_url: string;
    readonly audited_spaces_url: string;
    readonly billing_managed_organizations_url: string;
    readonly default_space_guid: string | null;
    readonly managed_organizations_url: string;
    readonly managed_spaces_url: string;
    readonly organizations_url: string;
    readonly space_roles: ReadonlyArray<string>;
    readonly spaces_url: string;
    readonly username: string;
  };
  readonly metadata: IMetadata;
}

export interface ISpaceSummary {
  readonly apps: ReadonlyArray<IApplicationSummary>;
  readonly guid: string;
  readonly name: string;
  readonly services: ReadonlyArray<IServiceSummary>;
}

export interface IUser {
  readonly entity: {
    readonly admin: boolean;
    readonly active: boolean;
  };
  readonly metadata: IMetadata;
}

// Partial definition, there are more fields
export interface IUserSummaryOrganization {
  readonly entity: {
    readonly name: string;
  };
  readonly metadata: IMetadata;
}

export interface IUserSummary {
  readonly entity: {
    readonly organizations: ReadonlyArray<IUserSummaryOrganization>,
    readonly managed_organizations: ReadonlyArray<IUserSummaryOrganization>,
    readonly billing_managed_organizations: ReadonlyArray<IUserSummaryOrganization>,
    readonly audited_organizations: ReadonlyArray<IUserSummaryOrganization>,
  };
  readonly metadata: IMetadata;
}

export interface IUserServices {
  readonly entity: {
    readonly credentials: {[i: string]: string};
    readonly name: string;
    readonly route_service_url: string | null;
    readonly routes_url: string;
    readonly service_bindings_url: string;
    readonly space_guid: string;
    readonly space_url: string;
    readonly syslog_drain_url: string;
    readonly tags: ReadonlyArray<string>;
    readonly type: string; // tslint:disable-line:no-reserved-keywords
  };
  readonly metadata: IMetadata;
}

export interface IStack {
  readonly entity: {
    readonly name: string;
    readonly description: string;
  };
  readonly metadata: IMetadata;
}

export interface IAuditEventActorTarget extends IV3Addressable {
  readonly guid: string;
  readonly type: string;
  readonly name: string;
}

export interface IAuditEvent extends IV3Metadata {
  readonly type: string;

  readonly actor: IAuditEventActorTarget;
  readonly target: IAuditEventActorTarget;

  readonly space: IV3Addressable;
  readonly organization: IV3Addressable;

  readonly data: any;
}
