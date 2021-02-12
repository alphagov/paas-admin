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
      .times(2)
      .reply(200, { content: { body: 'FAKE_NOTIFY_RESPONSE' } });

    const notify = new NotificationClient({
      apiKey: 'test-key-1234',
      templates: { passwordReset:'PASSWORD_RESET_ID', welcome: 'WELCOME_ID' },
    });

    const personalisation = {
      location: 'DefaultLocation',
      organisation: 'DefaultOrg',
      url: 'https://default.url',
    };

    const notifyWelcomeResponse = await notify.sendWelcomeEmail(
      'jeff@jeff.com',
      personalisation,
    );

    const notifyPasswordResetResponse = await notify.sendPasswordReminder(
      'jeff@jeff.com',
      'https://example.com/reset?code=1234567890',
    );


    expect(notifyWelcomeResponse.data.content.body).toContain('FAKE_NOTIFY_RESPONSE');
    expect(notifyPasswordResetResponse.data.content.body).toContain('FAKE_NOTIFY_RESPONSE');
  });
});
