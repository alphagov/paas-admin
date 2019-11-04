import express from 'express';
import request from 'supertest';

import Router, { IParameters, NotFoundError } from '../../lib/router';

import { config } from './app.test.config';
import { routerMiddleware } from './router-middleware';

describe('app test suite - router-middleware', () => {
  it('should setup application correctly with the use of router', async () => {
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
      {
        name: 'download',
        action: async (_c, _p, _b) => ({download: {data: `text`, name: 'download.txt'}}),
        path: '/download',
      },
    ]);

    function linkTo(name: string, params: IParameters = {}) {
      return router.findByName(name).composeURL(params);
    }

    app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
      req.csrfToken = () => '';
      next();
    });

    app.use(routerMiddleware(router, config));

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
    const downloadResponse = await agent.get('/download');

    expect(linkTo('hello', {name: 'World'})).toEqual('/hello/World');
    expect(linkTo('home')).toEqual('/');
    expect(okResponse.status).toEqual(200);
    expect(helloResponse.status).toEqual(200);
    expect(helloResponse.text).toContain('Hello, World!');
    expect(notModifiedResponse.status).toEqual(304);
    expect(redirectResponse.header.location).toEqual('/');
    expect(notFoundResponse.status).toEqual(404);
    expect(serverErrorResponse.status).toEqual(500);
    expect(downloadResponse.header['content-disposition']).toEqual(`attachment; filename="download.txt"`);
  });
});
