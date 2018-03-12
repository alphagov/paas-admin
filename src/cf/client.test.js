import {test} from 'tap';
import nock from 'nock';
import Client from './client';
import * as data from './client.test.data';

let client;

test('should create a client correctly', async t => {
  client = new Client('https://example.com/api', 'qwerty123456');

  nock('https://example.com/api').persist()
    .get('/v2/info').times(1).reply(200, data.info)
    .get('/v2/organizations').times(1).reply(200, data.organizations)
    .get('/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20').times(1).reply(200, data.organization)
    .get('/v2/quota_definitions/80f3e539-a8c0-4c43-9c72-649df53da8cb').times(1).reply(200, data.organizationQuota)
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').times(1).reply(200, data.spaces)
    .get('/v2/spaces/be1f9c1d-e629-488e-a560-a35b545f0ad7/apps').times(1).reply(200, data.apps)
    .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary').times(1).reply(200, data.appSummary)
    .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3').times(1).reply(200, data.space)
    .get('/v2/spaces/50ae42f6-346d-4eca-9e97-f8c9e04d5fbe/summary').times(1).reply(200, data.spaceSummary)
    .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').times(1).reply(200, data.spaceQuota)
    .get('/v2/spaces/f858c6b3-f6b1-4ae8-81dd-8e8747657fbe/service_instances').times(1).reply(200, data.services)
    .get('/v2/users/uaa-id-253/spaces?q=organization_guid:3deb9f04-b449-4f94-b3dd-c73cefe5b275').times(1).reply(200, data.spaces)
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').times(1).reply(200, data.users)
    .get('/v2/failure').times(1).reply(404, {description: 'TEST'})
    .get('/v2/failure/500').times(1).reply(500, {})
    .get('/v2/test').times(1).reply(200, `{"next_url":"/v2/test?page=2","resources":["a"]}`)
    .get('/v2/test?page=2').times(1).reply(200, `{"next_url":null,"resources":["b"]}`);

  const info = await client.info();

  t.equal(info.version, 2);
});

test('should iterate over all pages to gather resources', async t => {
  const response = await client.request('get', '/v2/test');
  const data = await client.allResources(response);

  t.equal([...data].length, 2);
  t.equal(data[1], 'b');
});

test('should throw an error when receiving 404', async t => {
  try {
    await client.request('get', '/v2/failure');
  } catch (err) {
    t.contains(err.message, 'TEST');
  }
});

test('should throw an error when unrecognised error', async t => {
  try {
    await client.request('get', '/v2/failure/500');
  } catch (err) {
    t.equal(err.message, 'Request failed with status code 500');
  }
});

test('should obtain list of organisations', async t => {
  const organizations = await client.organizations();

  t.ok(organizations.length > 0);
  t.equal(organizations[0].entity.name, 'the-system_domain-org-name');
});

test('should obtain single organisation', async t => {
  const organization = await client.organization('a7aff246-5f5b-4cf8-87d8-f316053e4a20');

  t.equal(organization.entity.name, 'the-system_domain-org-name');
});

test('should obtain organisation quota', async t => {
  const quota = await client.organizationQuota('80f3e539-a8c0-4c43-9c72-649df53da8cb');

  t.equal(quota.entity.name, 'name-1996');
});

test('should obtain list of spaces', async t => {
  const spaces = await client.spaces('3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(spaces.length > 0);
  t.equal(spaces[0].entity.name, 'name-1774');
});

test('should obtain single space', async t => {
  const space = await client.space('bc8d3381-390d-4bd7-8c71-25309900a2e3');

  t.equal(space.entity.name, 'name-2064');
});

test('should obtain single space', async t => {
  const space = await client.spaceSummary('50ae42f6-346d-4eca-9e97-f8c9e04d5fbe');

  t.equal(space.name, 'name-1382');
});

test('should obtain space quota', async t => {
  const quota = await client.spaceQuota('a9097bc8-c6cf-4a8f-bc47-623fa22e8019');

  t.equal(quota.entity.name, 'name-1491');
});

test('should obtain list of spaces for specific user in given org', async t => {
  const spaces = await client.spacesForUserInOrganization('uaa-id-253', '3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(spaces.length > 0);
  t.equal(spaces[0].entity.name, 'name-1774');
});

test('should obtain list of apps', async t => {
  const apps = await client.applications('be1f9c1d-e629-488e-a560-a35b545f0ad7');

  t.ok(apps.length > 0);
  t.equal(apps[0].entity.name, 'name-2131');
});

test('should obtain app summary', async t => {
  const app = await client.applicationSummary('cd897c8c-3171-456d-b5d7-3c87feeabbd1');

  t.equal(app.name, 'name-79');
});

test('should obtain list of services', async t => {
  const services = await client.services('f858c6b3-f6b1-4ae8-81dd-8e8747657fbe');

  t.ok(services.length > 0);
  t.equal(services[0].entity.name, 'name-2104');
});

test('should obtain list of users', async t => {
  const users = await client.usersInOrganization('3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(users.length > 0);
  t.equal(users[0].entity.username, 'user@example.com');
});
