import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import pino from 'pino';
import request from 'supertest';

import Router, { NotFoundError } from '../../lib/router';

import { internalServerErrorMiddleware, pageNotFoundMiddleware } from '.';

const logger = pino({level: 'silent'});
const app = express();

app.use(pinoMiddleware({logger}));

// It is IMPORTANT to remember this is set... Once the default URLs change in layout,
// these lines should be updated.
app.use((req: any, _res, next) => {
  req.router = new Router([
    {
      action: async () => ({body: 'OK'}),
      name: 'admin.organizations',
      path: '/',
    },
  ]);

  next();
});

describe('errors test suite', () => {
  it('should display an internal-server-error 500 error page for errors', async () => {
    app.use('/bang', (_req, _res, _next) => {
      throw new Error('bang');
    });
    app.use(internalServerErrorMiddleware);
    const response = await request(app).get('/bang');

    expect(response.status).toEqual(500);
    expect(response.text).toContain('Sorry an error occurred');
  });

  it('should display an not-found 404 error page if a route throws that type of error', async () => {
    app.get('/throw-not-found', (_req, _res) => {
      throw new NotFoundError('TEST CASE');
    });
    app.use(internalServerErrorMiddleware);
    const response = await request(app).get('/throw-not-found');

    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page not found');
  });

  it('should display an not-found 404 error page for missing pages', async () => {
    app.use(pageNotFoundMiddleware);
    const response = await request(app).get('/not-to-exist');

    expect(response.status).toEqual(404);
    expect(response.text).toContain('Page not found');
  });
});
