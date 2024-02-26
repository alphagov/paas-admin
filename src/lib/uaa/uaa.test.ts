import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

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
  const handlers = [
    http.post(`${config.apiEndpoint}/oauth/token`, () => {
      return new HttpResponse(
        '{"access_token": "FAKE_ACCESS_TOKEN"}',
      );
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());
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

    server.use(
      http.get(`${config.apiEndpoint}/failure/404`, () => {
        return new HttpResponse(
          '{"error": "FAKE_404"}',
          { status: 404 },
        );
      }),
    );

    const client = new UAAClient(config);
    await expect(client.request('get', '/failure/404')).rejects.toThrow(
      /FAKE_404/,
    );
  });

  it('should throw an error when unrecognised error', async () => {
    server.use(
      http.get(`${config.apiEndpoint}/failure/500`, () => {
        return new HttpResponse(
          '{"error": "FAKE_500"}',
          { status: 500 },
        );
      }),
    );

    const client = new UAAClient(config);
    await expect(client.request('get', '/failure/500')).rejects.toThrow(
      /status 500/,
    );
  });

  it('should find a user by email', async () => {

    server.use(
      http.get(`${config.apiEndpoint}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/imeCkO@test.org/)) {
          return new HttpResponse(
            data.usersByEmail,
          );
        }
      }),
    );

    const client = new UAAClient(config);
    const user = await client.findUser('imeCkO@test.org');
    expect(user.userName).toEqual('imeCkO@test.org');
  });

  it('should invite a user by email', async () => {
    server.use(
      http.post(`${config.apiEndpoint}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');

        if (q === 'https://example.com/' && q2 === 'client-id') {
          return new HttpResponse(
            data.invite,
          );
        }
      }),
    );

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

    server.use(
      http.post(`${config.apiEndpoint}/Users`, () => {
        return new HttpResponse(
          data.user,
          { status: 201 },
        );
      }),
    );

    const client = new UAAClient(config);
    const user = await client.createUser('user1@example.com', 'some-password');
    expect(user.id).toEqual('47ea627c-45b4-4b2b-ab76-3683068fdc89');
  });

  it('should delete a user', async () => {
    server.use(
      http.delete(`${config.apiEndpoint}/Users/47ea627c-45b4-4b2b-ab76-3683068fdc89`, () => {
        return new HttpResponse(
          data.user,
        );
      }),
    );

    const client = new UAAClient(config);
    const user = await client.deleteUser(
      '47ea627c-45b4-4b2b-ab76-3683068fdc89',
    );
    expect(user.id).toEqual('47ea627c-45b4-4b2b-ab76-3683068fdc89');
  });

  it('should retrieve signing keys', async () => {
    const client = new UAAClient(config);

    server.use(
      http.get(`${config.apiEndpoint}/token_keys`, () => {
        return HttpResponse.json({ keys: [{ value: 'secret' }] });
      }),
    );

    const tokenKeys = await client.getSigningKeys();
    expect(tokenKeys.length).toEqual(1);
    expect(tokenKeys[0]).toEqual('secret');

    const cachedKeys = await client.getSigningKeys();
    expect(cachedKeys.length).toEqual(1);
    expect(cachedKeys[0]).toEqual('secret');
  });

  it('should fail retrieve signing keys due to UAA being politely hacked...', async () => {
    const client = new UAAClient(config);

    server.use(
      http.get(`${config.apiEndpoint}/token_keys`, () => {
        return HttpResponse.json({ message: 'pwnd' }, { status: 400 });
      }),
    );

    await expect(client.getSigningKeys()).rejects.toThrow(/status 400/);
  });

  it('should retrieve particular user successfully', async () => {
    const client = new UAAClient(config);
    const id = 'uaa-id-123';

    server.use(
      http.get(`${config.apiEndpoint}/Users/${id}`, () => {
        return HttpResponse.json({ id });
      }),
    );

    const user = await client.getUser(id);

    expect(user.id).toEqual(id);
  });

  it('should return null when retrieiving a user not found', async () => {
    const client = new UAAClient(config);
    const id = 'uaa-id-123';

    server.use(
      http.get(`${config.apiEndpoint}/Users/${id}`, () => {
        return new HttpResponse(null,{ status: 404 });
      }),
    );

    const user = await client.getUser(id);
    expect(user).toEqual(null);
  });

  it('should retrieve multiple users successfully', async () => {
    const client = new UAAClient(config);

    server.use(
      http.get(`${config.apiEndpoint}/Users/user-a`, () => {
        return HttpResponse.json({ id: 'user-a' });
      }),
      http.get(`${config.apiEndpoint}/Users/user-b`, () => {
        return HttpResponse.json({ id: 'user-b' });
      }),
    );

    const users = await client.getUsers([ 'user-a', 'user-b' ]) as ReadonlyArray<IUaaUser>;

    expect(users.length).toEqual(2);
    expect(users[0].id).toEqual('user-a');
    expect(users[1].id).toEqual('user-b');
  });

  it('should retrieve multiple users gracefully if one errors', async () => {
    const client = new UAAClient(config);

    server.use(
      http.get(`${config.apiEndpoint}/Users/user-a`, () => {
        return HttpResponse.json({ id: 'user-a' });
      }),
      http.get(`${config.apiEndpoint}/Users/user-b`, () => {
        return new HttpResponse(null, { status: 400 });
      }),
    );

    const users = await client.getUsers([ 'user-a', 'user-b' ]) as ReadonlyArray<IUaaUser>;

    expect(users.length).toEqual(2);
    expect(users[0].id).toEqual('user-a');
    expect(users[1]).toEqual(null);
  });

  it('should authenticate a user', async () => {

    const accessToken = await authenticateUser(config.apiEndpoint, {
      password: 'youwouldntlikemewhenimangry',
      username: 'brucebanner',
    });
    expect(accessToken).toEqual('FAKE_ACCESS_TOKEN');
  });

  it('should set the user\'s origin', async () => {
      server.use(
        http.post(`${config.apiEndpoint}/oauth/token`, () => {
          return HttpResponse.json(
            { 'access_token': 'FAKE_ACCESS_TOKEN' },
          );
        }),
        http.get(`${config.apiEndpoint}/Users/${data.userId}`, () => {
          return new HttpResponse(data.user);
        }),
        http.put(`${config.apiEndpoint}/Users/${data.userId}`, () => {
          return new HttpResponse(data.user);
        }),
      );

    const client = new UAAClient(config);
    const updatedUser = await client.setUserOrigin(data.userId, 'google');
    expect(updatedUser.id).toEqual(data.userId);
  });

  it('should successfully call /password_resets', async () => {

    server.use(
      http.post(`${config.apiEndpoint}/password_resets`, ({ request }) => {
        const acceptHeader = request.headers.get('accept');
        if (acceptHeader !== 'application/json') {
          return HttpResponse.json({
            error: 'UAA API requires "Accept"headers to be set on the request and equal to' +
                '"application/json". Otherwise, it is going to be unhelpfull and return a 404...',
          },
          { status: 401 },
          );
        }
        return HttpResponse.json(
          { code: 'FAKE_PASSWORD_RESET_CODE' },
        );
      }),
    );

    const client = new UAAClient(config);
    // Following email is false representation... It should be `jeff@example.com`
    // however then NOCK picks up that this isn't correct JSON syntax... Wrapping
    // in quotes seems to fix the issue.
    const code = await client.obtainPasswordResetCode('"jeff@example.com"');
    expect(code).toEqual('FAKE_PASSWORD_RESET_CODE');
  });

  it('should successfully call /password_change', async () => {
    server.use(
      http.post(`${config.apiEndpoint}/password_change`, () => {
        return HttpResponse.json(
          { id: 'FAKE_USER_GUID' },
          { status: 200 },
        );
      }),
    );

    const client = new UAAClient(config);
    const user = await client.resetPassword('FAKE_PASSWORD_RESET_CODE', 'myNewPassword123!');
    expect(user.id).toEqual('FAKE_USER_GUID');
  });
});
