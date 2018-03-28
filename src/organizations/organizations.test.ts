import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import { IContext } from '../app/context';
import CloudFoundryClient from '../cf';
import { organizations } from '../cf/cf.test.data';
import NotificationClient from '../notify';
import UAAClient from '../uaa';

import { listOrganizations } from '.';

nock('https://example.com/api').get('/v2/organizations').times(1).reply(200, organizations);

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

test('should show the organisation pages', async t => {
  const response = await listOrganizations(ctx, {});

  t.contains(response.body, 'Choose an organisation');
});
