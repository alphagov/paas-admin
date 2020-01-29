import nock from 'nock';

import NotificationClient from '.';

describe('lib/notify test suite', () => {
  let nockNotify: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockNotify = nock(/api.notifications.service.gov.uk/);
  });

  afterEach(() => {
    nockNotify.done();

    nock.cleanAll();
  });

  it('notify middleware should include NotifyClient on req', async () => {
    nockNotify
      .post('/v2/notifications/email')
      .reply(200, { content: { body: 'FAKE_NOTIFY_RESPONSE' } });

    const notify = new NotificationClient({
      apiKey: 'test-key-1234',
      templates: { welcome: 'WELCOME_ID' },
    });

    const personalisation = {
      url: 'https://default.url',
      organisation: 'DefaultOrg',
      location: 'DefaultLocation',
    };

    const notifyResponse = await notify.sendWelcomeEmail(
      'jeff@jeff.com',
      personalisation,
    );

    expect(notifyResponse.body.content.body).toContain('FAKE_NOTIFY_RESPONSE');
  });
});
