import express from 'express';
import request from 'supertest';

import Router, {
  IParameters,
  NotAuthorisedError,
  NotFoundError,
} from '../../lib/router';

import { config } from './app.test.config';
import { routerMiddleware } from './router-middleware';

describe('app test suite - router-middleware', () => {
  it('should setup application correctly with the use of router', async () => {
    const app = express();
    const router = new Router([
      {
        action: async (_c, _p, _b) => await Promise.resolve({ body: { message: 'ok' } }),
        name: 'home',
        path: '/',
      },
      {
        action: async (_c, _p, _b) => await Promise.resolve({
          body: { message: 'ok' },
          status: 304,
        }),
        name: 'notModified',
        path: '/304',
      },
      {
        action: async (_c, _p, _b) => await Promise.resolve({ redirect: '/' }),
        name: 'redirect',
        path: '/redirect',
      },
      {
        action: async () => {
          throw new Error('TESTING 500');
          await Promise.resolve('BAD');
        },
        name: 'serverError',
        path: '/500',
      },
      {
        action: async () => {
          throw new NotAuthorisedError('DENIED 403');
          await Promise.resolve('BAD');
        },
        name: 'notAuthorisedError',
        path: '/403',
      },
      {
        action: async (_c, p, _b) => await Promise.resolve({
          body: { message: `Hello, ${p.name}!` },
        }),
        name: 'hello',
        path: '/hello/:name',
      },
      {
        action: async (_c, _p, _b) => await Promise.resolve({
          download: { data: 'text', name: 'download.txt' },
        }),
        name: 'download',
        path: '/download',
      },
      {
        action: async (_c, _p, _b) => await Promise.resolve({ mimeType: 'image/png' }),
        name: 'png-mimetype',
        path: '/image',
      },
      {
        action: async (_c, _p, _b) => await Promise.resolve({ mimeType: 'text/csv' }),
        name: 'csv-mimetype',
        path: '/csv',
      },
    ]);

    function linkTo(name: string, params: IParameters = {}) {
      return router.findByName(name).composeURL(params);
    }

    app.use(
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        req.csrfToken = () => '';
        next();
      },
    );

    app.use(routerMiddleware(router, config));

    app.use(
      (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        if (err instanceof NotFoundError) {
          return res.status(404).send({ message: err.message });
        }
        if (err instanceof NotAuthorisedError) {
          return res.status(403).send({ message: err.message });
        }

        res.status(500).send({ message: err.message });
      },
    );

    const agent = request.agent(app);

    const okResponse = await agent.get('/');
    const helloResponse = await agent.get('/hello/World');
    const notModifiedResponse = await agent.get('/304');
    const redirectResponse = await agent.get('/redirect');
    const notAuthorisedResponse = await agent.get('/403');
    const notFoundResponse = await agent.get('/404');
    const serverErrorResponse = await agent.get('/500');
    const downloadResponse = await agent.get('/download');
    const imgResponse = await agent.get('/image');
    const csvResponse = await agent.get('/csv');

    expect(linkTo('hello', { name: 'World' })).toEqual('/hello/World');
    expect(linkTo('home')).toEqual('/');
    expect(okResponse.status).toEqual(200);
    expect(helloResponse.status).toEqual(200);
    expect(helloResponse.text).toContain('Hello, World!');
    expect(notModifiedResponse.status).toEqual(304);
    expect(redirectResponse.header.location).toEqual('/');
    expect(notAuthorisedResponse.status).toEqual(403);
    expect(notFoundResponse.status).toEqual(404);
    expect(serverErrorResponse.status).toEqual(500);
    expect(downloadResponse.header['content-disposition']).toEqual(
      'attachment; filename="download.txt"',
    );
    expect(imgResponse.header['content-type']).toEqual('image/png');
    expect(csvResponse.header['content-type']).toEqual(
      'text/csv; charset=utf-8',
    );
  });
});
