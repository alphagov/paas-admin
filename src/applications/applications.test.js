import {test} from 'tap';
import express from 'express';
import nock from 'nock';
import request from 'supertest';
import {CloudFoundryClient} from '../cf';
import * as data from '../cf/cf.test.data';
import applicationsApp from '.';

nock('https://example.com/api').persist()
  .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123').times(1).reply(200, data.app)
  .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/summary').times(1).reply(200, data.appSummary)
  .get('/v2/spaces/7846301e-c84c-4ba9-9c6a-2dfdae948d52').times(1).reply(200, data.space)
  .get('/v2/spaces/1053174d-eb79-4f16-bf82-9f83a52d6e84').times(1).reply(200, data.space)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, data.organization);

const app = express();

app.use((req, res, next) => {
  req.log = console;
  next();
});

app.use((req, res, next) => {
  req.cf = new CloudFoundryClient({
    apiEndpoint: 'https://example.com/api',
    accessToken: 'qwerty123456'
  });
  next();
});

app.use(applicationsApp);

test('should show the application overview page', async t => {
  const response = await request(app).get('/15b3885d-0351-4b9b-8697-86641668c123/overview');

  t.equal(response.status, 200);
  t.contains(response.text, 'name-79 - Application Overview');
});
