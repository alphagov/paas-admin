import {test} from 'tap';
import express from 'express';
import nock from 'nock';
import request from 'supertest';
import {Client} from '../cf';
import {organizations} from '../cf/client.test.data';
import organizationsApp from '.';

nock('https://example.com').get('/api/v2/organizations').times(1).reply(200, organizations);

const app = express();

app.use((req, res, next) => {
  req.log = console;
  next();
});

app.use((req, res, next) => {
  req.cf = new Client('https://example.com/api', 'qwerty123456');
  next();
});

app.use(organizationsApp);

test('should show the organisation pages', async t => {
  const response = await request(app).get('/');

  t.equal(response.status, 200);
  t.contains(response.text, 'Choose an organisation');
});
