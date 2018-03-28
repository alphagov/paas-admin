import nock from 'nock';
import pino from 'pino';
import {test} from 'tap';

import { IContext } from '../app/context';
import CloudFoundryClient from '../cf';
import * as data from '../cf/cf.test.data';
import NotificationClient from '../notify';
import UAAClient from '../uaa';

import { viewService } from '.';

nock('https://example.com/api')
  .get('/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92').times(1).reply(200, data.serviceInstance)
  .get('/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1').times(1).reply(200, data.servicePlan)
  .get('/v2/services/a00cacc0-0ca6-422e-91d3-6b22bcd33450').times(1).reply(200, data.service)
  .get('/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139').times(1).reply(200, data.space)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, data.organization);

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

test('should show the service overview page', async t => {
  const response = await viewService(ctx, {
    organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
    serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
    spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
  });

  t.contains(response.body, 'name-1508 - Service Overview');
});
