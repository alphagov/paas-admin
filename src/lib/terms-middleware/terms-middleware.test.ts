import express from 'express';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import request from 'supertest';
import { test } from 'tap';

import { config } from '../../app/app.test.config';
import { Token } from '../../auth';
import { termsCheckerMiddleware } from './terms-middleware';

const now = Math.floor(Date.now() / 1000);
const tokenKeys: ReadonlyArray<string> = ['secret'];
const app = express();

app.use(express.urlencoded({extended: true}));

app.use((req: any, _res: any, next: any) => {
  const fakeUserID = req.path.slice(1);
  if (!fakeUserID) {
    next();
    return;
  }
  const accessToken = jwt.sign({
    exp: (now + (24 * 60 * 60)),
    scope: [],
    user_id: fakeUserID,
  }, tokenKeys[0]);
  req.token = new Token(accessToken, tokenKeys);
  next();
});

app.use(termsCheckerMiddleware({
  apiEndpoint: config.accountsAPI,
  secret: config.accountsSecret,
}));

app.use((_req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.send('HOME');
});

nock(config.accountsAPI)
  .get('/users/user-with-pending/documents').reply(200, `[{
    "name": "my-pending-doc",
    "content": "my-pending-doc-content-1",
    "valid_from": "2018-04-20T14:36:09+00:00",
    "agreement_date": null
  }]`)
  .get('/users/user-without-pending/documents').reply(200, `[{
    "name": "my-signed-doc",
    "content": "my-pending-doc-content-1",
    "valid_from": "2018-04-20T14:36:09+00:00",
    "agreement_date": "2018-04-21T14:36:09+00:00"
  }]`)
  .get('/documents/my-pending-doc').reply(200, `{
    "name": "my-pending-doc",
    "content": "my-pending-doc-content-1",
    "valid_from": "2018-04-20T14:36:09+00:00",
    "agreement_date": null
  }`)
  .post('/agreements').reply(201, ``)
;

test('should only active middleware if token present', async t => {
  const agent = request.agent(app);
  const response = await agent.get('/');
  t.contains(response.text, 'HOME');
  t.equal(response.status, 200);
});

test('should redirect to view terms if there is a pending doc', async t => {
  const agent = request.agent(app);
  const response = await agent.get('/user-with-pending').redirects(0);
  t.equal(response.status, 302);
  t.equal(response.header.location, '/agreements/my-pending-doc');
});

test('should render a terms document with a form that references the document id', async t => {
  const agent = request.agent(app);
  const response = await agent.get('/agreements/my-pending-doc');
  t.contains(response.text, '<input type="hidden" name="document_name" value="my-pending-doc">');
  t.contains(response.text, 'my-pending-doc-content-1');
  t.equal(response.status, 200);
});

test('should NOT redirect if there are no pending docs', async t => {
  const agent = request.agent(app);
  const response = await agent.get('/user-without-pending');
  t.equal(response.text, 'HOME');
  t.equal(response.status, 200);
});

test('should handle POST /agreements', async t => {
  const agent = request.agent(app);
  const response = await agent.post('/agreements').type('form').send({
    document_name: 'my-doc',
  });
  t.equal(response.status, 302);
});

test('should skip middleware if method not a GET request', async t => {
  const agent = request.agent(app);
  const response = await agent.post('/user-with-pending');
  t.equal(response.text, 'HOME');
  t.equal(response.status, 200);
});
