import {test} from 'tap';
import express from 'express';
import request from 'supertest';
import pino from 'pino';
import pinoMiddleware from 'express-pino-logger';
import {internalServerErrorMiddleware, pageNotFoundMiddleware} from '.';

const logBuffer = Buffer.from([]);
const logger = pino({}, logBuffer);
const app = express();
app.use(pinoMiddleware(logger));

test('should display an internal-server-error 500 error page for errors', async t => {
  app.use('/bang', (_req, _res, _next) => {
    throw new Error('bang');
  });
  app.use(internalServerErrorMiddleware);
  const response = await request(app).get('/bang');

  t.equal(response.status, 500);
  t.contains(response.text, 'Sorry an error occurred');
});

test('should display an not-found 404 error page for missing pages', async t => {
  app.use(pageNotFoundMiddleware);
  const response = await request(app).get('/not-to-exist');

  t.equal(response.status, 404);
  t.contains(response.text, 'Page not found');
});
