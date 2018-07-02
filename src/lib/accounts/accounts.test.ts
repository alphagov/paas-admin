import moment from 'moment';
import nock from 'nock';
import { test } from 'tap';

import { config } from '../../components/app/app.test.config';

import { AccountsClient } from '.';

const cfg = {
  apiEndpoint: config.accountsAPI,
  secret: config.accountsSecret,
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
;

test('should fetch a document', async t => {
  const ac = new AccountsClient(cfg);
  const doc = await ac.getDocument('my-doc');
  t.equal(doc.name, 'my-doc');
  t.equal(doc.validFrom.toString(), moment('2018-04-20T14:36:09+00:00').toDate().toString());
  t.equal(doc.content, 'my-doc-content');
});

test('should fail to fetch a document with invalid timestamp', async t => {
  const ac = new AccountsClient(cfg);
  return t.rejects(ac.getDocument('bad-timestamp-doc'), /invalid date format/);
});

test('should pass though json errors from response if available', async t => {
  const ac = new AccountsClient(cfg);
  return t.rejects(ac.getDocument('json-500'), /internal-server-error-json/);
});

test('should pass though json errors from response if available', async t => {
  const ac = new AccountsClient(cfg);
  return t.rejects(ac.getDocument('plain-500'), /failed with status 500/);
});

test('should update a document', async t => {
  const ac = new AccountsClient(cfg);
  const ok = await ac.putDocument('my-doc', 'my-new-doc-content');
  t.ok(ok);
});

test('should fetch pending documents for a user', async t => {
  const ac = new AccountsClient(cfg);
  const docs = await ac.getPendingDocumentsForUserUUID('7fab36d8-a63a-4543-9a24-d7a3fe2f128b');
  t.equal(docs.length, 1);
  t.equal(docs[0].name, 'my-doc-1');
  t.equal(docs[0].validFrom.toString(), moment('2018-04-20T14:36:09+00:00').toDate().toString());
  t.equal(docs[0].content, 'my-pending-doc-content-1');
});

test('should create an agreement', async t => {
  const ac = new AccountsClient(cfg);
  const ok = await ac.createAgreement('my-doc', '7fab36d8-a63a-4543-9a24-d7a3fe2f128b');
  t.ok(ok);
});
