import express from 'express';
import * as testData from '../src/lib/cf/cf.test.data';

function mockCF(app: express.Application, config: {stubApiPort: string, adminPort: string}) {
  const { stubApiPort } = config;

  const info = JSON.stringify({
    name: "",
    build: "",
    support: "https://youtu.be/ZZ5LpwO-An4",
    version: 0,
    description: "",
    authorization_endpoint: `http://0:${stubApiPort}`,
    token_endpoint: `http://0:${stubApiPort}`,
    min_cli_version: null,
    min_recommended_cli_version: null,
    app_ssh_endpoint: null,
    app_ssh_host_key_fingerprint: null,
    app_ssh_oauth_client: null,
    doppler_logging_endpoint: null,
    api_version: "2.128.0",
    osbapi_version: "2.14",
    user: "default-stub-api-user"
  });

  app.get('/v2/info'                                 , (_, res) => res.send(info));
  app.get('/v2/organizations'                        , (_, res) => res.send(testData.organizations));
  app.get('/v2/organizations/:guid'                  , (_, res) => res.send(testData.organization));
  app.get('/v2/quota_definitions'                    , (_, res) => res.send(testData.organizations));
  app.get('/v2/quota_definitions'                    , (_, res) => res.send(testData.organizations));
  app.get('/v2/quota_definitions/:guid'              , (_, res) => res.send(testData.organizationQuota));
  app.get('/v2/organizations/:guid/spaces'           , (_, res) => res.send(testData.spaces));
  app.get('/v2/spaces/:guid/apps'                    , (_, res) => res.send(testData.apps));
  app.get('/v2/apps/:guid'                           , (_, res) => res.send(testData.app));
  app.get('/v2/apps/:guid/summary'                   , (_, res) => res.send(testData.appSummary));
  app.get('/v2/spaces/:guid'                         , (_, res) => res.send(testData.space));
  app.get('/v2/spaces/:guid/summary'                 , (_, res) => res.send(testData.spaceSummary));
  app.get('/v2/space_quota_definitions/:guid'        , (_, res) => res.send(testData.spaceQuota));
  app.get('/v2/spaces/:guid/service_instances'       , (_, res) => res.send(testData.services));
  app.get('/v2/service_instances/:guid'              , (_, res) => res.send(testData.serviceInstance));
  app.get('/v2/service_plans/:guid'                  , (_, res) => res.send(testData.servicePlan));
  app.get('/v2/services/:guid'                       , (_, res) => res.send(testData.service));
  app.get('/v2/user_provided_service_instances'      , (_, res) => res.send(testData.userServices));
  app.get('/v2/user_provided_service_instances/:guid', (_, res) => res.send(testData.userServiceInstance));
  app.get('/v2/users/uaa-id-253/spaces'              , (_, res) => res.send(testData.spaces));
  app.get('/v2/organizations/:guid/user_roles'       , (_, res) => res.send(testData.userRolesForOrg));
  app.get('/v2/spaces/:guid/user_roles'              , (_, res) => res.send(testData.userRolesForSpace));
  app.get('/v2/stacks'                               , (_, res) => res.send(testData.stacks));
  app.get('/v2/stacks/:guid'                         , (_, res) => res.send(testData.stack));
};

export default mockCF;
