import {test} from 'tap';
import express from 'express';
import nock from 'nock';
import request from 'supertest';
import {Client} from '../cf';
import * as data from '../cf/client.test.data';
import spacesApp from '.';

nock('https://example.com/api')
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').times(1).reply(200, data.organization)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').times(1).reply(200, data.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').times(1).reply(200, data.users)
  .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6').times(1).reply(200, data.organizationQuota)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/summary').times(2).reply(200, data.space)
  .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').times(1).reply(200, data.spaceQuota);

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
