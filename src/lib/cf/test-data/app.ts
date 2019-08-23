import { IApplication } from '../types';

export const appName = 'name-2401';
export const appGUID = '15b3885d-0351-4b9b-8697-86641668c123';
export const appSpaceGUID = '7846301e-c84c-4ba9-9c6a-2dfdae948d52';
export const appStackGUID = 'bb9ca94f-b456-4ebd-ab09-eb7987cce728';

export const app = (): IApplication => JSON.parse(`{
  "metadata": {
    "guid": "${appGUID}",
    "url": "/v2/apps/${appGUID}",
    "created_at": "2016-06-08T16:41:44Z",
    "updated_at": "2016-06-08T16:41:44Z"
  },
  "entity": {
    "name": "${appName}",
    "production": false,
    "space_guid": "${appSpaceGUID}",
    "stack_guid": "${appStackGUID}",
    "buildpack": "python_buildpack",
    "docker-image": null,
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
    "package_updated_at": "2016-06-08T16:41:45Z",
    "detected_start_command": "",
    "enable_ssh": true,
    "ports": null,
    "space_url": "/v2/spaces/${appSpaceGUID}",
    "stack_url": "/v2/stacks/${appStackGUID}",
    "routes_url": "/v2/apps/${appGUID}/routes",
    "events_url": "/v2/apps/${appGUID}/events",
    "service_bindings_url": "/v2/apps/${appGUID}/service_bindings",
    "route_mappings_url": "/v2/apps/${appGUID}/route_mappings"
  }
}`);
