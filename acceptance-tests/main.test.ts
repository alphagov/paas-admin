import pino from 'pino';
import {describe,it,before,after} from 'mocha';
import expect from 'expect';
import axios from 'axios';
import CloudFoundryClient from '../src/lib/cf/cf';
import UAAClient, { authenticateUser } from '../src/lib/uaa';
import { AccountsClient } from '../src/lib/accounts';
import Browser from 'zombie';

const {
  PAAS_ADMIN_BASE_URL,
  CF_API_BASE_URL,
  ACCOUNTS_API_BASE_URL,
  ACCOUNTS_PASSWORD,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} = process.env;
if (!PAAS_ADMIN_BASE_URL) { throw 'PAAS_ADMIN_BASE_URL environment variable not set' }
if (!CF_API_BASE_URL) { throw 'CF_API_BASE_URL environment variable not set' }
if (!ACCOUNTS_API_BASE_URL) { throw 'ACCOUNTS_API_BASE_URL environment variable not set' }
if (!ACCOUNTS_PASSWORD) { throw 'ACCOUNTS_PASSWORD environment variable not set' }
if (!ADMIN_USERNAME) { throw 'ADMIN_USERNAME environment variable not set' }
if (!ADMIN_PASSWORD) { throw 'ADMIN_PASSWORD environment variable not set' }

describe('paas-admin', function () {
  this.timeout(10000);

  describe('when the client is not authenticated', () => {
    it('passes its healthcheck', async () => {
      const response = await axios.request({url: PAAS_ADMIN_BASE_URL + '/healthcheck'});

      expect(response.status).toEqual(200);
      expect(response.data).toEqual({message:'OK'});
    });

    it('redirects to the login service', async () => {
      try {
        await axios.request({url: PAAS_ADMIN_BASE_URL, maxRedirects: 0});
      }
      catch(rejection) {
        expect(rejection.response.status).toEqual(302);
      }
    });
  });

  describe('when the client is authenticated', () => {
    const randomSuffix = '' + Math.floor(Math.random()*1e6);
    const managerUserEmail = `CAT-paas-admin-acceptance-manager-${randomSuffix}@example.com`;
    const managerUserPassword = `${Math.floor(Math.random()*1e12)}`;

    const browser = new Browser();

    let cfClient: CloudFoundryClient;
    let uaaClient: UAAClient;
    let managerUserGuid: string;

    before(async () => {
      cfClient = new CloudFoundryClient({
        apiEndpoint: CF_API_BASE_URL,
        logger: pino({level: 'silent'}),
      });

      const cfInfo = await cfClient.info();
      const accessToken = await authenticateUser(cfInfo.authorization_endpoint, { username: ADMIN_USERNAME, password: ADMIN_PASSWORD });

      uaaClient =  new UAAClient({ apiEndpoint: cfInfo.authorization_endpoint, accessToken: accessToken });
      cfClient = new CloudFoundryClient({
        apiEndpoint: CF_API_BASE_URL,
        accessToken: accessToken,
        logger: pino({level: 'silent'}),
      });

      const uaaUser = await uaaClient.createUser(managerUserEmail, managerUserPassword);
      await cfClient.createUser(uaaUser.id);

      // Accept all pending documents:
      const accountsClient = new AccountsClient({
        apiEndpoint: ACCOUNTS_API_BASE_URL,
        secret: ACCOUNTS_PASSWORD,
        logger: pino({level: 'silent'}),
      });
      const pendingDocuments = await accountsClient.getPendingDocumentsForUserUUID(uaaUser.id);
      await Promise.all(pendingDocuments.map(d => accountsClient.createAgreement(d.name, uaaUser.id)));

      managerUserGuid = uaaUser.id;
    });

    after(async () => {
      if (managerUserGuid) {
        await uaaClient.deleteUser(managerUserGuid);
        await cfClient.deleteUser(managerUserGuid);
      }
    });

    before(async () => {
      await <any>browser.visit(PAAS_ADMIN_BASE_URL);
      browser.assert.text('button', 'Continue');

      await <any>browser.fill('username', managerUserEmail);
      await <any>browser.fill('password', managerUserPassword);
      await <any>browser.pressButton('Continue');
      browser.assert.text('a', /Sign out/);
    });

    it('should show a count of orgs on the home page', async () => {
      await <any>browser.visit(PAAS_ADMIN_BASE_URL);
      browser.assert.text('h1', 'You’re a member of 0 organisations');
    });

    describe('when the user is an organisation manager', () => {
      let orgGuid: string;
      let developerUserGuid: string;
      const orgName = `CAT-paas-admin-${randomSuffix}`;
      const developerUserEmail = `CAT-paas-admin-acceptance-developer-${randomSuffix}@example.com`;

      before(async () => {
        const quotaDefinitions = await cfClient.quotaDefinitions({name: 'small'});
        const quotaGuid = quotaDefinitions[0].metadata.guid;
        const organisation = await cfClient.createOrganization({
          name: orgName,
          quota_definition_guid: quotaGuid
        });
        orgGuid = organisation.metadata.guid;
        await cfClient.setOrganizationRole(orgGuid, managerUserGuid, 'managers', true);

        const uaaUser = await uaaClient.createUser(developerUserEmail, `${Math.floor(Math.random() * 1e12)}`);
        await cfClient.createUser(uaaUser.id);
        developerUserGuid = uaaUser.id;
      });

      after(async () => {
        if (orgGuid) { await cfClient.deleteOrganization({ guid: orgGuid, recursive: true, async: false }); }
        if (developerUserGuid) { await cfClient.deleteUser(developerUserGuid); }
      });

      it('should show a count of orgs on the home page', async () => {
        await <any>browser.visit(PAAS_ADMIN_BASE_URL);
        browser.assert.text('h1', 'You’re a member of 1 organisations');
      });

      it('should invite a user', async () => {
        await <any>browser.visit(`${PAAS_ADMIN_BASE_URL}/organisations/${orgGuid}/users/invite`);
        browser.assert.text('h2', /Invite a new team member/);
        await <any>browser.fill('email', developerUserEmail);
        await <any>browser.check(`org_roles[${orgGuid}][managers][desired]`);
        await <any>browser.pressButton('Send invitation');
        browser.assert.text('.govuk-panel__title', /Success!/);
      });
    });

  });
});
