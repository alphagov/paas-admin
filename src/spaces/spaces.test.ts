import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import { IContext } from '../app/context';
import CloudFoundryClient from '../cf';
import * as data from '../cf/cf.test.data';
import NotificationClient from '../notify';
import UAAClient from '../uaa';

import * as spaces from '.';

nock('https://example.com/api')
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').times(1).reply(200, data.organization)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').times(1).reply(200, data.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').times(1).reply(200, data.users)
  .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6').times(1).reply(200, data.organizationQuota)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/summary').times(2).reply(200, data.spaceSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/summary').times(2).reply(200, data.spaceSummary)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, data.organization)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/apps').times(1).reply(200, data.apps)
  .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary').times(1).reply(200, data.appSummary)
  .get('/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/summary').times(1).reply(200, data.appSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3').times(1).reply(200, data.space)
  .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').times(1).reply(200, data.spaceQuota);

const ctx: IContext = {
  cf: new CloudFoundryClient({
    apiEndpoint: 'https://example.com/api',
    accessToken: '__CF_ACCESS_TOKEN__',
  }),
  linkTo: () => '__LINKED_TO__',
  log: pino({level: 'silent'}),
  notify: new NotificationClient({apiKey: '__NOTIFY_KEY__', templates: {}}),
  rawToken: {user_id: '__USER_ID__', scope: []},
  uaa: new UAAClient({
    apiEndpoint: 'https://example.com/uaa',
    clientCredentials: {
      clientID: '__UAA_CLIENT_ID__',
      clientSecret: '__UAA_CLIENT_SECRET__',
    },
  }),
};

test('should show the spaces pages', async t => {
  const response = await spaces.listSpaces(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  });

  t.contains(response.body, 'Spaces');
});

test('should space overview', async t => {
  const response = await spaces.listApplications(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    spaceGUID: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
  });

  t.contains(response.body, 'name-1382 - Overview');
});
