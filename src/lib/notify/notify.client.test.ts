import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import NotificationClient from '.';

describe('lib/notify test suite', () => {

  const handlers = [
    http.post('https://api.notifications.service.gov.uk/v2/notifications/email', () => {
      return HttpResponse.json(
        { content: { body: 'FAKE_NOTIFY_RESPONSE' } },
        { status: 200 },
      );
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('notify middleware should include NotifyClient on req', async () => {

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
