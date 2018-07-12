import jwt from 'jsonwebtoken';
import moment from 'moment';
import nock from 'nock';
import pino from 'pino';

import * as data from '../../lib/cf/cf.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import * as statement from '.';

// tslint:disable:max-line-length
nock(config.cloudFoundryAPI)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').times(1).reply(200, data.userRolesForOrg)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').times(1).reply(200, data.organization)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').times(1).reply(200, data.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').times(1).reply(200, data.users)
  .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6').times(1).reply(200, data.organizationQuota)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/summary').times(2).reply(200, data.spaceSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/summary').times(2).reply(200, data.spaceSummary)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, data.organization)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/apps').times(1).reply(200, data.apps)
  .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary').times(1).reply(200, data.appSummary)
  .get('/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/summary').times(1).reply(200, data.appSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3').times(1).reply(200, data.space)
  .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').times(1).reply(200, data.spaceQuota);

nock(config.billingAPI)
  .get('/billable_events?range_start=2018-01-01&range_stop=2018-02-01&org_guid=a7aff246-5f5b-4cf8-87d8-f316053e4a20').reply(200, `[]`);
// tslint:enable:max-line-length

const tokenKey = 'secret';
const token = jwt.sign({
  user_id: 'uaa-id-253',
  scope: [],
  exp: 2535018460,
}, tokenKey);
const ctx: IContext = {
  app: config,
  routePartOf: () => false,
  linkTo: (name, params) => `${name}/${params ? params.rangeStart : ''}`,
  log: pino({level: 'silent'}),
  token: new Token(token, [tokenKey]),
};

describe('statements test suite', () => {
  it('should require a valid rangeStart param', async () => {
    await expect(statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: 'not-a-date',
      })).rejects.toThrow(/invalid rangeStart provided/);
  });

  it('should show the statement page', async () => {
    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    expect(response.body).toContain('Statement');
  });

  it('should throw an error due to selecting middle of the month', async () => {
    await expect(statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: '2018-01-15',
      })).rejects.toThrow(/expected rangeStart to be the first of the month/);
  });

  it('should redirect to correct statement', async () => {
    const response = await statement.statementRedirection(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    expect(response.redirect).toContain('/2018-01-01');
  });

  it('should redirect to current statement', async () => {
    const response = await statement.statementRedirection(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });
    const currentMonth = moment().startOf('month').format('YYYY-MM-DD');

    expect(response.redirect).toContain(`/${currentMonth}`);
  });
});
