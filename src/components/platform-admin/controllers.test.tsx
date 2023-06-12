import cheerio from 'cheerio';
import jwt from 'jsonwebtoken';
import lodash from 'lodash'

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import CloudFoundryClient from '../../lib/cf';
import { IResponse } from '../../lib/router';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';
import { Token } from '../auth';
import { CLOUD_CONTROLLER_ADMIN } from '../auth/has-role';
import { v3Org as defaultV3Org } from '../../lib/cf/test-data/org';

import {
  createOrganization,
  createOrganizationForm,
  filterOutRealOrganisations,
  sortOrganisationsByName,
  viewHomepage,
} from './controllers';

jest.mock('../../lib/cf');
jest.mock('../../lib/accounts');
jest.mock('../../lib/uaa');

const mockOrg = { metadata: { annotations: { owner: 'TEST_OWNER' } } };
const tokenKey = 'secret';

describe(viewHomepage, () => {
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
      await expect(viewHomepage(ctx, {})).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });

  describe('when a platform admin', () => {
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

    let response: IResponse;
    let $: CheerioStatic;

    beforeEach(async () => {
      response = await viewHomepage(ctx, {});
      $ = cheerio.load(response.body as string);
    });

    it('should show the homepage with useful headings', () => {
      expect(response.body).toMatch(/Platform Admin/);
      expect(response.body).toMatch(/Costs/);
      expect(response.body).toMatch(/Organisation management/);
      expect(response.body).toMatch(/User management/);
    });

    it('should show a link to the org report', () => {
      expect(response.body).toMatch(/Organisation management/);
      expect(response.body).toMatch(/View trial and billable organisations/);
    });

    it('should show a form to lookup a user', () => {
      expect(response.body).toMatch(/User management/);
      expect(response.body).toMatch(/Find a user/);
      expect($('button').text()).toContain('Find user');
    });

    it('should show a form to show costs', () => {
      expect(response.body).toMatch(/Costs/);
      expect(response.body).toMatch(/View costs for a month/);
      expect(response.body).toMatch(/January/);
      expect(response.body).toMatch(/December/);
      expect(response.body).toMatch(/Overall costs/);
      expect(response.body).toMatch(/Costs by service/);
      expect(response.body).toMatch(/Spend for PMO team/);
      expect(response.body).toMatch(/Sankey/);
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });
});

describe(createOrganizationForm, () => {
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
      await expect(viewHomepage(ctx, {})).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });

  describe('when platform admin', () => {
    let ctx: IContext;

    beforeEach(() => {
      const time = Math.floor(Date.now() / 1000);
      const rawToken = {
        exp: time + 24 * 60 * 60,
        origin: 'uaa',
        scope: [CLOUD_CONTROLLER_ADMIN],
        user_id: 'uaa-id-253',
      };
      const accessToken = jwt.sign(rawToken, tokenKey);

      const token = new Token(accessToken, [tokenKey]);

      ctx = createTestContext({ token });

      // @ts-ignore
      CloudFoundryClient.mockClear();
    });

    it('should print the creation form correctly', async () => {
      // @ts-ignore
      CloudFoundryClient.prototype.v3Organizations.mockReturnValueOnce(Promise.resolve([ mockOrg ]));

      const response = await createOrganizationForm(ctx, {});

      expect(response.body).toBeDefined();
      expect(response.body).toContain('CSRF_TOKEN');
      expect(response.body).toContain('Create Organisation');
      expect(response.body).toContain('id="organization"');
      expect(response.body).toContain('id="owner"');
      expect(response.body).toContain('<button');
    });
  });
});

describe(createOrganization, () => {
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
      await expect(viewHomepage(ctx, {})).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });

  describe('when platform admin', () => {
    let ctx: IContext;

    beforeEach(() => {
      const time = Math.floor(Date.now() / 1000);
      const rawToken = {
        exp: time + 24 * 60 * 60,
        origin: 'uaa',
        scope: [CLOUD_CONTROLLER_ADMIN],
        user_id: 'uaa-id-253',
      };
      const accessToken = jwt.sign(rawToken, tokenKey);

      const token = new Token(accessToken, [tokenKey]);

      ctx = createTestContext({ token });

      // @ts-ignore
      CloudFoundryClient.mockClear();
    });

    it('should throw errors when field validation fails', async () => {
      // @ts-ignore
      CloudFoundryClient.prototype.v3Organizations.mockReturnValueOnce(Promise.resolve([ mockOrg ]));

      const response = await createOrganization(ctx, {}, {});

      expect(response.status).toEqual(422);
      expect(response.body).toBeDefined();
      expect(response.body).toContain('<form');
      expect(response.body).toContain('There is a problem');
      expect(response.body).not.toContain('Success');
    });

    it('should printout a success page', async () => {
      // @ts-ignore
      CloudFoundryClient.prototype.v3CreateOrganization.mockReturnValueOnce(Promise.resolve({ guid: 'ORG_GUID' }));
      // @ts-ignore
      CloudFoundryClient.prototype.v3CreateSpace.mockReturnValueOnce(Promise.resolve({}));

      const response = await createOrganization(ctx, {}, {
        organization: 'new-organization',
        owner: 'Government Digital Service',
      });

      expect(CloudFoundryClient.prototype.v3CreateOrganization).toHaveBeenCalled();
      expect(CloudFoundryClient.prototype.v3CreateSpace).toHaveBeenCalled();
      expect(response.status).toBeUndefined();
      expect(response.body).toBeDefined();
      expect(response.body).not.toContain('<form');
      expect(response.body).toContain('New organisation successfully created');
    });
  });
});

describe('helper functions', () => {

  describe(filterOutRealOrganisations, () => {
    it('should return only real organisations', () => {
      const orgs = [
        lodash.merge(defaultV3Org(), { name: 'org c' }),
        lodash.merge(defaultV3Org(), { name: 'org a' }),
        lodash.merge(defaultV3Org(), { name: 'ACC-123' }),
        lodash.merge(defaultV3Org(), { name: 'BACC-123' }),
        lodash.merge(defaultV3Org(), { name: 'CATS-123' }),
        lodash.merge(defaultV3Org(), { name: 'CAT-123' }),
        lodash.merge(defaultV3Org(), { name: 'org b' }),
        lodash.merge(defaultV3Org(), { name: 'SMOKE-' }),
      ];
  
      const filteredOrgs = filterOutRealOrganisations(orgs);
  
      expect(filteredOrgs.length).toEqual(3);
      expect(filteredOrgs[0].name).toEqual('org c');
      expect(filteredOrgs[1].name).toEqual('org a');
      expect(filteredOrgs[2].name).toEqual('org b');
    });
  });

  describe(sortOrganisationsByName, () => {
    it('should sort organisations alphabetically by name', () => {
      const orgs = [
        lodash.merge(defaultV3Org(), { name: 'org c' }),
        lodash.merge(defaultV3Org(), { name: 'org a' }),
        lodash.merge(defaultV3Org(), { name: 'org b' }),
      ];
  
      const sortedOrgs = sortOrganisationsByName(orgs);
  
      expect(sortedOrgs[0].name).toEqual('org a');
      expect(sortedOrgs[1].name).toEqual('org b');
      expect(sortedOrgs[2].name).toEqual('org c');
    });
  });

});
