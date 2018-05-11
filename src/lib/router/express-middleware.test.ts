import express from 'express';
import request from 'supertest';
import { test } from 'tap';

import { config } from '../../app/app.test.config';
import { NotFoundError } from './errors';
import { expressMiddleware } from './express-middleware';
import Router from './router';

import { IParameters } from '.';

test('should setup application correctly with the use of router', async t => {
  const app = express();
  const router = new Router([
    {
      name: 'home',
      action: async (_c, _p, _b) => ({body: {message: 'ok'}}),
      path: '/',
    },
    {
      name: 'notModified',
      action: async (_c, _p, _b) => ({body: {message: 'ok'}, status: 304}),
      path: '/304',
    },
    {
      name: 'redirect',
      action: async (_c, _p, _b) => ({redirect: '/'}),
      path: '/redirect',
    },
    {
      name: 'serverError',
      action: async () => {
        throw new Error('TESTING 500');
      },
      path: '/500',
    },
    {
      name: 'hello',
      action: async (_c, p, _b) => ({body: {message: `Hello, ${p.name}!`}}),
      path: '/hello/:name',
    },
  ]);

  function linkTo(name: string, params: IParameters = {}) {
    return router.findByName(name).composeURL(params);
  }

  app.use(expressMiddleware(router, config));

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof NotFoundError) {
      return res.status(404).send({message: err.message});
    }

    res.status(500).send({message: err.message});
  });

  const agent = request.agent(app);

  const okResponse = await agent.get('/');
  const helloResponse = await agent.get('/hello/World');
  const notModifiedResponse = await agent.get('/304');
  const redirectResponse = await agent.get('/redirect');
  const notFoundResponse = await agent.get('/404');
  const serverErrorResponse = await agent.get('/500');

  t.equal(linkTo('hello', {name: 'World'}), '/hello/World');
  t.equal(linkTo('home'), '/');
  t.equal(okResponse.status, 200);
  t.equal(helloResponse.status, 200);
  t.contains(helloResponse.text, 'Hello, World!');
  t.equal(notModifiedResponse.status, 304);
  t.equal(redirectResponse.header.location, '/');
  t.equal(notFoundResponse.status, 404);
  t.equal(serverErrorResponse.status, 500);
});
