export const info = `{
  "name": "vcap",
  "build": "2222",
  "support": "http://support.cloudfoundry.com",
  "version": 2,
  "description": "Cloud Foundry sponsored by Pivotal",
  "authorization_endpoint": "http://localhost:8080/uaa",
  "token_endpoint": "http://localhost:8080/uaa",
  "min_cli_version": null,
  "min_recommended_cli_version": null,
  "api_version": "2.99.0",
  "app_ssh_endpoint": "ssh.system.domain.example.com:2222",
  "app_ssh_host_key_fingerprint": "47:0d:d1:c8:c3:3d:0a:36:d1:49:2f:f2:90:27:31:d0",
  "app_ssh_oauth_client": null,
  "routing_endpoint": "http://localhost:3000",
  "logging_endpoint": "ws://loggregator.vcap.me:80"
}`;

export const organizations = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20",
        "url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20",
        "created_at": "2016-06-08T16:41:33Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "name": "the-system_domain-org-name",
        "billing_enabled": false,
        "quota_definition_guid": "dcb680a9-b190-4838-a3d2-b84aa17517a6",
        "status": "active",
        "quota_definition_url": "/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6",
        "spaces_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces",
        "domains_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/domains",
        "private_domains_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/private_domains",
        "users_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users",
        "managers_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/managers",
        "billing_managers_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/billing_managers",
        "auditors_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/auditors",
        "app_events_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/app_events",
        "space_quota_definitions_url": "/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/space_quota_definitions"
      }
    }
  ]
}`;

export const spaces = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "5489e195-c42b-4e61-bf30-323c331ecc01",
        "url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01",
        "created_at": "2016-06-08T16:41:35Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "name": "name-1774",
        "organization_guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275",
        "space_quota_definition_guid": null,
        "allow_ssh": true,
        "organization_url": "/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275",
        "developers_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers",
        "managers_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers",
        "auditors_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors",
        "apps_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/apps",
        "routes_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/routes",
        "domains_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/domains",
        "service_instances_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/service_instances",
        "app_events_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/app_events",
        "events_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/events",
        "security_groups_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/security_groups",
        "staging_security_groups_url": "/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/staging_security_groups"
      }
    }
  ]
}`;

export const apps = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "efd23111-72d1-481e-8168-d5395e0ea5f0",
        "url": "/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0",
        "created_at": "2016-06-08T16:41:41Z",
        "updated_at": "2016-06-08T16:41:41Z"
      },
      "entity": {
        "name": "name-2131",
        "production": false,
        "space_guid": "be1f9c1d-e629-488e-a560-a35b545f0ad7",
        "stack_guid": "ab968358-43eb-4a5b-80e7-351f194028f7",
        "buildpack": null,
        "detected_buildpack": null,
        "environment_json": null,
        "memory": 1024,
        "instances": 1,
        "disk_quota": 1024,
        "state": "STOPPED",
        "version": "43abf29f-1ad1-46d0-bf08-991946e218fa",
        "command": null,
        "console": false,
        "debug": null,
        "staging_task_id": null,
        "package_state": "PENDING",
        "health_check_type": "port",
        "health_check_timeout": null,
        "staging_failed_reason": null,
        "staging_failed_description": null,
        "diego": false,
        "docker_image": null,
        "docker_credentials": {
          "username": null,
          "password": null
        },
        "package_updated_at": "2016-06-08T16:41:41Z",
        "detected_start_command": "",
        "enable_ssh": true,
        "ports": null,
        "space_url": "/v2/spaces/be1f9c1d-e629-488e-a560-a35b545f0ad7",
        "stack_url": "/v2/stacks/ab968358-43eb-4a5b-80e7-351f194028f7",
        "routes_url": "/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/routes",
        "events_url": "/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/events",
        "service_bindings_url": "/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/service_bindings",
        "route_mappings_url": "/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/route_mappings"
      }
    }
  ]
}`;

export const services = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "9547e9ed-e460-4abe-bda3-7070b9835917",
        "url": "/v2/service_instances/9547e9ed-e460-4abe-bda3-7070b9835917",
        "created_at": "2016-06-08T16:41:41Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "name": "name-2104",
        "credentials": {
          "creds-key-60": "creds-val-60"
        },
        "service_plan_guid": "fcf57f7f-3c51-49b2-b252-dc24e0f7dcab",
        "space_guid": "f858c6b3-f6b1-4ae8-81dd-8e8747657fbe",
        "gateway_data": null,
        "dashboard_url": null,
        "type": "managed_service_instance",
        "last_operation": null,
        "tags": [

        ],
        "space_url": "/v2/spaces/f858c6b3-f6b1-4ae8-81dd-8e8747657fbe",
        "service_plan_url": "/v2/service_plans/fcf57f7f-3c51-49b2-b252-dc24e0f7dcab",
        "service_bindings_url": "/v2/service_instances/9547e9ed-e460-4abe-bda3-7070b9835917/service_bindings",
        "service_keys_url": "/v2/service_instances/9547e9ed-e460-4abe-bda3-7070b9835917/service_keys",
        "routes_url": "/v2/service_instances/9547e9ed-e460-4abe-bda3-7070b9835917/routes"
      }
    }
  ]
}`;

export const users = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "uaa-id-253",
        "url": "/v2/users/uaa-id-253",
        "created_at": "2016-06-08T16:41:35Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "admin": false,
        "active": false,
        "default_space_guid": null,
        "username": "user@example.com",
        "organization_roles": [
          "org_user",
          "org_manager",
          "org_auditor",
          "billing_manager"
        ],
        "spaces_url": "/v2/users/uaa-id-253/spaces",
        "organizations_url": "/v2/users/uaa-id-253/organizations",
        "managed_organizations_url": "/v2/users/uaa-id-253/managed_organizations",
        "billing_managed_organizations_url": "/v2/users/uaa-id-253/billing_managed_organizations",
        "audited_organizations_url": "/v2/users/uaa-id-253/audited_organizations",
        "managed_spaces_url": "/v2/users/uaa-id-253/managed_spaces",
        "audited_spaces_url": "/v2/users/uaa-id-253/audited_spaces"
      }
    }
  ]
}`;
