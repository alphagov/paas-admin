import {test} from 'tap';
import express from 'express';
import nock from 'nock';
import request from 'supertest';
import {CloudFoundryClient} from '../cf';
import * as data from '../cf/cf.test.data';
import organizationsApp from '.';

nock('https://example.com/api')
  .get('/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92').times(1).reply(200, data.serviceInstance)
  .get('/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1').times(1).reply(200, data.servicePlan)
  .get('/v2/services/a00cacc0-0ca6-422e-91d3-6b22bcd33450').times(1).reply(200, data.service)
  .get('/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139').times(1).reply(200, data.space)
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

app.use(organizationsApp);

test('should show the service overview page', async t => {
  const response = await request(app).get('/0d632575-bb06-4ea5-bb19-a451a9644d92/overview');

  t.contains(response.text, 'name-1508 - Service Overview');
});
