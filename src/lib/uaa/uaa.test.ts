import nock, { RequestBodyMatcher } from 'nock';

import UAAClient, { authenticateUser } from './uaa';
import * as data from './uaa.test.data';
import { IUaaUser } from './uaa.types';

const config = {
  apiEndpoint: 'https://example.com/uaa',
  clientCredentials: {
    clientID: 'client',
    clientSecret: 'secret',
  },
};

describe('lib/uaa test suite', () => {
  let nockUAA: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockUAA = nock(config.apiEndpoint);
  });

  afterEach(() => {
    nockUAA.done();

    nock.cleanAll();
  });

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
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/failure/404')
      .reply(404, '{"error": "FAKE_404"}');

    const client = new UAAClient(config);
    await expect(client.request('get', '/failure/404')).rejects.toThrow(
      /FAKE_404/,
    );
  });

  it('should throw an error when unrecognised error', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/failure/500')
      .reply(500, 'FAKE_500');

    const client = new UAAClient(config);
    await expect(client.request('get', '/failure/500')).rejects.toThrow(
      /status 500/,
    );
  });

  it('should find a user by email', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/Users?filter=email+eq+%22imeCkO@test.org%22')
      .reply(200, data.usersByEmail);

    const client = new UAAClient(config);
    const user = await client.findUser('imeCkO@test.org');
    expect(user.userName).toEqual('imeCkO@test.org');
  });

  it('should invite a user by email', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .post(
        '/invite_users?redirect_uri=https://example.com/&client_id=client-id',
      )
      .reply(200, data.invite);

    const client = new UAAClient(config);
    const invitation = await client.inviteUser(
      'user1@71xl2o.com',
      'client-id',
      'https://example.com/',
    );
    expect(invitation.userId).toEqual('5ff19d4c-8fa0-4d74-94e0-52eac86d55a8');
    expect(invitation.inviteLink).toEqual(
      'https://login.system_domain/invitations/accept?code=TWQlsE3gU2',
    );
  });

  it('should create a user', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .post('/Users')
      .reply(201, data.user);

    const client = new UAAClient(config);
    const user = await client.createUser('user1@example.com', 'some-password');
    expect(user.id).toEqual('47ea627c-45b4-4b2b-ab76-3683068fdc89');
  });

  it('should delete a user', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .delete('/Users/47ea627c-45b4-4b2b-ab76-3683068fdc89')
      .reply(200, data.user);

    const client = new UAAClient(config);
    const user = await client.deleteUser(
      '47ea627c-45b4-4b2b-ab76-3683068fdc89',
    );
    expect(user.id).toEqual('47ea627c-45b4-4b2b-ab76-3683068fdc89');
  });

  it('should retrieve signing keys', async () => {
    const client = new UAAClient(config);

    nockUAA.get('/token_keys').reply(200, { keys: [{ value: 'secret' }] });

    const tokenKeys = await client.getSigningKeys();
    expect(tokenKeys.length).toEqual(1);
    expect(tokenKeys[0]).toEqual('secret');

    const cachedKeys = await client.getSigningKeys();
    expect(cachedKeys.length).toEqual(1);
    expect(cachedKeys[0]).toEqual('secret');
  });

  it('should fail retrieve signing keys due to UAA being politely hacked...', async () => {
    const client = new UAAClient(config);

    nockUAA.get('/token_keys').reply(400, { message: 'pwnd' });

    await expect(client.getSigningKeys()).rejects.toThrow(/status 400/);
  });

  it('should retrieve particular user successfully', async () => {
    const client = new UAAClient(config);
    const id = 'uaa-id-123';

    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get(`/Users/${id}`)
      .reply(200, { id });

    const user = await client.getUser(id);

    expect(user.id).toEqual(id);
  });

  it('should retrieve multiple users successfully', async () => {
    const client = new UAAClient(config);

    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .times(2)
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get('/Users/user-a')
      .reply(200, { id: 'user-a' })

      .get('/Users/user-b')
      .reply(200, { id: 'user-b' });

    const users = await client.getUsers([ 'user-a', 'user-b' ]) as ReadonlyArray<IUaaUser>;

    expect(users.length).toEqual(2);
    expect(users[0].id).toEqual('user-a');
    expect(users[1].id).toEqual('user-b');
  });

  it('should authenticate a user', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'password')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}');

    const accessToken = await authenticateUser(config.apiEndpoint, {
      password: 'youwouldntlikemewhenimangry',
      username: 'brucebanner',
    });
    expect(accessToken).toEqual('FAKE_ACCESS_TOKEN');
  });

  it('should set the user\'s origin', async () => {
    const isCorrectPatchBody: RequestBodyMatcher = body =>
      body.origin === 'google';

    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, '{"access_token": "FAKE_ACCESS_TOKEN"}')

      .get(`/Users/${data.userId}`)
      .reply(200, data.user)
      .put(`/Users/${data.userId}`, isCorrectPatchBody)
      .reply(200, data.user);

    const client = new UAAClient(config);
    const updatedUser = await client.setUserOrigin(data.userId, 'google');
    expect(updatedUser.id).toEqual(data.userId);
  });

  it('should successfully call /password_resets', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, { access_token: 'FAKE_ACCESS_TOKEN' })

      .post('/password_resets')
      .reply(function(_uri, _requestBody) {
        const acceptHeader = this.req.headers['accept'];
        const contentTypeHeader = this.req.headers['content-type'];

        if (acceptHeader !== 'application/json' || contentTypeHeader !== 'application/json') {
          return [
            404,
            {
              error: 'UAA API requires both "Accept" and "Content-Type" headers to be set on the request and equal to' +
                '"application/json". Otherwise, it is going to be unhelpfull and return a 404...',
            },
          ];
        }

        return [ 201, { code: 'FAKE_PASSWORD_RESET_CODE' } ];
      });

    const client = new UAAClient(config);
    // Following email is false representation... It should be `jeff@example.com`
    // however then NOCK picks up that this isn't correct JSON syntax... Wrapping
    // in quotes seems to fix the issue.
    const code = await client.obtainPasswordResetCode('"jeff@example.com"');
    expect(code).toEqual('FAKE_PASSWORD_RESET_CODE');
  });

  it('should successfully call /password_change', async () => {
    nockUAA
      .post('/oauth/token')
      .query((x: any) => x.grant_type === 'client_credentials')
      .reply(200, { access_token: 'FAKE_ACCESS_TOKEN' })

      .post('/password_change')
      .reply(200, { id: 'FAKE_USER_GUID' });

    const client = new UAAClient(config);
    const user = await client.resetPassword('FAKE_PASSWORD_RESET_CODE', 'myNewPassword123!');
    expect(user.id).toEqual('FAKE_USER_GUID');
  });
});
