import {test} from 'tap';
import nock from 'nock';
import Client from './client';
import * as data from './client.test.data';

let client;

test('should create a client correctly', async t => {
  client = new Client('https://example.com/api', 'qwerty123456');

  nock('https://example.com/api').persist()
    .get('/v2/info').times(1).reply(200, data.info)
    .get('/v2/organizations').times(1).reply(200, data.orgs)
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').times(1).reply(200, data.spaces)
    .get('/v2/spaces/be1f9c1d-e629-488e-a560-a35b545f0ad7/apps').times(1).reply(200, data.apps)
    .get('/v2/spaces/f858c6b3-f6b1-4ae8-81dd-8e8747657fbe/service_instances').times(1).reply(200, data.services)
    .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/users').times(1).reply(200, data.users)
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

test('should obtain list of organizations', async t => {
  const orgs = await client.organizations();

  t.ok(orgs.length > 0);
  t.equal(orgs[0].entity.name, 'the-system_domain-org-name');
});

test('should obtain list of spaces', async t => {
  const spaces = await client.spaces('3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(spaces.length > 0);
  t.equal(spaces[0].entity.name, 'name-1774');
});

test('should obtain list of apps', async t => {
  const apps = await client.applications('be1f9c1d-e629-488e-a560-a35b545f0ad7');

  t.ok(apps.length > 0);
  t.equal(apps[0].entity.name, 'name-2131');
});

test('should obtain list of services', async t => {
  const services = await client.services('f858c6b3-f6b1-4ae8-81dd-8e8747657fbe');

  t.ok(services.length > 0);
  t.equal(services[0].entity.name, 'name-2104');
});

test('should obtain list of users', async t => {
  const users = await client.users('3deb9f04-b449-4f94-b3dd-c73cefe5b275');

  t.ok(users.length > 0);
  t.equal(users[0].entity.username, 'user@example.com');
});
