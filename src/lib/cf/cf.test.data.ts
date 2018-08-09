// tslint:disable:max-line-length
export const info = `{
  "name": "vcap",
  "build": "2222",
  "support": "http://support.cloudfoundry.com",
  "version": 2,
  "description": "Cloud Foundry sponsored by Pivotal",
  "authorization_endpoint": "https://auth.example.com",
  "token_endpoint": "https://example.com/uaa",
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

export const organization = `{
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
}`;

export const organizationQuota = `{
  "metadata": {
    "guid": "80f3e539-a8c0-4c43-9c72-649df53da8cb",
    "url": "/v2/quota_definitions/80f3e539-a8c0-4c43-9c72-649df53da8cb",
    "created_at": "2016-06-08T16:41:39Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "name-1996",
    "non_basic_services_allowed": true,
    "total_services": 60,
    "total_routes": 1000,
    "total_private_domains": -1,
    "memory_limit": 20480,
    "trial_db_allowed": false,
    "instance_memory_limit": -1,
    "app_instance_limit": -1,
    "app_task_limit": -1,
    "total_service_keys": -1,
    "total_reserved_route_ports": 5
  }
}`;

export const organizationQuotas = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [ ${organizationQuota} ]
}`;

export const spaces = `{
  "total_results": 2,
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
        "space_quota_definition_guid": "a9097bc8-c6cf-4a8f-bc47-623fa22e8019",
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
    },
    {
      "metadata": {
        "guid": "bc8d3381-390d-4bd7-8c71-25309900a2e3",
        "url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3",
        "created_at": "2016-06-08T16:41:35Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "name": "name-1774",
        "organization_guid": "3deb9f04-b449-4f94-b3dd-c73cefe5b275",
        "space_quota_definition_guid": null,
        "allow_ssh": true,
        "organization_url": "/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275",
        "developers_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/developers",
        "managers_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/managers",
        "auditors_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/auditors",
        "apps_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/apps",
        "routes_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/routes",
        "domains_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/domains",
        "service_instances_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/service_instances",
        "app_events_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/app_events",
        "events_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/events",
        "security_groups_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/security_groups",
        "staging_security_groups_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/staging_security_groups"
      }
    }
  ]
}`;

export const space = `{
  "metadata": {
    "guid": "bc8d3381-390d-4bd7-8c71-25309900a2e3",
    "url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3",
    "created_at": "2016-06-08T16:41:40Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "name-2064",
    "organization_guid": "6e1ca5aa-55f1-4110-a97f-1f3473e771b9",
    "space_quota_definition_guid": null,
    "allow_ssh": true,
    "organization_url": "/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9",
    "developers_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/developers",
    "managers_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/managers",
    "auditors_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/auditors",
    "apps_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/apps",
    "routes_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/routes",
    "domains_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/domains",
    "service_instances_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/service_instances",
    "app_events_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/app_events",
    "events_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/events",
    "security_groups_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/security_groups",
    "staging_security_groups_url": "/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/staging_security_groups"
  }
}`;

