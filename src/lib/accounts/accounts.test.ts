import nock from 'nock';
import pino from 'pino';

import { config } from '../../components/app/app.test.config';

import { AccountsClient } from '.';

describe('lib/accounts test suite', () => {
  const cfg = {
    apiEndpoint: config.accountsAPI,
    secret: config.accountsSecret,
    logger: pino({ level: 'silent' }),
  };

  afterAll(() => {
    nock.cleanAll();
  });

  beforeAll(() => {
    nock(cfg.apiEndpoint)
      .get('/documents/my-doc')
      .reply(
        200,
        `{
    "name": "my-doc",
    "valid_from": "2018-04-20T14:36:09+00:00",
    "content": "my-doc-content"
  }`,
      )
      .get('/documents/bad-timestamp-doc')
      .reply(
        200,
        `{
    "name": "my-doc",
    "valid_from": "this-is-a-silly-date",
    "content": "my-doc-content"
  }`,
      )
      .get('/documents/json-500')
      .reply(
        500,
        `{
    "error": "internal-server-error-json"
  }`,
      )
      .get('/documents/plain-500')
      .reply(
        500,
        `
    error: internal-server-error-plain
  `,
      )
      .put('/documents/my-doc')
      .reply(201, '')
      .get('/users/4f11eb3b-f45c-4fd3-9241-533d29a0582b')
      .reply(404)
      .get('/users/1d2a9ece-3d06-4aa7-bffc-c521cf7ef6cb')
      .reply(500)
      .get('/users/7fab36d8-a63a-4543-9a24-d7a3fe2f128b')
      .reply(
        200,
        `{
    "user_uuid": "7fab36d8-a63a-4543-9a24-d7a3fe2f128b",
    "username": "example@example.org",
    "user_email": "example@example.org"
  }`,
      )
      .get('/users/error')
      .reply(500)
      .get('/users/7fab36d8-a63a-4543-9a24-d7a3fe2f128b/documents')
      .reply(
        200,
        `[{
    "name": "my-doc-1",
    "content": "my-pending-doc-content-1",
    "valid_from": "2018-04-20T14:36:09+00:00",
    "agreement_date": null
  },{
    "name": "my-doc-2",
    "content": "my-superceeded-doc-content-2",
    "valid_from": "2001-01-01T15:31:25.934376Z",
    "agreement_date": null
  },{
    "name": "my-doc-2",
    "content": "my-pending-doc-content-2",
    "valid_from": "2018-01-01T16:37:09.362128Z",
    "agreement_date": "2018-05-21T16:52:55.624084Z"
  }]`,
      )
      .post('/agreements')
      .reply(201, '')
      .post('/users/')
      .reply(201, '')
      .get('/users?email=one@user.in.database')
      .reply(
        200,
        `{
    "users": [{
      "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "one@user.in.database",
      "username": "one@user.in.database"
    }]
  }`,
      )
      .get('/users?email=url%2bencoded@user.in.database')
      .reply(
        200,
        `{
    "users": [{
      "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "url+encoded@user.in.database",
      "username": "url+encoded@user.in.database"
    }]
  }`,
      )
      .get('/users?email=no@user.in.database')
      .reply(
        200,
        `{
    "users": []
  }`,
      )
      .get('/users?email=many@user.in.database')
      .reply(
        200,
        `{
    "users": [{
      "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "many@user.in.database",
      "username": "many@user.in.database"
    },{
      "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "many@user.in.database",
      "username": "many@user.in.database"
    }]
  }`,
      )
      .get('/users?uuids=aaaaaaaa-404b-cccc-dddd-eeeeeeeeeeee')
      .reply(
        200,
        `{
    "users": []
  }`,
      )
      .get('/users?uuids=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
      .reply(
        200,
        `{
    "users": [{
      "user_uuid": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "one@user.in.database",
      "username": "one@user.in.database"
    }]
  }`,
      )
      .get(
        '/users?uuids=11111111-bbbb-cccc-dddd-eeeeeeeeeeee,22222222-bbbb-cccc-dddd-eeeeeeeeeeee',
      )
      .reply(
        200,
        `{
    "users": [{
      "user_uuid": "11111111-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "one@user.in.database",
      "username": "one@user.in.database"
    },{
      "user_uuid": "22222222-bbbb-cccc-dddd-eeeeeeeeeeee",
      "user_email": "two@user.in.database",
      "username": "two@user.in.database"
    }]
  }`,
      );
  });

  it('should fetch a document', async () => {
    const ac = new AccountsClient(cfg);
    const doc = await ac.getDocument('my-doc');
    expect(doc.name).toEqual('my-doc');
    expect(doc.validFrom.toString()).toEqual(
      (new Date('2018-04-20T14:36:09+00:00'))
        .toString(),
    );
    expect(doc.content).toEqual('my-doc-content');
  });

  it('should fail to fetch a document with invalid timestamp', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getDocument('bad-timestamp-doc')).rejects.toThrow(
      /invalid date format/,
    );
  });

  it('should pass though json errors from response if available', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getDocument('json-500')).rejects.toThrow(
      /internal-server-error-json/,
    );
  });

  it('should pass though json errors from response if available', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getDocument('plain-500')).rejects.toThrow(
      /failed with status 500/,
    );
  });

  it('should update a document', async () => {
    const ac = new AccountsClient(cfg);
    const ok = await ac.putDocument('my-doc', 'my-new-doc-content');
    expect(ok).toBeTruthy();
  });

  it('should fetch pending documents for a user', async () => {
    const ac = new AccountsClient(cfg);
    const docs = await ac.getPendingDocumentsForUserUUID(
      '7fab36d8-a63a-4543-9a24-d7a3fe2f128b',
    );
    expect(docs.length).toEqual(1);
    expect(docs[0].name).toEqual('my-doc-1');
    expect(docs[0].validFrom.toString()).toEqual(
      (new Date('2018-04-20T14:36:09+00:00'))
        .toString(),
    );
    expect(docs[0].content).toEqual('my-pending-doc-content-1');
  });

  it('should create an agreement', async () => {
    const ac = new AccountsClient(cfg);
    const ok = await ac.createAgreement(
      'my-doc',
      '7fab36d8-a63a-4543-9a24-d7a3fe2f128b',
    );
    expect(ok).toBeTruthy();
  });

  it('should return undefined when a user cannot be found', async () => {
    const ac = new AccountsClient(cfg);
    const user = await ac.getUser('4f11eb3b-f45c-4fd3-9241-533d29a0582b');
    expect(user).toBeUndefined();
  });

  it('should pass along any errors from a non-404', async () => {
    const ac = new AccountsClient(cfg);
    await expect(
      ac.getUser('1d2a9ece-3d06-4aa7-bffc-c521cf7ef6cb'),
    ).rejects.toThrowError();
  });

  it('should get a user', async () => {
    const ac = new AccountsClient(cfg);
    const user = await ac.getUser('7fab36d8-a63a-4543-9a24-d7a3fe2f128b');
    expect(user).toBeTruthy();

    if (user) {
      expect(user.uuid).toEqual('7fab36d8-a63a-4543-9a24-d7a3fe2f128b');
    }
  });

  it('should create a user', async () => {
    const ac = new AccountsClient(cfg);
    const ok = await ac.createUser(
      '4f11eb3b-f45c-4fd3-9241-533d29a0582b',
      'user_name',
      'e@ma.il',
    );
    expect(ok).toBeTruthy();
  });

  it('should reject the promise when the response is not a 2xx, 3xx or 404', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getUser('error')).rejects.toEqual(
      expect.objectContaining({
        code: 500,
      }),
    );
  });

  it('should get a user by email', async () => {
    const ac = new AccountsClient(cfg);
    const user = await ac.getUserByEmail('one@user.in.database');
    expect(user).not.toBeUndefined();
    expect(user!.email).toEqual('one@user.in.database');
    expect(user!.username).toEqual('one@user.in.database');
  });

  it('should get a user by email when the email includes a plus', async () => {
    // the mock only expects a URL encoded email address
    const ac = new AccountsClient(cfg);
    const user = await ac.getUserByEmail('url+encoded@user.in.database');
    expect(user).not.toBeUndefined();
    expect(user!.email).toEqual('url+encoded@user.in.database');
    expect(user!.username).toEqual('url+encoded@user.in.database');
  });

  it('should return undefined for a user which does not exist', async () => {
    const ac = new AccountsClient(cfg);
    const user = await ac.getUserByEmail('no@user.in.database');
    expect(user).toBeUndefined();
  });

  it('should throw an error when multiple users are returned by the API', async () => {
    const ac = new AccountsClient(cfg);
    try {
      await ac.getUserByEmail('many@user.in.database');
    } catch (e) {
      expect(e).toEqual(
        new Error(
          'getUserByEmail received more than one result from Accounts API',
        ),
      );
    }
  });

  it('should respond with an empty list when listing non-existing users by guid', async () => {
    const ac = new AccountsClient(cfg);
    const users = await ac.getUsers(['aaaaaaaa-404b-cccc-dddd-eeeeeeeeeeee']);
    expect(users.length).toEqual(0);
  });

  it('should respond with a list of one when listing a single user by guid', async () => {
    const ac = new AccountsClient(cfg);
    const users = await ac.getUsers(['aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee']);
    expect(users.length).toEqual(1);
    expect(users[0].email).toEqual('one@user.in.database');
    expect(users[0].username).toEqual('one@user.in.database');
  });

  it('should respond with a list of two when listing multiple users by guid', async () => {
    const ac = new AccountsClient(cfg);
    const users = await ac.getUsers([
      '11111111-bbbb-cccc-dddd-eeeeeeeeeeee',
      '22222222-bbbb-cccc-dddd-eeeeeeeeeeee',
    ]);
    expect(users.length).toEqual(2);
    expect(users[0].email).toEqual('one@user.in.database');
    expect(users[0].username).toEqual('one@user.in.database');
    expect(users[1].email).toEqual('two@user.in.database');
    expect(users[1].username).toEqual('two@user.in.database');
  });
});

describe('lib/accounts logging suite', () => {
  let mockLogger: any;
  let cfg: any;

  const obviousAccountsSecret = 'very-sensitive-password';

  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    cfg = {
      apiEndpoint: config.accountsAPI,
      secret: obviousAccountsSecret,
      logger: mockLogger,
    };
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('error logging', () => {
    beforeEach(() => {
      nock(cfg.apiEndpoint)
        .get('/documents/json-500')
        .reply(500, JSON.stringify({ error: 'internal-server-error-json' }))
      ;
    });

    it('should not put anything sensitive in responseError', async () => {
      const ac = new AccountsClient(cfg);
      expect.assertions(3);

      try {
        await ac.getDocument('json-500');
        expect(false).toBeTruthy();
      } catch (e) {
        // try/catch to check multiple assertions against the thrown Error
        expect(e.request.auth).toBe(undefined);
        expect(e.response).toEqual({ status: 500 });
        expect(JSON.stringify(e)).not.toMatch(new RegExp(obviousAccountsSecret));
      }
    });
  });
});
