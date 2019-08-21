/* istanbul ignore next */
export function anApp(): AppBuilder {
  return new AppBuilder();
}

/* istanbul ignore next */
export function someApps(...apps: ReadonlyArray<string>) {
  return `
  {
    "total_results": ${apps.length},
    "total_pages": 1,
    "prev_url": null,
    "next_url": null,
    "resources": [
      ${apps.join(',')}
    ]
  }`;
}

class AppBuilder {
  private name = 'name-2401';
  private guid = '15b3885d-0351-4b9b-8697-86641668c123';
  private spaceGuid = '7846301e-c84c-4ba9-9c6a-2dfdae948d52';
  private stackGuid = 'bb9ca94f-b456-4ebd-ab09-eb7987cce728';
  private lifecyle = '"buildpack": "python_buildpack", "docker-image": null';

  public withName(name: string) {
    this.name = name;
    return this;
  }

  public withGuid(guid: string) {
    this.guid = guid;
    return this;
  }

  public inSpace(spaceGuid: string) {
    this.spaceGuid = spaceGuid;
    return this;
  }

  public usingDocker() {
    this.lifecyle = '"buildpack": null, "docker_image": "governmentpaas/is-cool"';
    return this;
  }

  public withStack(stackGuid: string) {
    this.stackGuid = stackGuid;
    return this;
  }

  public build(): string {
    return `
    {
      "metadata": {
        "guid": "${this.guid}",
        "url": "/v2/apps/${this.guid}",
        "created_at": "2016-06-08T16:41:44Z",
        "updated_at": "2016-06-08T16:41:44Z"
      },
      "entity": {
        "name": "${this.name}",
        "production": false,
        "space_guid": "${this.spaceGuid}",
        "stack_guid": "${this.stackGuid}",
        ${this.lifecyle},
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
        "space_url": "/v2/spaces/${this.spaceGuid}",
        "stack_url": "/v2/stacks/${this.stackGuid}",
        "routes_url": "/v2/apps/${this.guid}/routes",
        "events_url": "/v2/apps/${this.guid}/events",
        "service_bindings_url": "/v2/apps/${this.guid}/service_bindings",
        "route_mappings_url": "/v2/apps/${this.guid}/route_mappings"
      }
    }`;
  }
}
