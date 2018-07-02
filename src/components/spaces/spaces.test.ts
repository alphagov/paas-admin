import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import * as data from '../../lib/cf/cf.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import * as spaces from '.';

nock('https://example.com/api').persist()
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, data.organization)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').reply(200, data.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').reply(200, data.users)
  .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6').reply(200, data.organizationQuota)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/summary').reply(200, data.spaceSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/summary').reply(200, data.spaceSummary)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').reply(200, data.organization)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/apps').reply(200, data.apps)
  .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary').reply(200, data.appSummary)
  .get('/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/summary').reply(200, data.appSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3').reply(200, data.space)
  .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').reply(200, data.spaceQuota);

const tokenKey = 'secret';
const token = jwt.sign({
  user_id: 'uaa-user-123',
  scope: [],
  exp: 2535018460,
}, tokenKey);
const ctx: IContext = {
  app: config,
  routePartOf: () => false,
  linkTo: () => '__LINKED_TO__',
  log: pino({level: 'silent'}),
  token: new Token(token, [tokenKey]),
};

test('should show the spaces pages', async t => {
  const response = await spaces.listSpaces(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
  });

  t.contains(response.body, 'Spaces');
});

test('should show list of applications in space', async t => {
  const response = await spaces.listApplications(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    spaceGUID: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
  });

  t.contains(response.body, 'name-1382 - Overview');
});

test('should show list of services in space', async t => {
  const response = await spaces.listBackingServices(ctx, {
    organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    spaceGUID: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
  });

  t.contains(response.body, 'name-1382 - Overview');
});
