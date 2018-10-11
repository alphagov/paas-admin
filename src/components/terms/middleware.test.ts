import express from 'express';
import jwt from 'jsonwebtoken';
import nock from 'nock';
import request from 'supertest';

import { config } from '../app/app.test.config';
import { Token } from '../auth';

import { termsCheckerMiddleware } from '.';

const now = Math.floor(Date.now() / 1000);
const tokenKeys: ReadonlyArray<string> = ['secret'];
const app = express();

app.use(express.urlencoded({extended: true}));

app.use((req: any, _res: any, next: any) => {
  req.log = console;
  req.csrfToken = () => '';
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

describe('terms test suite', () => {
  it('should only active middleware if token present', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/');
    expect(response.text).toContain('HOME');
    expect(response.status).toEqual(200);
  });

  it('should redirect to view terms if there is a pending doc', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/user-with-pending').redirects(0);
    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual('/agreements/my-pending-doc');
  });

  it('should render a terms document with a form that references the document id', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/agreements/my-pending-doc');
    expect(response.text).toContain('<input type="hidden" name="document_name" value="my-pending-doc">');
    expect(response.text).toContain('my-pending-doc-content-1');
    expect(response.status).toEqual(200);
  });

  it('should NOT redirect if there are no pending docs', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/user-without-pending');
    expect(response.text).toEqual('HOME');
    expect(response.status).toEqual(200);
  });

  it('should handle POST /agreements', async () => {
    const agent = request.agent(app);
    const response = await agent.post('/agreements').type('form').send({
      document_name: 'my-doc',
      _csrf: '',
    });
    expect(response.status).toEqual(302);
  });

  it('should skip middleware if method not a GET request', async () => {
    const agent = request.agent(app);
    const response = await agent.post('/user-with-pending').send({_csrf: ''});
    expect(response.text).toEqual('HOME');
    expect(response.status).toEqual(200);
  });
});
