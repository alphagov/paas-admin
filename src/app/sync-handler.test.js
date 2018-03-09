import {test} from 'tap';
import express from 'express';
import request from 'supertest';
import pino from 'pino';
import pinoMiddleware from 'express-pino-logger';
import {internalServerErrorMiddleware} from '../errors';
import syncHandler from './sync-handler';

const logger = pino({}, Buffer.from([]));

const app = express();

app.use(pinoMiddleware(logger));

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/failure', syncHandler(async () => {
  throw new Error('failure');
}));

app.get('/success', syncHandler(async (req, res) => {
  await sleep(10);
  res.send('success');
}));

app.use(internalServerErrorMiddleware);

test('should fail to resolve async function for route', async t => {
  const response = await request(app).get('/failure');

  t.equal(response.status, 500);
  t.contains(response.text, 'Internal Server Error');
});

test('should resolve async function correctly', async t => {
  const response = await request(app).get('/success');

  t.equal(response.status, 200);
  t.contains(response.text, 'success');
});
