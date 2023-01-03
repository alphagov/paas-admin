import axios from 'axios';
import { expect } from 'expect';
import pino from 'pino';
import puppeteer, { Page } from "puppeteer";


import { AccountsClient } from '../src/lib/accounts';
import CloudFoundryClient from '../src/lib/cf/cf';
import UAAClient, { authenticateUser } from '../src/lib/uaa';

const {
  PAAS_ADMIN_BASE_URL,
  CF_API_BASE_URL,
  ACCOUNTS_API_BASE_URL,
  ACCOUNTS_PASSWORD,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  HEADLESS,
} = process.env;
if (!PAAS_ADMIN_BASE_URL) { throw 'PAAS_ADMIN_BASE_URL environment variable not set'; }
if (!CF_API_BASE_URL) { throw 'CF_API_BASE_URL environment variable not set'; }
if (!ACCOUNTS_API_BASE_URL) { throw 'ACCOUNTS_API_BASE_URL environment variable not set'; }
if (!ACCOUNTS_PASSWORD) { throw 'ACCOUNTS_PASSWORD environment variable not set'; }
if (!ADMIN_USERNAME) { throw 'ADMIN_USERNAME environment variable not set'; }
if (!ADMIN_PASSWORD) { throw 'ADMIN_PASSWORD environment variable not set'; }

jest.setTimeout(30000)

