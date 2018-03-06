import {test} from 'tap';
import express from 'express';
import nock from 'nock';
import request from 'supertest';
import {Client} from '../cf';
import {orgs} from '../cf/client.test.data';
import orgsApp from '.';

nock('https://example.com').get('/api/v2/spaces/f858c6b3-f6b1-4ae8-81dd-8e8747657fbe/service_instances').times(1).reply(200, orgs);

const app = express();

app.use((req, res, next) => {
  req.log = console;
  next();
});

app.use((req, res, next) => {
  req.cf = new Client('https://example.com/api', 'qwerty123456');
  next();
});

app.use(orgsApp);

test('should show the orgs pages', async t => {
  const response = await request(app).get('/f858c6b3-f6b1-4ae8-81dd-8e8747657fbe');

  t.equal(response.status, 200);
  t.contains(response.text, 'Services');
});
