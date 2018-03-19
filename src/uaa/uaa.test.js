import {test} from 'tap';
import nock from 'nock';
import UAAClient, {authenticate} from './uaa';
import * as data from './uaa.test.data';

const config = {
  apiEndpoint: 'https://example.com/uaa',
  clientCredentials: {
    clientID: 'client',
    clientSecret: 'secret'
  }
};

nock('https://example.com/uaa').persist()
  .get('/Users?filter=email+eq+%22imeCkO@test.org%22').times(1).reply(200, data.usersByEmail)
  .post('/invite_users?redirect_uri=https://example.com/&client_id=client-id').times(1).reply(200, data.invite)
  .post('/oauth/token?grant_type=client_credentials').times(1).reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
  .get('/failure/404').times(1).reply(404, `{"error": "FAKE_404"}`)
  .get('/failure/500').times(1).reply(500, `FAKE_500`);

test('authenticate function requires clientID and clientSecret', async t => {
  await t.rejects(authenticate('https://example.com/uaa', {clientSecret: 'secret'}), /clientID is required/);
  await t.rejects(authenticate('https://example.com/uaa', {clientID: 'my-id'}), /clientSecret is required/);
});

test('UAAClient requires clientCredentials', async t => {
  const client = new UAAClient({apiEndpoint: 'https://example.com/uaa', clientCredentials: {clientID: 'my-id'}});
  return t.rejects(client.getAccessToken(), /clientSecret is required/);
});

test('UAAClient requires clientCredentials', async t => {
  const client = new UAAClient({apiEndpoint: 'https://example.com/uaa'});
  return t.rejects(client.getAccessToken(), /unable to get access token/);
});

test('should throw an error when receiving 404', async t => {
  const client = new UAAClient(config);
  return t.rejects(client.request('get', '/failure/404'), 'FAKE_404');
});

test('should throw an error when unrecognised error', async t => {
  const client = new UAAClient(config);
  return t.rejects(client.request('get', '/failure/500'), 'FAKE_500');
});

test('should find a user by email', async t => {
  const client = new UAAClient(config);
  const user = await client.findUser('imeCkO@test.org');
  t.equal(user.userName, 'imeCkO@test.org');
});

test('should invite a user by email', async t => {
  const client = new UAAClient(config);
  const invitation = await client.inviteUser('user1@71xl2o.com', 'client-id', 'https://example.com/');
  t.equal(invitation.userId, '5ff19d4c-8fa0-4d74-94e0-52eac86d55a8');
});
