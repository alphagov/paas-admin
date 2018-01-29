import {test} from 'tap';
import express from 'express';
import request from 'supertest';
import {internalServerErrorMiddleware} from '.';

test('should display an internal-server-error 500 error page for errors', async t => {
  const app = express();
  app.use('/bang', (_req, _res, _next) => {
    throw new Error('bang');
  });
  app.use(internalServerErrorMiddleware);
  return request(app)
    .get('/bang')
    .expect(/Sorry an error occurred/i)
    .expect(500);
});

