import cheerio from 'cheerio';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import lodash from 'lodash'

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { AccountsClient } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import { IResponse } from '../../lib/router';
import UAAClient from '../../lib/uaa';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';
import { Token } from '../auth';
import { CLOUD_CONTROLLER_ADMIN } from '../auth/has-role';
import { v3Org as defaultV3Org } from '../../lib/cf/test-data/org';

import {
  constructZendeskRequesterObject,
  contactOrganisationManagers,
  contactOrganisationManagersPost,
  contactOrgManagersZendeskContent,
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
const contactManagersMockOrg = { guid: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20', name: 'an-org', suspended: false };
const mockCfUser = {
  metadata: {
    guid: '99022be6-feb8-4f78-96f3-7d11f4d476f1',
  },
  entity: {
    username: 'user@uaa.example.com',
    organization_roles: ['org_manager'],
  },
};
const mockUaaUser = {
  id: '99022be6-feb8-4f78-96f3-7d11f4d476f1',
  userName: 'uaa-id-253@fake.cabinet-office.gov.uk',
  name: { familyName: 'Stub', givenName: 'User' },
  emails: [{
    value: 'uaa-id-253@fake.cabinet-office.gov.uk',
    primary: false,
  }],
};
const mockAccountsUser = {
    email: 'uaa-id-253@fake.cabinet-office.gov.uk',
    username: 'uaa-id-253@fake.cabinet-office.gov.uk',
    uuid: '99022be6-feb8-4f78-96f3-7d11f4d476f1',
};

const tokenKey = 'secret';

let nockZD: nock.Scope;

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
        owner: 'Organisation Owner',
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

describe(contactOrganisationManagers, () => {
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
      await expect(contactOrganisationManagers(ctx, {} as any)).rejects.toThrow(
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

    afterEach(() => {
      nock.cleanAll();
    });

    it('should render the page correctly', async () => {
      // @ts-ignore
      CloudFoundryClient.prototype.v3Organizations.mockReturnValueOnce(Promise.resolve([ contactManagersMockOrg ]));

      const response = await contactOrganisationManagers(ctx, {} as any);

      expect(response.body).toContain('a7aff246-5f5b-4cf8-87d8-f316053e4a20');
      expect(response.body).toContain('Contact organisation managers');
      expect(response.body).toContain('Organisation name');
      expect(response.body).toContain('Manager role');
      expect(response.body).toContain('Message');
    });
  });
});

describe(contactOrganisationManagersPost, () => {
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
    // @ts-ignore
    UAAClient.mockClear();
    // @ts-ignore
    AccountsClient.mockClear();

    nock.cleanAll();
    nockZD = nock(ctx.app.zendeskConfig.remoteUri);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should create a zendesk ticket correctly', async () => {
    // @ts-ignore
    CloudFoundryClient.prototype.v3Organizations.mockReturnValueOnce(Promise.resolve([ contactManagersMockOrg ]));
     // @ts-ignore
    CloudFoundryClient.prototype.usersForOrganization.mockReturnValueOnce(Promise.resolve([ mockCfUser ]));
    // @ts-ignore
    UAAClient.prototype.getUser.mockReturnValueOnce(Promise.resolve(mockUaaUser));
    // @ts-ignore
    AccountsClient.prototype.getUser.mockReturnValueOnce(Promise.resolve(mockAccountsUser));


    nockZD
      .post('/tickets.json')
      .reply(201, {});

    const response = await contactOrganisationManagersPost(ctx, {}, {
      organisation: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      managerRole: 'org_manager',
      message: 'message text',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Message has been sent');
    expect(response.body).toContain('A Zendesk ticket has also been created to track progress');
  });

  it('should throw validation errors when missing data has been submited', async () => {
    // @ts-ignore
    CloudFoundryClient.prototype.v3Organizations.mockReturnValueOnce(Promise.resolve([ contactManagersMockOrg ]));

    const response = await contactOrganisationManagersPost(ctx, {}, {} as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your request');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Select an organisation');
    expect(response.body).toContain('Select a manager role');
    expect(response.body).toContain('Enter your message');
  });

  it('should throw and error if org has no managers of selected type', async () => {
    // @ts-ignore
    CloudFoundryClient.prototype.v3Organizations.mockReturnValueOnce(Promise.resolve([ contactManagersMockOrg ]));
     // @ts-ignore
    CloudFoundryClient.prototype.usersForOrganization.mockReturnValueOnce(Promise.resolve([]));
    // @ts-ignore
    UAAClient.prototype.getUser.mockReturnValueOnce(Promise.resolve([]));
    // @ts-ignore
    AccountsClient.prototype.getUser.mockReturnValueOnce(Promise.resolve([mockAccountsUser]));

    const response = await contactOrganisationManagersPost(ctx, {}, {
      organisation: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      managerRole: 'billing_manager',
      message: 'message text',
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your request');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Select organisation does not have any of the selected manager roles');
  });

});

describe('helper functions', () => {
  describe(contactOrgManagersZendeskContent, () => {
    const zendeskEmailContent = contactOrgManagersZendeskContent({
      organisation: 'test',
      message: 'Message content',
      managerRole: 'billing_manager',
    },'narnia');

    // whitespace matters
    const expectedOutput = `
Message content

You are receiving this email as you are listed as a billing manager of the test organisation in our NARNIA region.

Thank you,
GOV.UK PaaS`;

    it('should output expected text', () => {
      expect(zendeskEmailContent).toEqual(expectedOutput);
    });
  });

  describe(constructZendeskRequesterObject, () => {

    it('should object with correct data if user is not null', () => {
      const expectedOutput = {
        name: 'Stub User',
        locale_id: 1176,
        email: 'stub-user@digital.cabinet-office.gov.uk',
      };

      const functionOutput = constructZendeskRequesterObject({
        meta: {
          version: 0,
          created: '2019-01-01T00:00:00',
          lastModified: '2019-01-02T00:00:00',
        },
        id: '99022be6-feb8-4f78-96f3-7d11f4d476f1',
        externalId: 'stub-user',
        userName: 'stub-user@digital.cabinet-office.gov.uk',
        origin: 'uaa',
        active: true,
        verified: true,
        zoneId: 'uaa',
        name: { familyName: 'User', givenName: 'Stub' },
        emails: [
          { value: 'stub-user@digital.cabinet-office.gov.uk', primary: true },
        ],
        schemas: [ 'urn:scim:schemas:core:1.0' ],
        groups: [
          {
            display: 'cloud_controller.read',
            type: 'DIRECT',
            value: '177eb558-5e9a-42a5-9316-438aee2b88a4',
          },
        ],
        phoneNumbers: [],
        approvals: [],
        passwordLastModified: '2019-01-01T00:00:00',
        previousLogonTime: 1527032725657,
        lastLogonTime: 1527032725657,
      });

      expect(functionOutput).toMatchObject(expectedOutput);
    });

    it('should output object with substitute data if user is null', () => {

      const userIsNull = constructZendeskRequesterObject(null);

      const expecteNullUserOutput = {
        name: 'GOV.UK PaaS Admin',
        locale_id: 1176,
        email: 'gov-uk-paas-support@digital.cabinet-office.gov.uk',
      };

      expect(userIsNull).toMatchObject(expecteNullUserOutput);
    });
  });

  describe(filterOutRealOrganisations, () => {
    it('should return only real organisations', () => {
      const orgs = [
        lodash.merge(defaultV3Org(), { name: 'org c' }),
        lodash.merge(defaultV3Org(), { name: 'org a' }),
        lodash.merge(defaultV3Org(), { name: 'ACC-123' }),
        lodash.merge(defaultV3Org(), { name: 'BACC-123' }),
        lodash.merge(defaultV3Org(), { name: 'CATS-123' }),
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
