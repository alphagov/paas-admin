import lodash from 'lodash';

import { IOrganization } from '../types';

/* istanbul ignore next */
export function anOrg(): OrgBuilder {
  return new OrgBuilder();
}

/* istanbul ignore next */
export function someOrgs(...orgs: ReadonlyArray<IOrganization>) {
  return `
  {
    "total_results": ${orgs.length},
    "total_pages": 1,
    "prev_url": null,
    "next_url": null,
    "resources": ${JSON.stringify(orgs)}
  }`;
}

class OrgBuilder {
  private name = 'the-system_domain-org-name';
  private guid = 'a7aff246-5f5b-4cf8-87d8-f316053e4a20';
  private quotaGUID = 'dcb680a9-b190-4838-a3d2-b84aa17517a6';

  public with(
    /* tslint:disable no-any */ custom: any, /* tslint:enable no-any */
  ): IOrganization {
    return lodash.merge(this.base(), custom);
  }

  private base(): IOrganization {
    return JSON.parse(`
    {
      "metadata": {
        "guid": "${this.guid}",
        "url": "/v2/organizations/${this.guid}",
        "created_at": "2016-06-08T16:41:33Z",
        "updated_at": "2016-06-08T16:41:26Z"
      },
      "entity": {
        "name": "${this.name}",
        "billing_enabled": false,
        "quota_definition_guid": "${this.quotaGUID}",
        "status": "active",
        "quota_definition_url": "/v2/quota_definitions/${this.quotaGUID}",
        "spaces_url": "/v2/organizations/${this.guid}/spaces",
        "domains_url": "/v2/organizations/${this.guid}/domains",
        "private_domains_url": "/v2/organizations/${this.guid}/private_domains",
        "users_url": "/v2/organizations/${this.guid}/users",
        "managers_url": "/v2/organizations/${this.guid}/managers",
        "billing_managers_url": "/v2/organizations/${this.guid}/billing_managers",
        "auditors_url": "/v2/organizations/${this.guid}/auditors",
        "app_events_url": "/v2/organizations/${this.guid}/app_events",
        "space_quota_definitions_url": "/v2/organizations/${this.guid}/space_quota_definitions"
      }
    }`);
  }
}
