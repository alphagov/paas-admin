import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';

import { organizations } from '../../lib/cf/cf.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { listOrganizations } from '.';

nock('https://example.com/api').get('/v2/organizations').times(1).reply(200, organizations);

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

describe('organizations test suite', () => {
  it('should show the organisation pages', async () => {
    const response = await listOrganizations(ctx, {});

    expect(response.body).toContain('Choose an organisation');
  });
});
