import nock from 'nock';

import NotificationClient from '.';

describe('lib/notify test suite', () => {
  it('notify middleware should include NotifyClient on req', async () => {
    nock(/api.notifications.service.gov.uk/)
      .persist()
      .filteringPath(() => '/')
      .post('/').reply(200, {content: {body: 'FAKE_NOTIFY_RESPONSE'}});

    const notify = new NotificationClient({apiKey: 'test-key-1234', templates: {welcome: 'WELCOME_ID'}});
    const notifyResponse = await notify.sendWelcomeEmail('jeff@jeff.com');

    expect(notifyResponse.body.content.body).toContain('FAKE_NOTIFY_RESPONSE');
  });
});