export const spaceSummary = `{
  "guid": "50ae42f6-346d-4eca-9e97-f8c9e04d5fbe",
  "name": "name-1382",
  "apps": [
    {
      "guid": "c49aac23-e26c-4564-ba1a-0b0bdcff1387",
      "urls": [
        "host-7.domain-7.example.com"
      ],
      "routes": [
        {
          "guid": "9b593acf-f617-4713-b9cf-c959aa2e3276",
          "host": "host-7",
          "port": null,
          "path": "",
          "domain": {
            "guid": "97b03bcb-db5d-4923-8b02-662c490fc2ac",
            "name": "domain-7.example.com"
          }
        }
      ],
      "service_count": 1,
      "service_names": [
        "name-1385"
      ],
      "running_instances": 0,
      "name": "name-1388",
      "production": false,
      "space_guid": "50ae42f6-346d-4eca-9e97-f8c9e04d5fbe",
      "stack_guid": "8d4152c3-d2bb-44ac-9036-b2a8c95f24ef",
      "buildpack": null,
      "detected_buildpack": null,
      "detected_buildpack_guid": null,
      "environment_json": null,
      "memory": 1024,
      "instances": 1,
      "disk_quota": 1024,
      "state": "STOPPED",
      "version": "a93316d0-dcd0-43c2-9569-624af35a61bd",
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
      "package_updated_at": "2016-06-08T16:41:28Z",
      "detected_start_command": "",
      "enable_ssh": true,
      "ports": null
    }
  ],
  "services": [
    {
      "guid": "5cf08d8b-848c-4f27-bd92-8080fa021783",
      "name": "name-1385",
      "bound_app_count": 1,
      "shared_from": {
        "space_guid": "c4861ea6-fc27-4a20-ad21-461743ce8921",
        "space_name": "source-space",
        "organization_name": "source-org"
      },
      "last_operation": {
        "type": "create",
        "state": "succeeded",
        "description": "description goes here",
        "updated_at": "2016-06-08T16:41:28Z",
        "created_at": "2016-06-08T16:41:28Z"
      },
      "dashboard_url": null,
      "service_plan": {
        "guid": "0f8ad3ee-ca65-4849-ae52-d6539392fae2",
        "name": "name-1386",
        "service": {
          "guid": "17752c54-ac25-46fb-9989-3f69017d0dbe",
          "label": "label-27",
          "provider": null,
          "version": null
        }
      }
    }
  ]
}`;

