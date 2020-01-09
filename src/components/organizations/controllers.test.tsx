import lodash from 'lodash';
import nock from 'nock';

import { listOrganizations } from '.';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import {
  billableOrgQuota,
  billableOrgQuotaGUID,
  trialOrgQuota,
  trialOrgQuotaGUID,
} from '../../lib/cf/test-data/org-quota';
import { wrapResources } from '../../lib/cf/test-data/wrap-resources';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

const organizations = JSON.stringify(wrapResources(
  lodash.merge(defaultOrg(), {entity: {name: 'c-org-name-1'}}),
  lodash.merge(defaultOrg(), {entity: {name: 'd-org-name-2'}}),
  lodash.merge(defaultOrg(), {entity: {name: 'b-org-name-3'}}),
  lodash.merge(defaultOrg(), {entity: {name: 'a-org-name-4'}}),

  lodash.merge(
    defaultOrg(), {
      entity: {
        name: 'a-trial-org-name',
        quota_definition_guid: trialOrgQuotaGUID,
      },
    }),
));

const ctx: IContext = createTestContext();

describe('organizations test suite', () => {
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock(ctx.app.cloudFoundryAPI);

    nockCF
      .get('/v2/organizations')
      .reply(200, organizations)

      .get(`/v2/quota_definitions/${billableOrgQuotaGUID}`)
      .reply(200, JSON.stringify(billableOrgQuota()))

      .get(`/v2/quota_definitions/${trialOrgQuotaGUID}`)
      .reply(200, JSON.stringify(trialOrgQuota()))
    ;
  });

  afterEach(() => {
    nockCF.done();

    nock.cleanAll();
  });

  it('should show the organisation pages', async () => {
    const response = await listOrganizations(ctx, {});

    expect(response.body).toContain('Organisations');
  });

  it('should sort the organisations by name', async () => {
    const response = await listOrganizations(ctx, {});

    const matches = extractOrganizations(response.body as string);
    expect(matches.length).toBe(5);
    expect(matches[0]).toBe('a-org-name-4');
    expect(matches[1]).toBe('a-trial-org-name');
    expect(matches[2]).toBe('b-org-name-3');
    expect(matches[3]).toBe('c-org-name-1');
    expect(matches[4]).toBe('d-org-name-2');
  });

  it('should report the org quotas for both trial and billable orgs', async () => {
    const response = await listOrganizations(ctx, {});

    expect(response.body).toMatch(/a-org-name-4.*(?!Trial)Billable/sm);
    expect(response.body).toMatch(/a-trial-org-name.*(?!Billable)Trial/sm);
  });
});

function extractOrganizations(responseBody: string): ReadonlyArray<string> {
  const re = /(.-(trial-)?org-name(-\d)?)/g;
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
