import lodash from 'lodash';
import nock from 'nock';


import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as data from '../../lib/cf/cf.test.data';
import { app as defaultApp } from '../../lib/cf/test-data/app';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { viewApplication } from '.';

describe('applications test suite', () => {
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock('https://example.com/api');

    nockCF
      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9')
      .reply(200, defaultOrg());
  });

  afterEach(() => {
    nockCF.on('response', () => {
      nockCF.done();
    });

    nock.cleanAll();
  });

  const ctx: IContext = createTestContext();
  const name = 'name-79';
  const guid = '15b3885d-0351-4b9b-8697-86641668c123';
  const spaceGUID = '7846301e-c84c-4ba9-9c6a-2dfdae948d52';
  const stackGUID = 'bb9ca94f-b456-4ebd-ab09-eb7987cce728';

  it('should show the application overview page', async () => {
    nockCF
      .get(`/v2/apps/${guid}`)
      .reply(
        200,
        lodash.merge(defaultApp(), {
          entity: { name, space_guid: spaceGUID, stack_guid: stackGUID },
          metadata: { guid },
        }),
      )

      .get(`/v2/apps/${guid}/summary`)
      .reply(200, data.appSummary)

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)

      .get(`/v2/stacks/${stackGUID}`)
      .reply(200, data.stack);

    const response = await viewApplication(ctx, {
      applicationGUID: guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID,
    });

    expect(response.body).toMatch(new RegExp(`Application ${name} Overview`));
  });

  it('should say the name of the stack being used', async () => {
    nockCF
      .get(`/v2/apps/${guid}`)
      .reply(
        200,
        lodash.merge(defaultApp(), {
          entity: { name, space_guid: spaceGUID, stack_guid: stackGUID },
          metadata: { guid },
        }),
      )

      .get(`/v2/apps/${guid}/summary`)
      .reply(200, data.appSummary)

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)

      .get(`/v2/stacks/${stackGUID}`)
      .reply(200, data.stack);

    const response = await viewApplication(ctx, {
      applicationGUID: guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID,
    });

    expect(response.body).toMatch(/Stack/);
    expect(response.body).toMatch(/cflinuxfs3/);
    expect(response.body).toMatch(/Detected Buildpack/);
    expect(response.body).not.toMatch(/Docker Image/);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should say the name of the docker image being used', async () => {
    const dockerGUID = '646f636b-6572-0d0a-8697-86641668c123';
    nockCF
      .get(`/v2/apps/${dockerGUID}`)
      .reply(
        200,
        lodash.merge(defaultApp(), {
          entity: {
            buildpack: null,
            docker_image: 'governmentpaas/is-cool',
            name,
            space_guid: spaceGUID,
            stack_guid: stackGUID,
          },
          metadata: { guid },
        }),
      )

      .get(`/v2/apps/${dockerGUID}/summary`)
      .reply(200, data.dockerAppSummary)

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)

      .get(`/v2/stacks/${stackGUID}`)
      .reply(200, data.stack);

    const response = await viewApplication(ctx, {
      applicationGUID: dockerGUID,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID,
    });

    expect(response.body).not.toMatch(/Stack/);
    expect(response.body).not.toMatch(/cflinuxfs3/);
    expect(response.body).not.toMatch(/Detected Buildpack/);
    expect(response.body).toMatch(/Docker Image/);
    expect(response.body).toMatch(/governmentpaas\/is-cool/);
  });
});
