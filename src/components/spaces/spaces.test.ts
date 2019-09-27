import lodash from 'lodash';
import nock from 'nock';

import * as spaces from '.';

import * as data from '../../lib/cf/cf.test.data';
import {app as defaultApp} from '../../lib/cf/test-data/app';
import {org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapResources} from '../../lib/cf/test-data/wrap-resources';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

const ctx: IContext = createTestContext();
const spaceGuid = 'bc8d3381-390d-4bd7-8c71-25309900a2e3';

describe('spaces test suite', () => {
  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock('https://example.com/api');
    nockAccounts = nock('https://example.com/accounts');

    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275')
      .reply(200, defaultOrg())
    ;
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.done();

    nock.cleanAll();
  });

  it('should show the spaces pages', async () => {
    const secondSpace = '5489e195-c42b-4e61-bf30-323c331ecc01';

    nockAccounts
      .get('/users/uaa-id-253').reply(200, JSON.stringify({
        user_uuid: 'uaa-id-253',
        username: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
        user_email: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
      }))
    ;

    nockCF
      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces')
      .reply(200, data.spaces)

      .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles')
      .times(3)
      .reply(200, data.users)

      .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019')
      .reply(200, data.spaceQuota)

      .get(`/v2/spaces/${spaceGuid}/apps`)
      .reply(200, JSON.stringify(wrapResources(
        lodash.merge(defaultApp(), {entity: {name: 'first-app'}}),
        lodash.merge(defaultApp(), {entity: {name: 'second-app'}}),
      )))

      .get('/v2/stacks')
      .reply(200, data.spaces)

      .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6')
      .reply(200, data.organizationQuota)

      .get(`/v2/spaces/${secondSpace}/apps`)
      .reply(200, JSON.stringify(wrapResources(
        lodash.merge(defaultApp(), {entity: {name: 'second-space-app'}}),
      )))
    ;
    const response = await spaces.listSpaces(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });

    expect(response.body).toContain('Spaces');
    expect(response.body).toMatch(/1[.]00.*gb.*\s+of\s+20[.]00.*gb/m);
    expect(response.body).toMatch(/2[.]00.*gb.*\s+of\s+no limit/m);
  });

  it('should show list of applications in space', async () => {
    const appGuid = 'efd23111-72d1-481e-8168-d5395e0ea5f0';
    const appName = 'name-2064';
    nockCF
      .get('/v2/stacks')
      .reply(200, data.spaces)

      .get(`/v2/spaces/${spaceGuid}/apps`)
      .reply(200, JSON.stringify(wrapResources(
        lodash.merge(defaultApp(), {metadata: {guid: appGuid}, entity: {name: appName}}),
      )))

      .get(`/v2/apps/${appGuid}/summary`)
      .reply(200, data.appSummary)

      .get(`/v2/spaces/${spaceGuid}`)
      .reply(200, data.space)
    ;
    const response = await spaces.listApplications(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      spaceGUID: spaceGuid,
    });

    expect(response.body).toContain(`${appName} - Overview`);
  });

  it('should show list of services in space', async () => {
    nockCF
      .get(`/v2/spaces/${spaceGuid}/service_instances`)
      .reply(200, data.services)

      .get(`/v2/user_provided_service_instances?q=space_guid:${spaceGuid}`)
      .reply(200, data.services)

      .get('/v2/service_plans/fcf57f7f-3c51-49b2-b252-dc24e0f7dcab')
      .reply(200, data.servicePlan)

      .get('/v2/services/775d0046-7505-40a4-bfad-ca472485e332')
      .reply(200, data.service)

      .get(`/v2/spaces/${spaceGuid}`)
      .reply(200, data.space)
    ;

    const response = await spaces.listBackingServices(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      spaceGUID: spaceGuid,
    });

    expect(response.body).toContain('name-2064 - Overview');
    expect(response.body).toContain('name-2104');
  });
});
