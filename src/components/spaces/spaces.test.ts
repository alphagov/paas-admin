import nock from 'nock';

import * as spaces from '.';

import * as data from '../../lib/cf/cf.test.data';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

// tslint:disable:max-line-length
nock('https://example.com/api').persist()
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, data.organization)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').reply(200, data.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').reply(200, data.users)
  .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6').reply(200, data.organizationQuota)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/apps').reply(200, data.apps)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/summary').reply(200, data.spaceSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/summary').reply(200, data.spaceSummary)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').reply(200, data.organization)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/apps').reply(200, data.apps)
  .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary').reply(200, data.appSummary)
  .get('/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/summary').reply(200, data.appSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/service_instances').reply(200, data.services)
  .get('/v2/service_plans/fcf57f7f-3c51-49b2-b252-dc24e0f7dcab').reply(200, data.servicePlan)
  .get('/v2/services/775d0046-7505-40a4-bfad-ca472485e332').reply(200, data.service)
  .get('/v2/user_provided_service_instances?q=space_guid:bc8d3381-390d-4bd7-8c71-25309900a2e3').reply(200, data.services)
  .get('/v2/stacks').reply(200, data.spaces)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3').reply(200, data.space)
  .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').reply(200, data.spaceQuota);

nock('https://example.com/accounts').persist()
  .get('/users/uaa-id-253').reply(200, JSON.stringify({
    user_uuid: 'uaa-id-253',
    username: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
    user_email: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
  }));
// tslint:enable:max-line-length

const ctx: IContext = createTestContext();

describe('spaces test suite', () => {
  it('should show the spaces pages', async () => {
    const response = await spaces.listSpaces(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });

    expect(response.body).toContain('Spaces');
  });

  it('should show the spaces page application counter', async () => {
    const response = await spaces.listSpaces(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });

    expect(response.body).toContain('has 1 apps');

    expect(response.body).toContain('2gb');
  });

  it('should show list of applications in space', async () => {
    const response = await spaces.listApplications(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      spaceGUID: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    expect(response.body).toContain('name-2064 - Overview');
  });

  it('should show list of services in space', async () => {
    const response = await spaces.listBackingServices(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      spaceGUID: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    expect(response.body).toContain('name-2064 - Overview');
    expect(response.body).toContain('name-2104');
  });
});
