import express from 'express';
import lodash from 'lodash';

import * as testData from '../src/lib/cf/cf.test.data';
import { app as defaultApp } from '../src/lib/cf/test-data/app';
import { auditEvent as defaultAuditEvent } from '../src/lib/cf/test-data/audit-event';
import { org as defaultOrg, v3Org as defaultV3Org } from '../src/lib/cf/test-data/org';
import { wrapResources, wrapV3Resources } from '../src/lib/cf/test-data/wrap-resources';

import { IStubServerPorts } from './index';

function mockCF(app: express.Application, config: IStubServerPorts): express.Application {
  const { apiPort } = config;

  const info = JSON.stringify({
    name: '',
    build: '',
    support: 'https://youtu.be/ZZ5LpwO-An4',
    version: 0,
    description: '',
    authorization_endpoint: `http://0:${apiPort}`,
    token_endpoint: `http://0:${apiPort}`,
    min_cli_version: null,
    min_recommended_cli_version: null,
    app_ssh_endpoint: null,
    app_ssh_host_key_fingerprint: null,
    app_ssh_oauth_client: null,
    doppler_logging_endpoint: null,
    api_version: '2.128.0',
    osbapi_version: '2.14',
    user: 'default-stub-api-user',
  });

  app.get('/v2/info', (_, res) => res.send(info));

  app.get('/v2/organizations/suspended-guid', (_, res) => res.send(
    JSON.stringify(
      lodash.merge(defaultOrg(), { metadata: { guid: 'suspended-guid' }, entity: { name: 'a-suspended-org', status: 'suspended' }})
    )
  ));
  app.get('/v2/organizations/:guid', (_, res) => res.send(JSON.stringify(defaultOrg())));
  app.get('/v2/organizations/:guid/spaces', (_, res) => res.send(testData.spaces));

  app.get('/v2/organizations', (_, res) => res.send(JSON.stringify(
    wrapResources(
      lodash.merge(defaultOrg(), { entity: { name: 'an-org' } }),
      lodash.merge(defaultOrg(), { metadata: { guid: 'suspended-guid' }, entity: { name: 'a-suspended-org', status: 'suspended' }})
    ),
  )));
  app.get('/v3/organizations', (_, res) => res.send(JSON.stringify(
    wrapV3Resources(
      lodash.merge(defaultV3Org(), { name: 'an-org' }),
      lodash.merge(defaultV3Org(), { name: 'a-different-org', guid: 'a-different-org' }),
    ),
  )));

  app.get('/v2/quota_definitions'                    , (_, res) => res.send(testData.organizationQuotas));
  app.get('/v2/quota_definitions'                    , (_, res) => res.send(testData.organizationQuota));
  app.get('/v2/quota_definitions/:guid'              , (_, res) => res.send(testData.organizationQuota));

  app.get('/v2/spaces/:guid/apps', (_, res) => res.send(JSON.stringify(wrapResources(defaultApp()))));
  app.get('/v2/apps/:guid',        (_, res) => res.send(JSON.stringify(defaultApp())));

  app.get('/v2/apps/:guid/summary'                   , (_, res) => res.send(testData.appSummary));
  app.get('/v2/spaces/:guid'                         , (_, res) => res.send(testData.space));
  app.get('/v2/spaces/:guid/summary'                 , (_, res) => res.send(testData.spaceSummary));
  app.get('/v2/space_quota_definitions/:guid'        , (_, res) => res.send(testData.spaceQuota));
  app.get('/v2/spaces/:guid/service_instances'       , (_, res) => res.send(testData.services));
  app.get('/v2/service_instances/:guid'              , (_, res) => res.send(testData.serviceInstance));
  app.get('/v2/service_plans/:guid'                  , (_, res) => res.send(testData.servicePlan));
  app.get('/v2/services/:guid'                       , (_, res) => res.send(testData.serviceString));
  app.get('/v2/user_provided_service_instances'      , (_, res) => res.send(testData.userServices));
  app.get('/v2/user_provided_service_instances/:guid', (_, res) => res.send(testData.userServiceInstance));
  app.get('/v2/users/uaa-id-253/spaces'              , (_, res) => res.send(testData.spaces));
  app.get('/v2/users/uaa-id-253/summary'             , (_, res) => res.send(testData.userSummary));
  app.get('/v2/organizations/:guid/user_roles'       , (_, res) => res.send(testData.userRolesForOrg));
  app.get('/v2/spaces/:guid/user_roles'              , (_, res) => res.send(testData.userRolesForSpace));
  app.get('/v2/stacks'                               , (_, res) => res.send(testData.stacks));
  app.get('/v2/stacks/:guid'                         , (_, res) => res.send(testData.stack));

  app.get('/v3/audit_events/:guid' , (_, res) => res.send(JSON.stringify(defaultAuditEvent())));
  app.get('/v3/audit_events'       , (req, res) => {
    const page = parseInt(req.param('page', '1'), 10);

    const predefinedResources = [
      [lodash.merge(defaultAuditEvent(), { type: 'first-page' }), defaultAuditEvent()],
      [lodash.merge(defaultAuditEvent(), { type: 'middle-page' }), defaultAuditEvent()],
      [lodash.merge(defaultAuditEvent(), { type: 'last-page' }), defaultAuditEvent()],
    ];

    res.send(JSON.stringify({
      pagination: {
        total_pages: predefinedResources.length,
        total_results: lodash.flatten(predefinedResources).length,
        next: page === 3 ? undefined : { href: `/v3/audit_events?page=${page + 1}` },
      },
      resources: (1 <= page && page <= 3) ? predefinedResources[page - 1] : [],
    }));
  });

  return app;
}

export default mockCF;
