import {test} from 'tap';
import nock from 'nock';
import CloudFoundryClient from './cf';
import * as data from './cf.test.data';

const config = {
  apiEndpoint: 'https://example.com/api',
  accessToken: 'qwerty123456'
};

nock('https://example.com/api').persist()
  .get('/v2/info').reply(200, data.info)
  .get('/v2/organizations').reply(200, data.organizations)
  .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20').reply(200, data.organization)
  .get('/v2/quota_definitions/80f3e539-a8c0-4c43-9c72-649df53da8cb').reply(200, data.organizationQuota)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').reply(200, data.spaces)
  .get('/v2/spaces/be1f9c1d-e629-488e-a560-a35b545f0ad7/apps').reply(200, data.apps)
  .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123').times(1).reply(200, data.app)
  .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary').times(1).reply(200, data.appSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3').reply(200, data.space)
  .get('/v2/spaces/50ae42f6-346d-4eca-9e97-f8c9e04d5fbe/summary').reply(200, data.spaceSummary)
  .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').reply(200, data.spaceQuota)
  .get('/v2/spaces/f858c6b3-f6b1-4ae8-81dd-8e8747657fbe/service_instances').reply(200, data.services)
  .get('/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92').times(1).reply(200, data.serviceInstance)
  .get('/v2/service_plans/775d0046-7505-40a4-bfad-ca472485e332').times(1).reply(200, data.servicePlan)
  .get('/v2/services/53f52780-e93c-4af7-a96c-6958311c40e5').times(1).reply(200, data.service)
  .get('/v2/users/uaa-id-253/spaces?q=organization_guid:3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, data.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').reply(200, data.users)
  .post('/v2/users').reply(200, data.user)
  .put('/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/users/uaa-id-236').reply(201, data.userRoles)
  .delete('/v2/organizations/beb082da-25e1-4329-88c9-bea2d809729d/users/uaa-id-236').reply(204, {})
  .put('/v2/spaces/594c1fa9-caed-454b-9ed8-643a093ff91d/developer/uaa-id-381').reply(201, data.userRoles)
  .delete('/v2/spaces/594c1fa9-caed-454b-9ed8-643a093ff91d/developer/uaa-id-381').reply(204, {})
  .get('/v2/failure/404').reply(404, `{"error": "FAKE_404"}`)
  .get('/v2/failure/500').reply(500, `FAKE_500`)
  .get('/v2/test').reply(200, `{"next_url":"/v2/test?page=2","resources":["a"]}`)
  .get('/v2/test?page=2').reply(200, `{"next_url":null,"resources":["b"]}`)
  .put('/v2/organizations/guid-cb24b36d-4656-468e-a50d-b53113ac6177/users').reply(201, {metadata: {guid: 'guid-cb24b36d-4656-468e-a50d-b53113ac6177'}})
;

nock('https://example.com/uaa').persist()
  .post('/oauth/token?grant_type=client_credentials').reply(200, `{"access_token": "TOKEN_FROM_ENDPOINT"}`)
;

test('should fail to get token client without accessToken or clientCredentials', async t => {
  const client = new CloudFoundryClient({apiEndpoint: 'https://example.com/api'});
  return t.rejects(client.getAccessToken(), /accessToken or clientCredentials are required/);
});

test('should fail if missing apiEndpoint', async t => {
  t.throws(() => new CloudFoundryClient({}), /apiEndpoint is required/);
});

test('should get token from tokenEndpoint in info', async t => {
  const client = new CloudFoundryClient({apiEndpoint: 'https://example.com/api', clientCredentials: {clientID: 'my-id', clientSecret: 'my-secret'}});
  const token = await client.getAccessToken();
  t.equal(token, 'TOKEN_FROM_ENDPOINT');
  const cachedToken = await client.getAccessToken();
  t.equal(cachedToken, 'TOKEN_FROM_ENDPOINT');
  client.accessToken = null;
  const cachedEndpointToken = await client.getAccessToken();
  t.equal(cachedEndpointToken, 'TOKEN_FROM_ENDPOINT');
});

test('should create a client correctly', async t => {
  const client = new CloudFoundryClient(config);
  const info = await client.info();
  t.equal(info.version, 2);
});

test('should iterate over all pages to gather resources', async t => {
  const client = new CloudFoundryClient(config);
  const response = await client.request('get', '/v2/test');
  const data = await client.allResources(response);

  t.equal([...data].length, 2);
  t.equal(data[1], 'b');
});

test('should throw an error when receiving 404', async t => {
  const client = new CloudFoundryClient(config);
  return t.rejects(client.request('get', '/v2/failure/404'), 'FAKE_404');
});

test('should throw an error when unrecognised error', async t => {
  const client = new CloudFoundryClient(config);
  return t.rejects(client.request('get', '/v2/failure/500'), 'FAKE_500');
});

test('should obtain list of organisations', async t => {
  const client = new CloudFoundryClient(config);
  const organizations = await client.organizations();

  t.ok(organizations.length > 0);
  t.equal(organizations[0].entity.name, 'the-system_domain-org-name');
});

test('should obtain single organisation', async t => {
  const client = new CloudFoundryClient(config);
  const organization = await client.organization('a7aff246-5f5b-4cf8-87d8-f316053e4a20');

  t.equal(organization.entity.name, 'the-system_domain-org-name');
});

