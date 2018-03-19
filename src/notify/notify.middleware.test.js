import express from 'express';
import {test} from 'tap';
import request from 'supertest';
import nock from 'nock';
import {notifyMiddleware} from '.';

test('notify middleware should include NotifyClient on req', async t => {
  nock(/api.notifications.service.gov.uk/)
    .persist()
    .filteringPath(() => '/')
    .post('/').reply(200, {notify: 'FAKE_NOTIFY_RESPONSE'});
  const app = express();
  app.use(notifyMiddleware({apiKey: 'test-key-1234', templates: {welcome: 'WELCOME_ID'}}));
  app.get('/', (req, res, next) => {
    req.notify.sendWelcomeEmail('jeff@jeff.com')
      .then(notifyResponse => res.json(notifyResponse))
      .catch(next);
  });
  const response = await request(app).get('/');

  t.contains(response.text, 'FAKE_NOTIFY_RESPONSE');
});
