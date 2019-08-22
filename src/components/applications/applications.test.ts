import nock from 'nock';

import {viewApplication} from '.';

import * as data from '../../lib/cf/cf.test.data';
import {anApp} from '../../lib/cf/test-data/app';
import {anOrg} from '../../lib/cf/test-data/org';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

describe('applications test suite', () => {

  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock('https://example.com/api');

    nockCF
      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9/user_roles')
      .times(2)
      .reply(200, data.userRolesForOrg)

      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9')
      .reply(200, anOrg().with({}))
    ;
  });

  afterEach(() => {
    nockCF.done();

    nock.cleanAll();
  });

  const ctx: IContext = createTestContext();
  const name = 'name-79';
  const guid = '15b3885d-0351-4b9b-8697-86641668c123';
  const spaceGuid = '7846301e-c84c-4ba9-9c6a-2dfdae948d52';
  const stackGuid = 'bb9ca94f-b456-4ebd-ab09-eb7987cce728';

  it('should show the application overview page', async () => {
    nockCF
      .get(`/v2/apps/${guid}`)
      .reply(200, anApp().withName(name).withGuid(guid).inSpace(spaceGuid).withStack(stackGuid).build())

      .get(`/v2/apps/${guid}/summary`)
      .reply(200, data.appSummary)

      .get(`/v2/spaces/${spaceGuid}`)
      .reply(200, data.space)

      .get(`/v2/stacks/${stackGuid}`)
      .reply(200, data.stack)
    ;

    const response = await viewApplication(ctx, {
      applicationGUID: guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: spaceGuid,
    });

    expect(response.body).toMatch(new RegExp(`${name} - Application Overview`));
  });

  it('should say the name of the stack being used', async () => {
    nockCF
      .get(`/v2/apps/${guid}`)
      .reply(200, anApp().withName(name).withGuid(guid).inSpace(spaceGuid).withStack(stackGuid).build())

      .get(`/v2/apps/${guid}/summary`)
      .reply(200, data.appSummary)

      .get(`/v2/spaces/${spaceGuid}`)
      .reply(200, data.space)

      .get(`/v2/stacks/${stackGuid}`)
      .reply(200, data.stack)
    ;

    const response = await viewApplication(ctx, {
      applicationGUID: guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: spaceGuid,
    });

    expect(response.body).toMatch(/Stack/);
    expect(response.body).toMatch(/cflinuxfs3/);
    expect(response.body).toMatch(/Detected Buildpack/);
    expect(response.body).not.toMatch(/Docker Image/);
    expect(response.body).not.toMatch(/This application needs upgrading or it may go offline/);
  });

  it('should say the name of the docker image being used', async () => {
    const dockerGuid = '646f636b-6572-0d0a-8697-86641668c123';
    nockCF
      .get(`/v2/apps/${dockerGuid}`)
      .reply(200, anApp()
                    .withName(name)
                    .withGuid(dockerGuid)
                    .withStack(stackGuid)
                    .usingDocker()
                    .build())

      .get(`/v2/apps/${dockerGuid}/summary`)
      .reply(200, data.dockerAppSummary)

      .get(`/v2/spaces/${spaceGuid}`)
      .reply(200, data.space)

      .get(`/v2/stacks/${stackGuid}`)
      .reply(200, data.stack)
    ;

    const response = await viewApplication(ctx, {
      applicationGUID: dockerGuid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: spaceGuid,
    });

    expect(response.body).not.toMatch(/Stack/);
    expect(response.body).not.toMatch(/cflinuxfs3/);
    expect(response.body).not.toMatch(/Detected Buildpack/);
    expect(response.body).toMatch(/Docker Image/);
    expect(response.body).toMatch(/governmentpaas\/is-cool/);
  });

  it('should say a warning if the cflinuxfs2 stack is being used', async () => {
    const cflinuxfs2Guid = 'ebbcb962-8e5d-444d-a8fb-6f3b31fe99c7';
    const cflinuxfs2StackGuid = 'dd63d39a-85f8-48ef-bb73-89097192cfcb';
    nockCF
      .get(`/v2/apps/${cflinuxfs2Guid}`)
      .reply(200, anApp()
                    .withName(name)
                    .withGuid(cflinuxfs2Guid)
                    .inSpace(spaceGuid)
                    .withStack(cflinuxfs2StackGuid)
                    .build())

      .get(`/v2/apps/${cflinuxfs2Guid}/summary`)
      .reply(200, data.appSummaryUsingCflinuxfs2)

      .get(`/v2/spaces/${spaceGuid}`)
      .reply(200, data.space)

      .get(`/v2/stacks/${cflinuxfs2StackGuid}`)
      .reply(200, data.stackCflinuxfs2)
    ;

    const response = await viewApplication(ctx, {
      applicationGUID: cflinuxfs2Guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: spaceGuid,
    });

    expect(response.body).toMatch(/Stack/);
    expect(response.body).toMatch(/cflinuxfs2/);
    expect(response.body).toMatch(/This application needs upgrading or it may go offline/);
  });
});
