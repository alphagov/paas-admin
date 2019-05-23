import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';
import * as uaaData from '../../lib/uaa/uaa.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { listOrganizations } from '.';

const organizationTemplate = (name: string, guid: string) => `{
  "metadata": {
    "guid": "${guid}",
    "url": "/v2/organizations/${guid}",
    "created_at": "2016-06-08T16:41:33Z",
    "updated_at": "2016-06-08T16:41:26Z"
  },
  "entity": {
    "name": "${name}",
    "billing_enabled": false,
    "quota_definition_guid": "dcb680a9-b190-4838-a3d2-b84aa17517a6",
    "status": "active",
    "quota_definition_url": "/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6",
    "spaces_url": "/v2/organizations/${guid}/spaces",
    "domains_url": "/v2/organizations/${guid}/domains",
    "private_domains_url": "/v2/organizations/${guid}/private_domains",
    "users_url": "/v2/organizations/${guid}/users",
    "managers_url": "/v2/organizations/${guid}/managers",
    "billing_managers_url": "/v2/organizations/${guid}/billing_managers",
    "auditors_url": "/v2/organizations/${guid}/auditors",
    "app_events_url": "/v2/organizations/${guid}/app_events_url",
    "space_quota_definitions_url": "/v2/organizations/${guid}/space_quota_definitions"
  }
}`;
const organizations = `{
  "total_results": 1,
  "total_pages": 1,
  "prev_url": null,
  "next_url": null,
  "resources": [
    ${organizationTemplate('c-org-name-1', 'a7aff246-5f5b-4cf8-87d8-f316053e4a20')},
    ${organizationTemplate('d-org-name-2', 'a7aff246-5f5b-4cf8-87d8-f316053e4a21')},
    ${organizationTemplate('b-org-name-3', 'a7aff246-5f5b-4cf8-87d8-f316053e4a22')},
    ${organizationTemplate('a-org-name-4', 'a7aff246-5f5b-4cf8-87d8-f316053e4a23')}
  ]
}`;
nock('https://example.com/api').get('/v2/organizations').times(2).reply(200, organizations);

const tokenKey = 'secret';
const token = jwt.sign({
  user_id: 'uaa-user-123',
  scope: [],
  exp: 2535018460,
}, tokenKey);
const ctx: IContext = {
  app: config,
  routePartOf: () => false,
  linkTo: () => '__LINKED_TO__',
  log: pino({level: 'silent'}),
  token: new Token(token, [tokenKey]),
  csrf: '',
};

nock(ctx.app.uaaAPI).persist()
  .get(`/Users/uaa-user-123`).reply(200, uaaData.gdsUser)
  .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`);

describe('organizations test suite', () => {
  it('should show the organisation pages', async () => {
    const response = await listOrganizations(ctx, {});

    expect(response.body).toContain('Choose an organisation');
  });

  it('should sort the organisations by name', async () => {
    const response = await listOrganizations(ctx, {});

    const matches = extractOrganizations(response.body as string);
    expect(matches.length).toBe(4);
    expect(matches[0]).toBe('a-org-name-4');
    expect(matches[1]).toBe('b-org-name-3');
    expect(matches[2]).toBe('c-org-name-1');
    expect(matches[3]).toBe('d-org-name-2');
  });
});

function extractOrganizations(responseBody: string): ReadonlyArray<string> {
    const re = /(.-org-name-\d)/g;
    const matches = [];
    while (true) {
      const match = re.exec(responseBody);
      if (match) {
        matches.push(match[0]);
      } else {
        return matches;
      }
    }
}
