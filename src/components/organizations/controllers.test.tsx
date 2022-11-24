import jwt from 'jsonwebtoken';
import lodash from 'lodash';
import nock from 'nock';

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
import { CLOUD_CONTROLLER_ADMIN, Token } from '../auth';

import { 
  constructSubject,
  constructZendeskRequesterObject,
  editOrgData, emailManagersForm,
  emailManagersFormPost,
  emailManagersZendeskContent,
  updateOrgData,
} from './controllers';

import { listOrganizations } from '.';
import * as cfData from '../../lib/cf/cf.test.data';

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
    lodash.merge(defaultOrg(), {
      entity: {
        name: 'z-org-name-5',
        status: 'suspended',
      },
    }),
    lodash.merge(defaultOrg(), {
      entity: {
        name: 'SMOKE-',
      },
    }),
  ),
);

function extractOrganizations(responseBody: string): ReadonlyArray<string> {
  const re = /(Organisation\sname:)\s(SMOKE-)|(Organisation\sname:)\s(.-(trial-)?org-name(-\d)?)/g;
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

//reusable test user context function
const createTestUserContext = (isAdmin = false, userId = 'uaa-id-253') => {
  const scope = isAdmin? [CLOUD_CONTROLLER_ADMIN ]: []
  
  const time = Math.floor(Date.now() / 1000);
  const rawToken = {
    exp: time + 24 * 60 * 60,
    origin: 'uaa',
    scope: scope,
    user_id: userId,
  };
  const accessToken = jwt.sign(rawToken, 'secret');
  const token = new Token(accessToken, ['secret']);
  return createTestContext({token})
}

const nonAdminUserContext:IContext = createTestUserContext();
const adminUserContext:IContext = createTestUserContext(true);

let nockCF: nock.Scope;
let nockZD: nock.Scope;
let nockAccounts: nock.Scope;
let nockUAA: nock.Scope;

nockCF = nock('https://example.com/api');
nockZD = nock('https://example.com/zendesk');
nockAccounts = nock('https://example.com/accounts');
nockUAA = nock('https://example.com/uaa');


describe('organizations test suite', () => {

  beforeEach(() => {
    nock.cleanAll();

    nockCF
      .get('/v2/organizations')
      .reply(200, organizations)

      .get(`/v2/quota_definitions/${billableOrgQuotaGUID}`)
      .reply(200, JSON.stringify(billableOrgQuota()))

      .get(`/v2/quota_definitions/${trialOrgQuotaGUID}`)
      .reply(200, JSON.stringify(trialOrgQuota()));
  });

  afterEach(() => {
    nockCF.on('response', () => {
      nockCF.done();
    });

    nock.cleanAll();
  });

  it('should show the organisation pages', async () => {
    const response = await listOrganizations(nonAdminUserContext, {});

    expect(response.body).toContain('Organisations');
  });

  it('should sort the organisations by name', async () => {
    const response = await listOrganizations(nonAdminUserContext, {});

    const matches = extractOrganizations(response.body as string);
    expect(matches.length).toBe(7);
    expect(matches[0]).toContain('a-org-name-4');
    expect(matches[1]).toContain('a-trial-org-name');
    expect(matches[2]).toContain('b-org-name-3');
    expect(matches[3]).toContain('c-org-name-1');
    expect(matches[4]).toContain('d-org-name-2');
    expect(matches[5]).toContain('SMOKE');
    expect(matches[6]).toContain('z-org-name-5');
  });

  it('should report the org quotas for both trial and billable orgs', async () => {
    const response = await listOrganizations(nonAdminUserContext, {});

    expect(response.body).toMatch(/a-org-name-4.*(?!Trial)Billable/ms);
    expect(response.body).toMatch(/a-trial-org-name.*(?!Billable)Trial/ms);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the filtered list of organisations', async () => {
    const response = await listOrganizations(adminUserContext, {view:'realOrgsOnly'});
    const matches = extractOrganizations(response.body as string);
    expect(matches.length).toBe(5);
  });
});

describe(editOrgData, () => {

  const organization = {
    guid: '__ORG_GUID__',
    metadata: { annotations: { owner: 'Testing Departament' } },
    name: 'org-name',
    relationships: {
      quota: {
        data: {
          guid: '__QUOTA_1_GUID__',
        },
      },
    },
  };
  const quota = {
    apps: { total_memory_in_mb: 2 },
    guid: '__QUOTA_1_GUID__',
    name: 'quota-1',
    routes: { total_routes: 2 },
    services: { total_service_instances: 2 },
  };

  describe('when not a platform admin', () => {

    it('should return an error', async () => {
      await expect(editOrgData(nonAdminUserContext, {})).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });

  describe('when platform admin', () => {

    beforeEach(() => {

      nockCF
        .get(`/v3/organizations/${organization.guid}`)
        .reply(200, organization)

        .get('/v3/organization_quotas')
        .reply(200, {
          pagination: {
            total_pages: 1,
            total_results: 3,
          },
          resources: [
            quota,
            { ...quota, guid: '__QUOTA_3_GUID__', name: 'CATS-qwertyuiop' },
            { ...quota, guid: '__QUOTA_2_GUID__', name: 'quota-2' },
          ],
        });
    });

    afterEach(() => {
      nockCF.on('response', () => {
      nockCF.done();
    });

      nock.cleanAll();
    });

    it('should correctly parse data into a form', async () => {
      const response = await editOrgData(adminUserContext, { organizationGUID: organization.guid });

      expect(response.status).toBeUndefined();
      expect(response.body).toContain(`Organisation ${organization.name}`);
    });
  });
});

describe(updateOrgData, () => {

  const organization = {
    guid: '__ORG_GUID__',
    metadata: { annotations: { owner: 'Testing Departament' } },
    name: 'org-name',
    relationships: {
      quota: {
        data: {
          guid: '__QUOTA_1_GUID__',
        },
      },
    },
  };
  const quotaGUID = '__QUOTA_GUID__';

  const params = { organizationGUID: organization.guid };
  const body = { name: organization.name, owner: 'Testing Departament', quota: quotaGUID, suspended: 'true' };


  describe('when not a platform admin', () => {

    it('should return an error', async () => {
      await expect(updateOrgData(nonAdminUserContext, params, body)).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });

  describe('when platform admin', () => {

    beforeEach(() => {
      nockCF
        .get(`/v3/organizations/${organization.guid}`)
        .reply(200, organization)

        .patch(`/v3/organizations/${organization.guid}`)
        .reply(200, organization)

        .post(`/v3/organization_quotas/${quotaGUID}/relationships/organizations`)
        .reply(201, { data: [{ guid: organization.guid }] });
    });

    afterEach(() => {
      nockCF.on('response', () => {
      nockCF.done();
    });

      nock.cleanAll();
    });

    it('should parse the success message correctly', async () => {
      const response = await updateOrgData(adminUserContext, params, body);

      expect(response.status).toBeUndefined();
      expect(response.body).toContain('Organisation successfully updated');
    });
  });
});

describe(emailManagersForm, () => {
  describe('when not a platform admin', () => {

    it('should return an error', async () => {
      await expect(emailManagersForm(nonAdminUserContext, {} as any)).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });
  describe('when platform admin', () => {
    const organizationGUID = 'a7aff246-5f5b-4cf8-87d8-f316053e4a20';

    beforeEach(() => {
      nockCF
        .get(`/v2/organizations/${organizationGUID}/user_roles`)
        .times(2)
        .reply(200, cfData.userRolesForOrg)

        .get(`/v2/organizations/${organizationGUID}`)
        .reply(200, defaultOrg())

        .get(`/v2/organizations/${organizationGUID}/spaces`)
        .times(2)
        .reply(200, cfData.spaces)
      });

    afterEach(() => {
      nockCF.on('response', () => {
        nockCF.done();
      });
  
      nock.cleanAll();
    });

    it('should render the page correctly', async () => {

      const response = await emailManagersForm(adminUserContext, { organizationGUID: organizationGUID });

      expect(response.body).toContain('the-system_domain-org-name');
      expect(response.body).toContain('Email organisation managers');
      expect(response.body).toContain('Email billing managers');
      expect(response.body).toContain('Email space managers');
      expect(response.body).toContain('Select a space');
      expect(response.body).toContain('Message');
    });
  });
});

describe(emailManagersFormPost, () => {
  describe('when not a platform admin', () => {

    it('should return an error', async () => {
      await expect(emailManagersFormPost(nonAdminUserContext, {}, {} as any)).rejects.toThrow(
        /Not a platform admin/,
      );
    });
  });
  describe('when platform admin', () => {
    let ctx: IContext;

    const organizationGUID = 'a7aff246-5f5b-4cf8-87d8-f316053e4a20';
    const spaceGUID = '5489e195-c42b-4e61-bf30-323c331ecc01';
    const mockAccountsUser = {
      user_email: 'tester@test.com',
      username: 'tester@test.com',
      user_uuid: 'uaa-id-253',
    }
    const platformAdmin = {
      id: 'platform-admin',
      userName: 'platform-admin@fake.cabinet-office.gov.uk',
      name: { familyName: 'Stub', givenName: 'User' },
      emails: [{
        value: 'platform-admin@fake.cabinet-office.gov.uk',
        primary: false,
      }],
    }

    beforeEach(() => {
      // special user context to have matching data from test data set
      ctx = createTestUserContext(true, 'platform-admin');
      nockCF
        .get(`/v2/organizations/${organizationGUID}/user_roles`)
        .times(2)
        .reply(200, cfData.userRolesForOrg)

        .get(`/v2/organizations/${organizationGUID}`)
        .reply(200, defaultOrg())

        .get(`/v2/organizations/${organizationGUID}/spaces`)
        .times(2)
        .reply(200, cfData.spaces)
      
    });

    afterEach(() => {
      nockAccounts.done();
      nockUAA.done();
      nockCF.on('response', () => {
        nockCF.done();
      });
  
      nock.cleanAll();
    });

    it('should create a zendesk ticket correctly', async () => {
      nockZD
        .post('/tickets.json')
        .reply(201, {});

      nockAccounts
        .get('/users/uaa-id-253')
        .reply(200, mockAccountsUser)

      nockUAA
        .get('/Users/platform-admin')
        .reply(200, platformAdmin)
        .post('/oauth/token?grant_type=client_credentials')
        .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}');

      const response = await emailManagersFormPost(ctx, { organizationGUID: organizationGUID }, {
        managerType: 'org_manager',
        message: 'message text',
        space: spaceGUID,
      } as any);

      expect(response.status).toBeUndefined();
      expect(response.body).toContain('Message has been sent');
      expect(response.body).toContain('A Zendesk ticket has also been created to track progress');
    });

    it('should throw validation errors when missing data has been submited', async () => {

      const response = await emailManagersFormPost(ctx, { organizationGUID: organizationGUID }, {} as any);

      expect(response.body).not.toContain('We have received your request');
      expect(response.body).toContain('Error');
      expect(response.body).toContain('Select a manager role');
      expect(response.body).toContain('Enter your message');
    });

    it('should throw an error if org has no managers of selected type', async () => {
      const response = await emailManagersFormPost(ctx, { organizationGUID: organizationGUID }, {
        managerType: 'billing_manager',
        message: 'message text',
      } as any);

      expect(response.body).not.toContain('We have received your request');
      expect(response.body).toContain('Error');
      expect(response.body).toContain('Select organisation does not have any of the selected manager roles');
    });

    it('should throw an error if space manager option was selected but space was not', async () => {

      const response = await emailManagersFormPost(ctx, { organizationGUID: organizationGUID }, {
        managerType: 'space_manager',
        message: 'message text',
        space: '',
      } as any);

      expect(response.body).not.toContain('We have received your request');
      expect(response.body).toContain('Error');
      expect(response.body).toContain('Select a space');
    });

    it('should throw an error selected space has no managers', async () => {

      nockCF
      .get(`/v2/spaces/${spaceGUID}/user_roles`)
      .reply(200, cfData.userRolesForSpace)

      const response = await emailManagersFormPost(ctx, { organizationGUID: organizationGUID }, {
        managerType: 'space_manager',
        message: 'message text',
        space: spaceGUID,
      } as any);

      expect(response.body).not.toContain('We have received your request');
      expect(response.body).toContain('Error');
      expect(response.body).toContain('Selected space does not have any space managers');
    });
  });
});

describe('helper functions', () => {
  describe(emailManagersZendeskContent, () => {
    // whitespace matters
  const expectedOutputForSpaceManager = `
Message content

You are receiving this email as you are listed as a space manager of dream space in the test organisation in our NARNIA region.

Thank you,
GOV.UK PaaS`;

    it('should output expected text', () => {
      const zendeskEmailContent = emailManagersZendeskContent({
        message: 'Message content',
        managerType: 'space_manager',
        space: 'dream',
      },
      'narnia',
      'test',
      );

      expect(zendeskEmailContent).toEqual(expectedOutputForSpaceManager);
    });
    it('should output BILLING manager text if billign manager selected', () => {
      const zendeskEmailContent = emailManagersZendeskContent({
        message: 'Message content',
        managerType: 'billing_manager',
        space: 'dream',
      },
      'narnia',
      'test',
      );
      expect(zendeskEmailContent).toContain('a billing manager');
    });

    it('should output ORG manager text if billign manager selected', () => {
      const zendeskEmailContent = emailManagersZendeskContent({
        message: 'Message content',
        managerType: 'org_manager',
        space: 'dream',
      },
      'narnia',
      'test',
      );
      expect(zendeskEmailContent).toContain('an organisation manager');
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

  describe(constructSubject, () => {

    it('should output default text if user subject not provided', () => {
      const output = constructSubject('');
      expect(output).toBe("[PaaS Support] About your organisation on GOV.UK PaaS");
    });

    it('should output user provided subject text', () => {
      const output = constructSubject('Custom subject');
      expect(output).toBe("[PaaS Support] Custom subject");
    });

  });

});
