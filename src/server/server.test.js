import {test} from 'tap';
import request from 'supertest';
import express from 'express';
import Server from './server';

test('should start on random port if none given', async t => {
  const handler = express();
  handler.get('/', (req, res) => res.send('SPECTRUM_IS_GREEN'));
  const server = new Server(handler);
  await server.start();
  const port = server.http.address().port;
  t.ok(port > 0, 'has a non-zero port number');
  await t.resolves(request(`http://localhost:${port}`)
    .get('/')
    .expect('SPECTRUM_IS_GREEN')
    .expect(200));
  return server.stop();
});

test('should start on the given port', async t => {
  const handler = express();
  handler.get('/', (req, res) => res.send('FULLY_ACKNOWLEDGED_BROADCAST'));
  const server = new Server(handler, {port: 7612});
  await server.start();
  const port = server.http.address().port;
  t.equal(port, 7612, 'has assigned port');
  await t.resolves(request(`http://localhost:${port}`)
    .get('/')
    .expect('FULLY_ACKNOWLEDGED_BROADCAST')
    .expect(200));
  return server.stop();
});

test('should stop when asked', async t => {
  const handler = express();
  handler.get('/', (req, res) => res.send('OK'));
  const server = new Server(handler);
  await server.start();
  const port = server.http.address().port;
  await t.resolves(request(`http://localhost:${port}`).get('/').expect(200));
  await server.stop();
  await t.rejects(request(`http://localhost:${port}`).get('/').timeout(500), /ECONNREFUSED/);
});

test('should replace the handler when updated', async t => {
  const handlerA = express();
  handlerA.get('/', (req, res) => res.send('HANDLER_A'));
  const handlerB = express();
  handlerB.get('/', (req, res) => res.send('HANDLER_B'));
  const server = new Server(handlerA);
  await server.start();
  const port = server.http.address().port;
  await request(`http://localhost:${port}`).get('/').expect('HANDLER_A').catch(t.fail);
  server.update(handlerB);
  await request(`http://localhost:${port}`).get('/').expect('HANDLER_B').catch(t.fail);
  return server.stop();
});

test('should be able to update the handler event if not started', async t => {
  const handlerA = express();
  handlerA.get('/', (req, res) => res.send('HANDLER_A'));
  const handlerB = express();
  handlerB.get('/', (req, res) => res.send('HANDLER_B'));
  const server = new Server(handlerA);
  server.update(handlerB);
  await server.start();
  const port = server.http.address().port;
  await request(`http://localhost:${port}`).get('/').expect('HANDLER_B').catch(t.fail);
  return server.stop();
});

test('should fail to start an already started server', async t => {
  const server = new Server(express());
  await server.start();
  await t.rejects(server.start(), /already started/);
  return server.stop();
});

test('should fail to wait on a stopped server', async t => {
  const server = new Server(express());
  await t.rejects(server.wait(), /not started/);
});

test('should fail to stop an already stopped server', async t => {
  const server = new Server(express());
  await t.rejects(server.stop(), /not started/);
});

test('should fail when no http handler supplied', async t => {
  t.throws(() => {
    new Server(); // eslint-disable-line no-new
  }, /must supply a handler/);
});
