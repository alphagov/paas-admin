import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import CloudFoundryClient from '../cf';
import * as data from '../cf/cf.test.data';

import { viewApplication } from '.';
import { IContext } from '../app/context';
import NotificationClient from '../notify';
import UAAClient from '../uaa';

nock('https://example.com/api').persist()
  .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123').times(1).reply(200, data.app)
  .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/summary').times(1).reply(200, data.appSummary)
  .get('/v2/spaces/7846301e-c84c-4ba9-9c6a-2dfdae948d52').times(1).reply(200, data.space)
  .get('/v2/spaces/1053174d-eb79-4f16-bf82-9f83a52d6e84').times(1).reply(200, data.space)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, data.organization);

const ctx: IContext = {
  cf: new CloudFoundryClient({
    apiEndpoint: 'https://example.com/api',
    accessToken: '__CF_ACCESS_TOKEN__',
  }),
  routePartOf: () => false,
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

test('should show the application overview page', async t => {
  const response = await viewApplication(ctx, {
    applicationGUID: '15b3885d-0351-4b9b-8697-86641668c123',
    organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
    spaceGUID: '7846301e-c84c-4ba9-9c6a-2dfdae948d52',
  });

  t.contains(response.body, /name-79 - Application Overview/);
});
