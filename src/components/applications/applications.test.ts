import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';

import * as data from '../../lib/cf/cf.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { viewApplication } from '.';

describe('applications test suite', () => {
  nock('https://example.com/api').persist()
    .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9/user_roles').times(1).reply(200, data.userRolesForOrg)
    .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123').times(1).reply(200, data.app)
    .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/summary').times(1).reply(200, data.appSummary)
    .get('/v2/apps/646f636b-6572-0d0a-8697-86641668c123').times(1).reply(200, data.dockerApp)
    .get('/v2/apps/646f636b-6572-0d0a-8697-86641668c123/summary').times(1).reply(200, data.dockerAppSummary)
    .get('/v2/apps/ebbcb962-8e5d-444d-a8fb-6f3b31fe99c7').times(1).reply(200, data.appUsingCflinuxfs2)
    .get('/v2/apps/ebbcb962-8e5d-444d-a8fb-6f3b31fe99c7/summary').times(1).reply(200, data.appSummaryUsingCflinuxfs2)
    .get('/v2/spaces/7846301e-c84c-4ba9-9c6a-2dfdae948d52').times(1).reply(200, data.space)
    .get('/v2/spaces/1053174d-eb79-4f16-bf82-9f83a52d6e84').times(1).reply(200, data.space)
    .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, data.organization)
    .get('/v2/stacks/bb9ca94f-b456-4ebd-ab09-eb7987cce728').times(1).reply(200, data.stack)
    .get('/v2/stacks/dd63d39a-85f8-48ef-bb73-89097192cfcb').times(1).reply(200, data.stackCflinuxfs2);

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

  it('should show the application overview page', async () => {
    const response = await viewApplication(ctx, {
      applicationGUID: '15b3885d-0351-4b9b-8697-86641668c123',
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '7846301e-c84c-4ba9-9c6a-2dfdae948d52',
    });

    expect(response.body).toMatch(/name-79 - Application Overview/);
  });

  it('should say the name of the stack being used', async () => {
    const response = await viewApplication(ctx, {
      applicationGUID: '15b3885d-0351-4b9b-8697-86641668c123',
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '7846301e-c84c-4ba9-9c6a-2dfdae948d52',
    });

    expect(response.body).toMatch(/Stack/);
    expect(response.body).toMatch(/cflinuxfs3/);
    expect(response.body).not.toMatch(/Docker Image/);
    expect(response.body).not.toMatch(/This application needs upgrading or it may go offline/);
  });

  it('should say the name of the docker image being used', async () => {
    const response = await viewApplication(ctx, {
      applicationGUID: '646f636b-6572-0d0a-8697-86641668c123',
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '7846301e-c84c-4ba9-9c6a-2dfdae948d52',
    });

    expect(response.body).not.toMatch(/Stack/);
    expect(response.body).not.toMatch(/cflinuxfs3/);
    expect(response.body).toMatch(/Docker Image/);
    expect(response.body).toMatch(/governmentpaas\/is-cool/);
  });

  it('should say a warning if the cflinuxfs2 stack is being used', async () => {
    const response = await viewApplication(ctx, {
      applicationGUID: 'ebbcb962-8e5d-444d-a8fb-6f3b31fe99c7',
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '7846301e-c84c-4ba9-9c6a-2dfdae948d52',
    });

    expect(response.body).toMatch(/Stack/);
    expect(response.body).toMatch(/cflinuxfs2/);
    expect(response.body).toMatch(/This application needs upgrading or it may go offline/);
  });
});