export const spaceQuota = `{
  "metadata": {
    "guid": "a9097bc8-c6cf-4a8f-bc47-623fa22e8019",
    "url": "/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019",
    "created_at": "2016-06-08T16:41:29Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "name-1491",
    "organization_guid": "a065dfc7-3aed-4438-a6af-b1f42d9a4ed4",
    "non_basic_services_allowed": true,
    "total_services": 60,
    "total_routes": 1000,
    "memory_limit": 20480,
    "instance_memory_limit": -1,
    "app_instance_limit": -1,
    "app_task_limit": 5,
    "total_service_keys": 600,
    "total_reserved_route_ports": -1,
    "organization_url": "/v2/organizations/a065dfc7-3aed-4438-a6af-b1f42d9a4ed4",
    "spaces_url": "/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019/spaces"
  }
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

export const app = `{
  "metadata": {
    "guid": "15b3885d-0351-4b9b-8697-86641668c123",
    "url": "/v2/apps/15b3885d-0351-4b9b-8697-86641668c123",
    "created_at": "2016-06-08T16:41:44Z",
    "updated_at": "2016-06-08T16:41:44Z"
  },
  "entity": {
    "name": "name-2401",
    "production": false,
    "space_guid": "7846301e-c84c-4ba9-9c6a-2dfdae948d52",
    "stack_guid": "7e03186d-a438-4285-b3b7-c426532e1df2",
    "buildpack": null,
    "detected_buildpack": null,
    "detected_buildpack_guid": null,
    "environment_json": null,
    "memory": 1024,
    "instances": 1,
    "disk_quota": 1024,
    "state": "STOPPED",
    "version": "df19a7ea-2003-4ecb-a909-e630e43f2719",
    "command": null,
    "console": false,
    "debug": null,
    "staging_task_id": null,
    "package_state": "PENDING",
    "health_check_http_endpoint": "",
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
    "package_updated_at": "2016-06-08T16:41:45Z",
    "detected_start_command": "",
    "enable_ssh": true,
    "ports": null,
    "space_url": "/v2/spaces/7846301e-c84c-4ba9-9c6a-2dfdae948d52",
    "stack_url": "/v2/stacks/7e03186d-a438-4285-b3b7-c426532e1df2",
    "routes_url": "/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/routes",
    "events_url": "/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/events",
    "service_bindings_url": "/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/service_bindings",
    "route_mappings_url": "/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/route_mappings"
  }
}`;

export const appSummary = `{
  "guid": "cd897c8c-3171-456d-b5d7-3c87feeabbd1",
  "name": "name-79",
  "routes": [
    {
      "guid": "2d642293-7448-45c6-a864-937c77b9c09a",
      "host": "host-1",
      "port": null,
      "path": "",
      "domain": {
        "guid": "02e200d3-5b18-497b-aafd-17fc3bece05f",
        "name": "domain-1.example.com"
      }
    }
  ],
  "running_instances": 0,
  "services": [
    {
      "guid": "307f8c47-7796-4d90-bd40-6a56764e37b3",
      "name": "name-82",
      "bound_app_count": 1,
      "last_operation": null,
      "dashboard_url": null,
      "service_plan": {
        "guid": "a7229730-4c4a-418c-a449-9d9f1f2fb3c2",
        "name": "name-83",
        "service": {
          "guid": "724a9245-900e-47cb-b924-0a7a98dea977",
          "label": "label-1",
          "provider": null,
          "version": null
        }
      }
    }
  ],
  "available_domains": [
    {
      "guid": "02e200d3-5b18-497b-aafd-17fc3bece05f",
      "name": "domain-1.example.com",
      "owning_organization_guid": "58a46adc-2e73-4f9c-b7ba-5e72e875cd18"
    },
    {
      "guid": "f067af33-4141-4e69-bbd5-d7b3e01140fa",
      "name": "customer-app-domain1.com",
      "router_group_guid": null,
      "router_group_type": null
    },
    {
      "guid": "ccdb1696-d3e3-4786-a9c1-11bc64b2090a",
      "name": "customer-app-domain2.com",
      "router_group_guid": null,
      "router_group_type": null
    }
  ],
  "production": false,
  "space_guid": "1053174d-eb79-4f16-bf82-9f83a52d6e84",
  "stack_guid": "aff73b55-7767-4928-b0ce-502cca863be0",
  "buildpack": null,
  "detected_buildpack": null,
  "detected_buildpack_guid": null,
  "environment_json": null,
  "memory": 1024,
  "instances": 1,
  "disk_quota": 1024,
  "state": "STOPPED",
  "version": "d457b51a-d7cb-494d-b39e-3171ec75bd60",
  "command": null,
  "console": false,
  "debug": null,
  "staging_task_id": null,
  "package_state": "PENDING",
  "health_check_http_endpoint": "",
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
  "package_updated_at": "2016-06-08T16:41:22Z",
  "detected_start_command": "",
  "enable_ssh": true,
  "ports": null
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

export const serviceInstance = `{
  "metadata": {
    "guid": "0d632575-bb06-4ea5-bb19-a451a9644d92",
    "url": "/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92",
    "created_at": "2016-06-08T16:41:29Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "name-1508",
    "credentials": {
      "creds-key-38": "creds-val-38"
    },
    "service_guid": "a14baddf-1ccc-5299-0152-ab9s49de4422",
    "service_plan_guid": "779d2df0-9cdd-48e8-9781-ea05301cedb1",
    "space_guid": "38511660-89d9-4a6e-a889-c32c7e94f139",
    "gateway_data": null,
    "dashboard_url": null,
    "type": "managed_service_instance",
    "last_operation": {
      "type": "create",
      "state": "succeeded",
      "description": "service broker-provided description",
      "updated_at": "2016-06-08T16:41:29Z",
      "created_at": "2016-06-08T16:41:29Z"
    },
    "tags": [
      "accounting",
      "mongodb"
    ],
    "space_url": "/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139",
    "service_url": "/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422",
    "service_plan_url": "/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1",
    "service_bindings_url": "/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92/service_bindings",
    "service_keys_url": "/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92/service_keys",
    "routes_url": "/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92/routes"
  }
}`;

export const servicePlan = `{
  "metadata": {
    "guid": "775d0046-7505-40a4-bfad-ca472485e332",
    "url": "/v2/service_plans/775d0046-7505-40a4-bfad-ca472485e332",
    "created_at": "2016-06-08T16:41:30Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "name-1573",
    "free": false,
    "description": "desc-107",
    "service_guid": "a00cacc0-0ca6-422e-91d3-6b22bcd33450",
    "extra": null,
    "unique_id": "35c56e06-f0c6-4abe-b158-b7c24c889905",
    "public": true,
    "active": true,
    "bindable": true,
    "service_url": "/v2/services/a00cacc0-0ca6-422e-91d3-6b22bcd33450",
    "service_instances_url": "/v2/service_plans/775d0046-7505-40a4-bfad-ca472485e332/service_instances",
    "schemas": {
      "service_instance": {
        "create": {},
        "update": {}
      },
      "service_binding": {
        "create": {}
      }
    }
  }
}`;

export const service = `{
  "metadata": {
    "guid": "53f52780-e93c-4af7-a96c-6958311c40e5",
    "url": "/v2/services/53f52780-e93c-4af7-a96c-6958311c40e5",
    "created_at": "2016-06-08T16:41:32Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "label": "label-58",
    "provider": null,
    "url": null,
    "description": "desc-135",
    "long_description": null,
    "version": null,
    "info_url": null,
    "active": true,
    "bindable": true,
    "unique_id": "c181996b-f233-43d1-8901-3a43eafcaacf",
    "extra": null,
    "tags": [

    ],
    "requires": [

    ],
    "documentation_url": null,
    "service_broker_guid": "0e7250aa-364f-42c2-8fd2-808b0224376f",
    "plan_updateable": false,
    "service_plans_url": "/v2/services/53f52780-e93c-4af7-a96c-6958311c40e5/service_plans"
  }
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

export const user = `{
  "metadata": {
    "guid": "guid-cb24b36d-4656-468e-a50d-b53113ac6177",
    "url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177",
    "created_at": "2016-06-08T16:41:37Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "admin": false,
    "active": false,
    "default_space_guid": null,
    "spaces_url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177/spaces",
    "organizations_url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177/organizations",
    "managed_organizations_url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177/managed_organizations",
    "billing_managed_organizations_url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177/billing_managed_organizations",
    "audited_organizations_url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177/audited_organizations",
    "managed_spaces_url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177/managed_spaces",
    "audited_spaces_url": "/v2/users/guid-cb24b36d-4656-468e-a50d-b53113ac6177/audited_spaces"
  }
}`;

export const userRoles = `{
  "metadata": {
    "guid": "beb082da-25e1-4329-88c9-bea2d809729d",
    "url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d",
    "created_at": "2016-06-08T16:41:34Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "name-1753",
    "billing_enabled": false,
    "quota_definition_guid": "2a6ff67b-6177-43c6-918a-c8d3bbaf0414",
    "status": "active",
    "quota_definition_url": "/v2/quota_definitions/2a6ff67b-6177-43c6-918a-c8d3bbaf0414",
    "spaces_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/spaces",
    "domains_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/domains",
    "private_domains_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/private_domains",
    "users_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/users",
    "managers_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/managers",
    "billing_managers_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/billing_managers",
    "auditors_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/auditors",
    "app_events_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/app_events",
    "space_quota_definitions_url": "/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/space_quota_definitions"
  }
}`;

export const userRolesForOrg = `{
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
    },
    {
      "metadata": {
        "guid": "uaa-user-edit-123456",
        "url": "/v2/users/uaa-user-edit-123456",
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
        "spaces_url": "/v2/users/uaa-user-edit-123456/spaces",
        "organizations_url": "/v2/users/uaa-user-edit-123456/organizations",
        "managed_organizations_url": "/v2/users/uaa-user-edit-123456/managed_organizations",
        "billing_managed_organizations_url": "/v2/users/uaa-user-edit-123456/billing_managed_organizations",
        "audited_organizations_url": "/v2/users/uaa-user-edit-123456/audited_organizations",
        "managed_spaces_url": "/v2/users/uaa-user-edit-123456/managed_spaces",
        "audited_spaces_url": "/v2/users/uaa-user-edit-123456/audited_spaces"
      }
    },
    {
      "metadata": {
        "guid": "99022be6-feb8-4f78-96f3-7d11f4d476f1",
        "url": "/v2/users/99022be6-feb8-4f78-96f3-7d11f4d476f1",
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

export const userRolesForSpace = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "uaa-id-363",
        "url": "/v2/users/uaa-id-363",
        "created_at": "2016-06-08T16:41:40Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "admin": false,
        "active": false,
        "default_space_guid": null,
        "username": "everything@example.com",
        "space_roles": [
          "space_developer",
          "space_manager",
          "space_auditor"
        ],
        "spaces_url": "/v2/users/uaa-id-363/spaces",
        "organizations_url": "/v2/users/uaa-id-363/organizations",
        "managed_organizations_url": "/v2/users/uaa-id-363/managed_organizations",
        "billing_managed_organizations_url": "/v2/users/uaa-id-363/billing_managed_organizations",
        "audited_organizations_url": "/v2/users/uaa-id-363/audited_organizations",
        "managed_spaces_url": "/v2/users/uaa-id-363/managed_spaces",
        "audited_spaces_url": "/v2/users/uaa-id-363/audited_spaces"
      }
    },
    {
      "metadata": {
        "guid": "5ff19d4c-8fa0-4d74-94e0-52eac86d55a8",
        "url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8",
        "created_at": "2016-06-08T16:41:40Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "admin": false,
        "active": false,
        "default_space_guid": null,
        "username": "everything@example.com",
        "space_roles": [
          "space_developer",
          "space_manager",
          "space_auditor"
        ],
        "spaces_url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/spaces",
        "organizations_url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/organizations",
        "managed_organizations_url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/managed_organizations",
        "billing_managed_organizations_url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/billing_managed_organizations",
        "audited_organizations_url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/audited_organizations",
        "managed_spaces_url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/managed_spaces",
        "audited_spaces_url": "/v2/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8/audited_spaces"
      }
    }
  ]
}`;

export const userServiceInstance = `{
  "metadata": {
    "guid": "e9358711-0ad9-4f2a-b3dc-289d47c17c87",
    "url": "/v2/user_provided_service_instances/e9358711-0ad9-4f2a-b3dc-289d47c17c87",
    "created_at": "2016-06-08T16:41:29Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "name-1700",
    "credentials": {
      "creds-key-58": "creds-val-58"
    },
    "space_guid": "22236d1a-d9c7-44b7-bdad-2bb079a6c4a1",
    "type": "user_provided_service_instance",
    "syslog_drain_url": "https://foo.com/url-104",
    "route_service_url": null,
    "tags": [
      "accounting",
      "mongodb"
    ],
    "space_url": "/v2/spaces/22236d1a-d9c7-44b7-bdad-2bb079a6c4a1",
    "service_bindings_url": "/v2/user_provided_service_instances/e9358711-0ad9-4f2a-b3dc-289d47c17c87/service_bindings",
    "routes_url": "/v2/user_provided_service_instances/e9358711-0ad9-4f2a-b3dc-289d47c17c87/routes"
  }
}`;

export const userServices = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    {
      "metadata": {
        "guid": "54e4c645-7d20-4271-8c27-8cc904e1e7ee",
        "url": "/v2/user_provided_service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee",
        "created_at": "2016-06-08T16:41:33Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "name": "name-1696",
        "credentials": {
          "creds-key-57": "creds-val-57"
        },
        "space_guid": "87d14ac2-f396-460e-a523-dc1d77aba35a",
        "type": "user_provided_service_instance",
        "syslog_drain_url": "https://foo.com/url-103",
        "route_service_url": null,
        "tags": ["accounting", "mongodb"],
        "space_url": "/v2/spaces/87d14ac2-f396-460e-a523-dc1d77aba35a",
        "service_bindings_url": "/v2/user_provided_service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee/service_bindings",
        "routes_url": "/v2/user_provided_service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee/routes"
      }
    }
  ]
}`;
// tslint:enable:max-line-length