test('should obtain organisation quota', async t => {
  const client = new CloudFoundryClient(config);
  const quota = await client.organizationQuota('80f3e539-a8c0-4c43-9c72-649df53da8cb');

  t.equal(quota.entity.name, 'name-1996');
});

test('should obtain list of spaces', async t => {
  const client = new CloudFoundryClient(config);
  const spaces = await client.spaces('3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(spaces.length > 0);
  t.equal(spaces[0].entity.name, 'name-1774');
});

test('should obtain single space', async t => {
  const client = new CloudFoundryClient(config);
  const space = await client.space('bc8d3381-390d-4bd7-8c71-25309900a2e3');

  t.equal(space.entity.name, 'name-2064');
});

test('should obtain single space', async t => {
  const client = new CloudFoundryClient(config);
  const space = await client.spaceSummary('50ae42f6-346d-4eca-9e97-f8c9e04d5fbe');

  t.equal(space.name, 'name-1382');
});

test('should obtain space quota', async t => {
  const client = new CloudFoundryClient(config);
  const quota = await client.spaceQuota('a9097bc8-c6cf-4a8f-bc47-623fa22e8019');

  t.equal(quota.entity.name, 'name-1491');
});

test('should obtain list of spaces for specific user in given org', async t => {
  const client = new CloudFoundryClient(config);
  const spaces = await client.spacesForUserInOrganization('uaa-id-253', '3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(spaces.length > 0);
  t.equal(spaces[0].entity.name, 'name-1774');
});

test('should obtain list of apps', async t => {
  const client = new CloudFoundryClient(config);
  const apps = await client.applications('be1f9c1d-e629-488e-a560-a35b545f0ad7');

  t.ok(apps.length > 0);
  t.equal(apps[0].entity.name, 'name-2131');
});

test('should obtain particular app', async t => {
  const client = new CloudFoundryClient(config);
  const app = await client.application('15b3885d-0351-4b9b-8697-86641668c123');

  t.equal(app.entity.name, 'name-2401');
});

test('should obtain app summary', async t => {
  const client = new CloudFoundryClient(config);
  const app = await client.applicationSummary('cd897c8c-3171-456d-b5d7-3c87feeabbd1');

  t.equal(app.name, 'name-79');
});

test('should obtain app summary', async t => {
  const client = new CloudFoundryClient(config);
  const app = await client.applicationSummary('cd897c8c-3171-456d-b5d7-3c87feeabbd1');

  t.equal(app.name, 'name-79');
});

test('should obtain list of services', async t => {
  const client = new CloudFoundryClient(config);
  const services = await client.services('f858c6b3-f6b1-4ae8-81dd-8e8747657fbe');

  t.ok(services.length > 0);
  t.equal(services[0].entity.name, 'name-2104');
});

test('should obtain particular service instance', async t => {
  const client = new CloudFoundryClient(config);
  const serviceInstance = await client.serviceInstance('0d632575-bb06-4ea5-bb19-a451a9644d92');

  t.equal(serviceInstance.entity.name, 'name-1508');
});

test('should obtain particular service plan', async t => {
  const client = new CloudFoundryClient(config);
  const servicePlan = await client.servicePlan('775d0046-7505-40a4-bfad-ca472485e332');

  t.equal(servicePlan.entity.name, 'name-1573');
});

test('should obtain particular service', async t => {
  const client = new CloudFoundryClient(config);
  const service = await client.service('53f52780-e93c-4af7-a96c-6958311c40e5');

  t.equal(service.entity.label, 'label-58');
});

test('should obtain list of user roles', async t => {
  const client = new CloudFoundryClient(config);
  const users = await client.usersForOrganization('3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(users.length > 0);
  t.equal(users[0].entity.username, 'user@example.com');
});

test('should be able to create new user by username', async t => {
  const client = new CloudFoundryClient(config);
  const organization = await client.assignUserToOrganizationByUsername('guid-cb24b36d-4656-468e-a50d-b53113ac6177', 'user@example.com');

  t.equal(organization.metadata.guid, 'guid-cb24b36d-4656-468e-a50d-b53113ac6177');
});

test('should be able to set user org roles', async t => {
  const client = new CloudFoundryClient(config);
  const users = await client.setOrganizationRole('beb082da-25e1-4329-88c9-bea2d809729d', `uaa-id-236`, 'users', true);

  t.equal(users.entity.name, 'name-1753');
});

test('should be able to remove user org roles', async t => {
  const client = new CloudFoundryClient(config);
  const roles = await client.setOrganizationRole('beb082da-25e1-4329-88c9-bea2d809729d', `uaa-id-236`, 'users', false);

  t.equal(Object.keys(roles).length, 0);
});

test('should be able to set user space roles', async t => {
  const client = new CloudFoundryClient(config);
  const users = await client.setSpaceRole('594c1fa9-caed-454b-9ed8-643a093ff91d', 'uaa-id-381', 'developer', true);

  t.equal(users.entity.name, 'name-1753');
});

test('should be able to remove user space roles', async t => {
  const client = new CloudFoundryClient(config);
  const users = await client.setSpaceRole('594c1fa9-caed-454b-9ed8-643a093ff91d', 'uaa-id-381', 'developer', false);

  t.equal(Object.keys(users).length, 0);
});

