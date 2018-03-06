import {test} from 'tap';
import express from 'express';
import nock from 'nock';
import request from 'supertest';
import {Client} from '../cf';
import {apps} from '../cf/client.test.data';
import applicationsApp from '.';

nock('https://example.com').get('/api/v2/spaces/be1f9c1d-e629-488e-a560-a35b545f0ad7/apps').times(1).reply(200, apps);

const app = express();

app.use((req, res, next) => {
  req.log = console;
  next();
});

app.use((req, res, next) => {
  req.cf = new Client('https://example.com/api', 'qwerty123456');
  next();
});

app.use(applicationsApp);

test('should show the orgs pages', async t => {
  const response = await request(app).get('/be1f9c1d-e629-488e-a560-a35b545f0ad7');

  t.equal(response.status, 200);
  t.contains(response.text, 'Applications');
});