describe('paas-admin', () => {

  describe('when the client is not authenticated', () => {
    it('passes its healthcheck', async () => {
      const response = await axios.request({ url: `${PAAS_ADMIN_BASE_URL  }/healthcheck` });

      expect(response.status).toEqual(200);
      expect(response.data).toEqual({ message:'OK' });
    });

    it('redirects to the login service', async () => {
      try {
        await axios.request({ maxRedirects: 0, url: PAAS_ADMIN_BASE_URL });
      }
      catch(rejection: any) {
        expect(rejection.response.status).toEqual(302);
      }
    });
  });

  describe('when the client is authenticated', () => {
    const randomSuffix = `${  Math.floor(Math.random()*1e6)}`;
    const managerUserEmail = `CAT-paas-admin-acceptance-manager-${randomSuffix}@example.com`;
    const managerUserPassword = `${Math.floor(Math.random()*1e12)}`;

    const browser = puppeteer.launch({
      args: [
        '--disable-dev-shm-usage',
        '--no-sandbox',
      ],
      headless: !HEADLESS ? true : HEADLESS == 'true',
    });
    let page: Page;

    let cfClient: CloudFoundryClient;
    let uaaClient: UAAClient;
    let managerUserGuid: string;

    beforeAll(async () => {
      cfClient = new CloudFoundryClient({
        apiEndpoint: CF_API_BASE_URL,
        logger: pino({ level: 'silent' }),
      });

      const cfInfo = await cfClient.info();
      const accessToken = await authenticateUser(cfInfo.authorization_endpoint, {
        password: ADMIN_PASSWORD,
        username: ADMIN_USERNAME,
      });

      uaaClient = new UAAClient({ accessToken: accessToken, apiEndpoint: cfInfo.authorization_endpoint });
      cfClient = new CloudFoundryClient({
        accessToken: accessToken,
        apiEndpoint: CF_API_BASE_URL,
        logger: pino({ level: 'silent' }),
      });

      const uaaUser = await uaaClient.createUser(managerUserEmail, managerUserPassword);
      await cfClient.createUser(uaaUser.id);

      // Accept all pending documents:
      const accountsClient = new AccountsClient({
        apiEndpoint: ACCOUNTS_API_BASE_URL,
        logger: pino({ level: 'silent' }),
        secret: ACCOUNTS_PASSWORD,
      });
      const pendingDocuments = await accountsClient.getPendingDocumentsForUserUUID(uaaUser.id);
      await Promise.all(pendingDocuments.map(async d => await accountsClient.createAgreement(d.name, uaaUser.id)));

      managerUserGuid = uaaUser.id;
    });

    afterAll(async () => {
      if (managerUserGuid) {
        await uaaClient.deleteUser(managerUserGuid);
        await cfClient.deleteUser(managerUserGuid);
      }
      await (await browser).close();
    });

    beforeAll(async () => {
      page = await (await browser).newPage();

      await page.goto(PAAS_ADMIN_BASE_URL);

      await page.waitForSelector("input[name=username]");
      await page.type("input[name=username]", managerUserEmail);
      await page.type("input[name=password]", managerUserPassword);

      await Promise.all([
        page.waitForNavigation(),
        page.click("button"),
      ]);

      const isSignedIn = await page.evaluate(() => {
        return document?.querySelector("body")?.innerText.includes("Sign out")
      })

      expect(isSignedIn).toBeTruthy();

    });

    it('should show a count of orgs on the home page', async () => {
      await page.goto(PAAS_ADMIN_BASE_URL);

      const zeroOrgs = await page.evaluate(() => {
        return document?.querySelector("body")?.innerText.includes("There are 0 organisations")
      })

      expect(zeroOrgs).toBeTruthy();

    });

    describe('when the user is an organisation manager', () => {
      let orgGuid: string;
      let developerUserGuid: string;
      const orgName = `CAT-paas-admin-${randomSuffix}`;
      const developerUserEmail = `CAT-paas-admin-acceptance-developer-${randomSuffix}@example.com`;
      const developerPassword = `${Math.floor(Math.random() * 1e12)}`;

      beforeAll(async () => {
        const quotaDefinitions = await cfClient.quotaDefinitions({ name: 'small' });
        const quotaGuid = quotaDefinitions[0].metadata.guid;
        const organisation = await cfClient.createOrganization({
          name: orgName,
          quota_definition_guid: quotaGuid,
        });
        orgGuid = organisation.metadata.guid;
        await cfClient.setOrganizationRole(orgGuid, managerUserGuid, 'managers', true);

        const uaaUser = await uaaClient.createUser(developerUserEmail, developerPassword);
        await cfClient.createUser(uaaUser.id);
        developerUserGuid = uaaUser.id;
      });

      afterAll(async () => {
        if (orgGuid) { await cfClient.deleteOrganization({ async: false, guid: orgGuid, recursive: true }); }
        if (developerUserGuid) { await cfClient.deleteUser(developerUserGuid); }
      });

      it('should show a count of orgs on the home page', async () => {
        await page.goto(PAAS_ADMIN_BASE_URL);
        const oneOrg = await page.evaluate(() => {
          return document?.querySelector("body")?.innerText.includes("There is 1 organisation")
        })
  
        expect(oneOrg).toBeTruthy();

      });

      it('should invite a user', async () => {
        await page.goto(PAAS_ADMIN_BASE_URL);
        await Promise.all([
          page.evaluate(() => {
            ([...document.querySelectorAll('a')].find(element => element.textContent?.includes('CAT')))?.click();
          }),
          page.waitForNavigation(),
        ]);

        await Promise.all([
          page.evaluate(() => {
            ([...document.querySelectorAll('a')].find(element => element.textContent === 'View and manage team members'))?.click();
          }),
          page.waitForNavigation(),
        ]);

        await Promise.all([
          page.evaluate(() => {
            ([...document.querySelectorAll('a')].find(element => element.textContent === 'Invite a new team member'))?.click();
          }),
          page.waitForNavigation(),
        ]);

        await page.type("input[name=email]", developerUserEmail);

        await Promise.all([
          page.evaluate(() => {
            ([...document.querySelectorAll('label')]?.find(element => element?.textContent === ('Billing manager')))?.click();
            ([...document.querySelectorAll('button')]?.find(element => element?.textContent === ('Send invitation')))?.click();
          }),
          page.waitForNavigation(),
        ]);

        const confirmationPage = await page.evaluate(() => {
          return document?.querySelector("body")?.innerText.includes("New team member successfully invited")
        })
  
        expect(confirmationPage).toBeTruthy();
      });
    });
  });
});
