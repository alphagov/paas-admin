import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';

import * as data from '../../lib/cf/cf.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { viewService } from '.';

// tslint:disable:max-line-length
nock('https://example.com/api')
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9/user_roles').times(5).reply(200, data.userRolesForOrg)
  .get('/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92').times(1).reply(200, data.serviceInstance)
  .get('/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1').times(1).reply(200, data.servicePlan)
  .get('/v2/services/a00cacc0-0ca6-422e-91d3-6b22bcd33450').times(1).reply(200, data.service)
  .get('/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139').times(2).reply(200, data.space)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(2).reply(200, data.organization)
  .get('/v2/user_provided_service_instances?q=space_guid:38511660-89d9-4a6e-a889-c32c7e94f139').times(2).reply(200, data.userServices)
  .get('/v2/user_provided_service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee').times(1).reply(200, data.userServiceInstance);
// tslint:enable:max-line-length

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
  csrf: '',
};

describe('services test suite', () => {
  it('should show the service overview page', async () => {
    const response = await viewService(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain('name-1508 - Service Overview');
  });

  it('should show the user provided service overview page', async () => {
    const response = await viewService(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain('name-1700 - Service Overview');
  });
});
