import jwt from 'jsonwebtoken';
import lodash from 'lodash';
import nock from 'nock';

import { Token, CLOUD_CONTROLLER_ADMIN } from '../auth';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
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

import { listOrganizations } from '.';
import { editOrgQuota, updateOrgQuota } from './controllers';

const organizations = JSON.stringify(
  wrapResources(
    lodash.merge(defaultOrg(), { entity: { name: 'c-org-name-1' } }),
    lodash.merge(defaultOrg(), { entity: { name: 'd-org-name-2' } }),
    lodash.merge(defaultOrg(), { entity: { name: 'b-org-name-3' } }),
    lodash.merge(defaultOrg(), { entity: { name: 'a-org-name-4' } }),

    lodash.merge(defaultOrg(), {
      entity: {
        name: 'a-trial-org-name',
        quota_definition_guid: trialOrgQuotaGUID,
      },
    }),
  ),
);

const tokenKey = 'secret';

function extractOrganizations(responseBody: string): ReadonlyArray<string> {
  const re = /(Organisation\sname:)\s(.-(trial-)?org-name(-\d)?)/g;
  const matches = [];
  // :scream:
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const match = re.exec(responseBody);
    if (match) {
      matches.push(match[0]);
    } else {
      return matches;
    }
  }
}

describe('organizations test suite', () => {
  const ctx: IContext = createTestContext();
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
      .reply(200, JSON.stringify(trialOrgQuota()));
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
    expect(matches[0]).toContain('a-org-name-4');
    expect(matches[1]).toContain('a-trial-org-name');
    expect(matches[2]).toContain('b-org-name-3');
    expect(matches[3]).toContain('c-org-name-1');
    expect(matches[4]).toContain('d-org-name-2');
  });

  it('should report the org quotas for both trial and billable orgs', async () => {
    const response = await listOrganizations(ctx, {});

    expect(response.body).toMatch(/a-org-name-4.*(?!Trial)Billable/ms);
    expect(response.body).toMatch(/a-trial-org-name.*(?!Billable)Trial/ms);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });
});

describe(editOrgQuota, () => {
  let nockCF: nock.Scope;
  const organization = {
    entity: { name: 'org-name' },
    metadata: { guid: '__ORG_GUID__' },
  };
  const quota = {
    guid: '__QUOTA_1_GUID__',
    name: 'quota-1',
    apps: { total_memory_in_mb: 2 },
    routes: { total_routes: 2 },
    services: { total_service_instances: 2 },
  };

  describe('when not a platform admin', () => {
    const time = Math.floor(Date.now() / 1000);
    const rawToken = {
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
      scope: [],
      user_id: 'uaa-id-253',
    };
    const accessToken = jwt.sign(rawToken, tokenKey);

    const token = new Token(accessToken, [tokenKey]);
    const ctx: IContext = createTestContext({ token });

    it('should return an error', async () => {
      await expect(editOrgQuota(ctx, {})).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });

  describe('when platform admin', () => {
    const time = Math.floor(Date.now() / 1000);
    const rawToken = {
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
      scope: [CLOUD_CONTROLLER_ADMIN],
      user_id: 'uaa-id-253',
    };
    const accessToken = jwt.sign(rawToken, tokenKey);

    const token = new Token(accessToken, [tokenKey]);
    const ctx: IContext = createTestContext({ token });

    beforeEach(() => {
      nock.cleanAll();

      nockCF = nock(ctx.app.cloudFoundryAPI);

      nockCF
        .get(`/v2/organizations/${organization.metadata.guid}`)
        .reply(200, organization)

        .get(`/v3/organization_quotas`)
        .reply(200, {
          pagination: {
            total_results: 3,
            total_pages: 1,
          },
          resources: [
            quota,
            { ...quota, guid: '__QUOTA_3_GUID__', name: 'CATS-qwertyuiop' },
            { ...quota, guid: '__QUOTA_2_GUID__', name: 'quota-2' },
          ],
        });
    });

    afterEach(() => {
      nockCF.done();

      nock.cleanAll();
    });

    it('should correctly parse data into a form', async () => {
      const response = await editOrgQuota(ctx, { organizationGUID: organization.metadata.guid });

      expect(response.status).toBeUndefined();
      expect(response.body).toContain(`Organisation ${organization.entity.name}`);
    });
  });
});

describe(updateOrgQuota, () => {
  let nockCF: nock.Scope;
  const organization = {
    entity: { name: 'org-name' },
    metadata: { guid: '__ORG_GUID__' },
  };
  const quotaGUID = '__QUOTA_GUID__';

  const params = { organizationGUID: organization.metadata.guid };
  const body = { quota: quotaGUID };


  describe('when not a platform admin', () => {
    const time = Math.floor(Date.now() / 1000);
    const rawToken = {
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
      scope: [],
      user_id: 'uaa-id-253',
    };
    const accessToken = jwt.sign(rawToken, tokenKey);

    const token = new Token(accessToken, [tokenKey]);
    const ctx: IContext = createTestContext({ token });

    it('should return an error', async () => {
      await expect(updateOrgQuota(ctx, params, body)).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });

  describe('when platform admin', () => {
    const time = Math.floor(Date.now() / 1000);
    const rawToken = {
      exp: time + 24 * 60 * 60,
      origin: 'uaa',
      scope: [CLOUD_CONTROLLER_ADMIN],
      user_id: 'uaa-id-253',
    };
    const accessToken = jwt.sign(rawToken, tokenKey);

    const token = new Token(accessToken, [tokenKey]);
    const ctx: IContext = createTestContext({ token });

    beforeEach(() => {
      nock.cleanAll();

      nockCF = nock(ctx.app.cloudFoundryAPI);

      nockCF
        .get(`/v2/organizations/${organization.metadata.guid}`)
        .reply(200, organization)

        .post(`/v3/organization_quotas/${quotaGUID}/relationships/organizations`)
        .reply(201, { data: [{ guid: organization.metadata.guid }] });
    });

    afterEach(() => {
      nockCF.done();

      nock.cleanAll();
    });

    it('should parse the success message correctly', async () => {
      const response = await updateOrgQuota(ctx, params, body);

      expect(response.status).toBeUndefined();
      expect(response.body).toContain('Quota successfully set');
    });
  });
});
