import {test} from 'tap';
import express from 'express';
import nock from 'nock';
import request from 'supertest';
import {Client} from '../cf';
import {spaces} from '../cf/client.test.data';
import spacesApp from '.';

nock('https://example.com').get('/api/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').times(1).reply(200, spaces);

const app = express();

app.use((req, res, next) => {
  req.log = console;
  next();
});

app.use((req, res, next) => {
  req.cf = new Client('https://example.com/api', 'qwerty123456');
  next();
});

app.use(spacesApp);

test('should show the spaces pages', async t => {
  const response = await request(app).get('/3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.equal(response.status, 200);
  t.contains(response.text, 'Spaces');
});
