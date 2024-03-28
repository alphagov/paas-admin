import cheerio from 'cheerio';
import express from 'express';
import jwt from 'jsonwebtoken';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { config } from '../app/app.test.config';
import { Token } from '../auth';

import { termsCheckerMiddleware } from '.';

const now = Math.floor(Date.now() / 1000);
const tokenKeys: ReadonlyArray<string> = ['secret'];
const app = express();

app.use(express.urlencoded({ extended: true }));

app.use((req: any, _res: any, next: any) => {
  req.log = console;
  req.csrfToken = () => '';
  const fakeUserID = req.path.slice(1);
  if (!fakeUserID) {
    next();

    return;
  }
  const accessToken = jwt.sign(
    {
      exp: now + 24 * 60 * 60,
      origin: 'uaa',
      scope: [],
      user_id: fakeUserID,
    },
    tokenKeys[0],
  );
  req.token = new Token(accessToken, tokenKeys);
  next();
});

app.use(
  termsCheckerMiddleware(config.location, {
    apiEndpoint: config.accountsAPI,
    secret: config.accountsSecret,
    logger: config.logger,
  }),
);

app.use(
  (
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.send('HOME');
  },
);

const handlers = [
  http.get(`${config.accountsAPI}/users/user-with-pending/documents`, () => {
    return new HttpResponse(
      `[{
        "name": "my-pending-doc",
        "content": "my-pending-doc-content-1",
        "valid_from": "2018-04-20T14:36:09+00:00",
        "agreement_date": null
      }]`,
    );
  }),
  http.get(`${config.accountsAPI}/users/user-without-pending/documents`, () => {
    return new HttpResponse(
      `[{
        "name": "my-signed-doc",
        "content": "my-pending-doc-content-1",
        "valid_from": "2018-04-20T14:36:09+00:00",
        "agreement_date": "2018-04-21T14:36:09+00:00"
      }]`,
    );
  }),
  http.get(`${config.accountsAPI}/documents/my-pending-doc`, () => {
    return new HttpResponse(
      `{
        "name": "my-pending-doc",
        "content": "my-pending-doc-content-1",
        "valid_from": "2018-04-20T14:36:09+00:00",
        "agreement_date": null
      }`,
    );
  }),
  http.post(`${config.accountsAPI}/agreements`, () => {
    return new HttpResponse(
      '',
      { status: 201 },
    );
  }),
];
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('terms test suite', () => {
  it('should only active middleware if token present', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/');
    expect(response.text).toContain('HOME');
    expect(response.status).toEqual(200);
    expect(spacesMissingAroundInlineElements(response.text)).toHaveLength(0);
  });

  it('should redirect to view terms if there is a pending doc', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/user-with-pending').redirects(0);
    expect(response.status).toEqual(302);
    expect(response.header.location).toEqual('/agreements/my-pending-doc');
    expect(
      spacesMissingAroundInlineElements(response.text as string),
    ).toHaveLength(0);
  });

  it('should render a terms document with a form that references the document id', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/agreements/my-pending-doc');
    const $ = cheerio.load(response.text);
    expect($('[name="document_name"]').prop('value')).toEqual('my-pending-doc');
    expect(response.text).toContain('my-pending-doc-content-1');
    expect(response.status).toEqual(200);
    expect(
      spacesMissingAroundInlineElements(response.text as string),
    ).toHaveLength(0);
  });

  it('should NOT redirect if there are no pending docs', async () => {
    const agent = request.agent(app);
    const response = await agent.get('/user-without-pending');
    expect(response.text).toEqual('HOME');
    expect(response.status).toEqual(200);
  });

  it('should handle POST /agreements', async () => {
    const agent = request.agent(app);
    const response = await agent
      .post('/agreements')
      .type('form')
      .send({
        document_name: 'my-doc',
        _csrf: '',
      });
    expect(response.status).toEqual(302);
  });

  it('should skip middleware if method not a GET request', async () => {
    const agent = request.agent(app);
    const response = await agent.post('/user-with-pending').send({ _csrf: '' });
    expect(response.text).toEqual('HOME');
    expect(response.status).toEqual(200);
  });
});
