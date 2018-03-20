import {test} from 'tap';
import express from 'express';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import request from 'supertest';
import pino from 'pino';
import pinoMiddleware from 'express-pino-logger';
import {internalServerErrorMiddleware} from '../errors';
import {CloudFoundryClient} from '../cf';
import {UAAClient} from '../uaa';
import {requireOrgRole} from '.';

const tokenKey = 'secret';
const time = Math.floor(Date.now() / 1000);

const unauthorisedUser = {
  metadata: {
    guid: 'unauthorised-user-123'
  },
  entity: {
    admin: false,
    organization_roles: ['org_user'] // eslint-disable-line camelcase
  },
  token: {user_id: 'unauthorised-user-123', scope: [], exp: (time + (24 * 60 * 60))} // eslint-disable-line camelcase
};

const managerUser = {
  metadata: {
    guid: 'manager-user-123'
  },
  entity: {
    admin: false,
    organization_roles: ['org_manager'] // eslint-disable-line camelcase
  },
  token: {user_id: 'manager-user-123', scope: [], exp: (time + (24 * 60 * 60))} // eslint-disable-line camelcase
};

const adminUser = {
  metadata: {
    admin: true,
    guid: 'admin-user-123'
  },
  entity: {
    organization_roles: [] // eslint-disable-line camelcase
  },
  token: {user_id: 'admin-user-123', scope: ['cloud_controller.admin'], exp: (time + (24 * 60 * 60))} // eslint-disable-line camelcase
};

nock('https://example.com/api').persist()
  .get('/v2/organizations/organization-000/user_roles').reply(200, {resources: []})
  .get('/v2/organizations/organization-123/user_roles').reply(200, {resources: [unauthorisedUser]})
  .get('/v2/organizations/organization-231/user_roles').reply(200, {resources: [managerUser]})
  .get('/v2/organizations/organization-321/user_roles').reply(200, {resources: [adminUser]});

const logger = pino({}, Buffer.from([]));

function OKHandler(req, res) {
  res.status(200);
  res.send('OK');
}

function setToken(user) {
  const token = jwt.sign(user.token, tokenKey);
  return (req, res, next) => {
    req.uaa = new UAAClient({apiEndpoint: 'https://example.com/uaa'});
    req.accessToken = token;
    req.rawToken = user.token;
    req.cf = new CloudFoundryClient({
      apiEndpoint: 'https://example.com/api',
      accessToken: token
    });

    next();
  };
}

test('should throw an error when used incorrectly', async t => {
  const app = express();
  app.use(pinoMiddleware(logger));
  app.use(setToken(unauthorisedUser));
  app.get('/secure', requireOrgRole('org_manager'), OKHandler);
  app.use(internalServerErrorMiddleware);

  const response = await request(app).get('/secure');

  t.equal(response.status, 500);
});

test('should present unauthorised user with 404', async t => {
  const app = express();
  app.use(pinoMiddleware(logger));
  app.use(setToken(unauthorisedUser));
  app.get('/secure/:organization', requireOrgRole('org_manager'), OKHandler);

  const response = await request(app).get('/secure/organization-123');

  t.equal(response.status, 404);
});

test('should present 404 if user not in the list at all', async t => {
  const app = express();
  app.use(pinoMiddleware(logger));
  app.use(setToken(unauthorisedUser));
  app.get('/secure/:organization', requireOrgRole('org_manager'), OKHandler);

  const response = await request(app).get('/secure/organization-000');

  t.equal(response.status, 404);
});

test('should present manager user with 200', async t => {
  const app = express();
  app.use(pinoMiddleware(logger));
  app.use(setToken(managerUser));
  app.get('/secure/:organization', requireOrgRole('org_manager'), OKHandler);

  const response = await request(app).get('/secure/organization-231');

  t.equal(response.status, 200);
});

test('should present admin user with 200 despite the lack of `org_manager` role', async t => {
  const app = express();
  app.use(pinoMiddleware(logger));
  app.use(setToken(adminUser));
  app.get('/secure/:organization', requireOrgRole('org_manager'), OKHandler);

  const response = await request(app).get('/secure/organization-321');

  t.equal(response.status, 200);
});

test('should present admin user with 200 despite the lack of `org_manager` role with admin write restriction', async t => {
  const app = express();
  app.use(pinoMiddleware(logger));
  app.use(setToken(adminUser));
  app.get('/secure/:organization', requireOrgRole('org_manager', true), OKHandler);

  const response = await request(app).get('/secure/organization-321');

  t.equal(response.status, 200);
});
