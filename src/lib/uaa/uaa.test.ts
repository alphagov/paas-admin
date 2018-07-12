import nock from 'nock';

import UAAClient from './uaa';
import * as data from './uaa.test.data';

const config = {
  apiEndpoint: 'https://example.com/uaa',
  clientCredentials: {
    clientID: 'client',
    clientSecret: 'secret',
  },
};

nock('https://example.com/uaa').persist()
  .get('/Users?filter=email+eq+%22imeCkO@test.org%22').times(1).reply(200, data.usersByEmail)
  .post('/invite_users?redirect_uri=https://example.com/&client_id=client-id').times(1).reply(200, data.invite)
  .post('/oauth/token?grant_type=client_credentials').times(1).reply(200, `{"access_token": "FAKE_ACCESS_TOKEN"}`)
  .get('/failure/404').times(1).reply(404, `{"error": "FAKE_404"}`)
  .get('/failure/500').times(1).reply(500, `FAKE_500`);

describe('lib/uaa test suite', () => {
  // IMPORTANT: The following tests are useless in TypeScript :(

  // it('authenticate function requires clientID and clientSecret', async () => {
  //   await t.rejects(authenticate('https://example.com/uaa', {clientSecret: 'secret'}), /clientID is required/);
  //   await t.rejects(authenticate('https://example.com/uaa', {clientID: 'my-id'}), /clientSecret is required/);
  // });

  // it('UAAClient requires clientCredentials', async () => {
  //   const client = new UAAClient({apiEndpoint: 'https://example.com/uaa', clientCredentials: {clientID: 'my-id'}});
  //   return t.rejects(client.getAccessToken(), /clientSecret is required/);
  // });

  // it('UAAClient requires clientCredentials', async () => {
  //   const client = new UAAClient({apiEndpoint: 'https://example.com/uaa'});
  //   return t.rejects(client.getAccessToken(), /unable to get access token/);
  // });

  it('should throw an error when receiving 404', async () => {
    const client = new UAAClient(config);
    await expect(client.request('get', '/failure/404')).rejects.toThrow(/FAKE_404/);
  });

  it('should throw an error when unrecognised error', async () => {
    const client = new UAAClient(config);
    await expect(client.request('get', '/failure/500')).rejects.toThrow(/status 500/);
  });

  it('should find a user by email', async () => {
    const client = new UAAClient(config);
    const user = await client.findUser('imeCkO@test.org');
    expect(user.userName).toEqual('imeCkO@test.org');
  });

  it('should invite a user by email', async () => {
    const client = new UAAClient(config);
    const invitation = await client.inviteUser('user1@71xl2o.com', 'client-id', 'https://example.com/');
    expect(invitation.userId).toEqual('5ff19d4c-8fa0-4d74-94e0-52eac86d55a8');
  });

  it('should retrieve signing keys', async () => {
    const client = new UAAClient(config);

    nock(config.apiEndpoint)
      .get('/token_keys').times(1).reply(200, {keys: [{value: 'secret'}]});

    const tokenKeys = await client.getSigningKeys();
    expect(tokenKeys.length).toEqual(1);
    expect(tokenKeys[0]).toEqual('secret');

    const cachedKeys = await client.getSigningKeys();
    expect(cachedKeys.length).toEqual(1);
    expect(cachedKeys[0]).toEqual('secret');
  });

  it('should fail retrieve signing keys due to UAA being politely hacked...', async () => {
    const client = new UAAClient(config);

    await nock(config.apiEndpoint)
      .get('/token_keys').times(1).reply(400, {message: 'pwnd'});

    await expect(client.getSigningKeys()).rejects.toThrow(/status 400/);
  });

  it('should retrieve particular user successfully', async () => {
    const client = new UAAClient(config);
    const id = 'uaa-id-123';

    await nock(config.apiEndpoint)
      .get(`/Users/${id}`).times(1).reply(200, {id});

    const user = await client.getUser(id);

    expect(user.id).toEqual(id);
  });
});
