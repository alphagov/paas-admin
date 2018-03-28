import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import pino from 'pino';
import request from 'supertest';
import { test } from 'tap';

import { NotFoundError } from '../lib/router/errors';

import { internalServerErrorMiddleware, pageNotFoundMiddleware } from '.';
import Router from '../lib/router';

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

test('should display an internal-server-error 500 error page for errors', async t => {
  app.use('/bang', (_req, _res, _next) => {
    throw new Error('bang');
  });
  app.use(internalServerErrorMiddleware);
  const response = await request(app).get('/bang');

  t.equal(response.status, 500);
  t.contains(response.text, 'Sorry an error occurred');
});

test('should display an not-found 404 error page if a route throws that type of error', async t => {
  app.get('/throw-not-found', (_req, _res) => {
    throw new NotFoundError('TEST CASE');
  });
  app.use(internalServerErrorMiddleware);
  const response = await request(app).get('/throw-not-found');

  t.equal(response.status, 404);
  t.contains(response.text, 'Page not found');
});

test('should display an not-found 404 error page for missing pages', async t => {
  app.use(pageNotFoundMiddleware);
  const response = await request(app).get('/not-to-exist');

  t.equal(response.status, 404);
  t.contains(response.text, 'Page not found');
});
