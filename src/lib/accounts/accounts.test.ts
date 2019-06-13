import moment from 'moment';
import nock from 'nock';
import pino from 'pino';

import { config } from '../../components/app/app.test.config';

import { AccountsClient } from '.';

const cfg = {
  apiEndpoint: config.accountsAPI,
  secret: config.accountsSecret,
  logger: pino({level: 'silent'}),
};

nock(cfg.apiEndpoint)
  .get('/documents/my-doc').reply(200, `{
    "name": "my-doc",
    "valid_from": "2018-04-20T14:36:09+00:00",
    "content": "my-doc-content"
  }`)
  .get('/documents/bad-timestamp-doc').reply(200, `{
    "name": "my-doc",
    "valid_from": "this-is-a-silly-date",
    "content": "my-doc-content"
  }`)
  .get('/documents/json-500').reply(500, `{
    "error": "internal-server-error-json"
  }`)
  .get('/documents/plain-500').reply(500, `
    error: internal-server-error-plain
  `)
  .put('/documents/my-doc').reply(201, ``)
  .get('/users/4f11eb3b-f45c-4fd3-9241-533d29a0582b').reply(404)
  .get('/users/1d2a9ece-3d06-4aa7-bffc-c521cf7ef6cb').reply(500)
  .get('/users/7fab36d8-a63a-4543-9a24-d7a3fe2f128b').reply(200, `{
    "user_uuid": "7fab36d8-a63a-4543-9a24-d7a3fe2f128b",
    "username": "example@example.org",
    "user_email": "example@example.org"
  }`)
  .get('/users/7fab36d8-a63a-4543-9a24-d7a3fe2f128b/documents').reply(200, `[{
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
  }]`)
  .post('/agreements').reply(201, ``)
  .post('/users/').reply(201, ``)
;

describe('lib/accounts test suite', () => {
  it('should fetch a document', async () => {
    const ac = new AccountsClient(cfg);
    const doc = await ac.getDocument('my-doc');
    expect(doc.name).toEqual('my-doc');
    expect(doc.validFrom.toString()).toEqual(moment('2018-04-20T14:36:09+00:00').toDate().toString());
    expect(doc.content).toEqual('my-doc-content');
  });

  it('should fail to fetch a document with invalid timestamp', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getDocument('bad-timestamp-doc')).rejects.toThrow(/invalid date format/);
  });

  it('should pass though json errors from response if available', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getDocument('json-500')).rejects.toThrow(/internal-server-error-json/);
  });

  it('should pass though json errors from response if available', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getDocument('plain-500')).rejects.toThrow(/failed with status 500/);
  });

  it('should update a document', async () => {
    const ac = new AccountsClient(cfg);
    const ok = await ac.putDocument('my-doc', 'my-new-doc-content');
    expect(ok).toBeTruthy();
  });

  it('should fetch pending documents for a user', async () => {
    const ac = new AccountsClient(cfg);
    const docs = await ac.getPendingDocumentsForUserUUID('7fab36d8-a63a-4543-9a24-d7a3fe2f128b');
    expect(docs.length).toEqual(1);
    expect(docs[0].name).toEqual('my-doc-1');
    expect(docs[0].validFrom.toString()).toEqual(moment('2018-04-20T14:36:09+00:00').toDate().toString());
    expect(docs[0].content).toEqual('my-pending-doc-content-1');
  });

  it('should create an agreement', async () => {
    const ac = new AccountsClient(cfg);
    const ok = await ac.createAgreement('my-doc', '7fab36d8-a63a-4543-9a24-d7a3fe2f128b');
    expect(ok).toBeTruthy();
  });

  it('should return null when a user cannot be found', async () => {
    const ac = new AccountsClient(cfg);
    const user = await ac.getUser('4f11eb3b-f45c-4fd3-9241-533d29a0582b');
    expect(user).toBeNull();
  });

  it('should pass along any errors from a non-404', async () => {
    const ac = new AccountsClient(cfg);
    await expect(ac.getUser('1d2a9ece-3d06-4aa7-bffc-c521cf7ef6cb')).rejects.toThrowError();
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
    const ok = await ac.createUser('4f11eb3b-f45c-4fd3-9241-533d29a0582b', 'user_name', 'e@ma.il');
    expect(ok).toBeTruthy();
  });

});
