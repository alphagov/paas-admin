import nock from 'nock';
import { test } from 'tap';

import NotificationClient from '.';

test('notify middleware should include NotifyClient on req', async t => {
  nock(/api.notifications.service.gov.uk/)
    .persist()
    .filteringPath(() => '/')
    .post('/').reply(200, {content: {body: 'FAKE_NOTIFY_RESPONSE'}});

  const notify = new NotificationClient({apiKey: 'test-key-1234', templates: {welcome: 'WELCOME_ID'}});
  const notifyResponse = await notify.sendWelcomeEmail('jeff@jeff.com');

  t.contains(notifyResponse.body.content.body, 'FAKE_NOTIFY_RESPONSE');
});
