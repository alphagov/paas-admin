import express from 'express';
import request from 'supertest';

import Server from './server';

describe('server test suite', () => {
  it('should start on random port if none given', async () => {
    const handler = express();
    handler.get('/', (_req, res) => res.send('SPECTRUM_IS_GREEN'));
    const server = new Server(handler);
    await server.start();
    const port = server.http.address().port;
    expect(port > 0).toBeTruthy(); // has a non-zero port number
    await request(`http://localhost:${port}`).get('/').expect('SPECTRUM_IS_GREEN').expect(200);
    return server.stop();
  });

  it('should start on the given port', async () => {
    const handler = express();
    handler.get('/', (_req, res) => res.send('FULLY_ACKNOWLEDGED_BROADCAST'));
    const server = new Server(handler, {port: 7612});
    await server.start();
    const port = server.http.address().port;
    expect(port).toEqual(7612); // has assigned port
    await request(`http://localhost:${port}`).get('/').expect('FULLY_ACKNOWLEDGED_BROADCAST').expect(200);
    return server.stop();
  });

  it('should stop when asked', async () => {
    const handler = express();
    handler.get('/', (_req, res) => res.send('OK'));
    const server = new Server(handler);
    await server.start();
    const port = server.http.address().port;
    await request(`http://localhost:${port}`).get('/').expect(200);
    await server.stop();
    expect(await request(`http://localhost:${port}`).get('/').timeout(500)).toBeUndefined();
  });

  it('should replace the handler when updated', async () => {
    const handlerA = express();
    handlerA.get('/', (_req, res) => res.send('HANDLER_A'));
    const handlerB = express();
    handlerB.get('/', (_req, res) => res.send('HANDLER_B'));
    const server = new Server(handlerA);
    await server.start();
    const port = server.http.address().port;
    await request(`http://localhost:${port}`).get('/').expect('HANDLER_A').catch(fail);
    server.update(handlerB);
    await request(`http://localhost:${port}`).get('/').expect('HANDLER_B').catch(fail);
    return server.stop();
  });

  it('should be able to update the handler event if not started', async () => {
    const handlerA = express();
    handlerA.get('/', (_req, res) => res.send('HANDLER_A'));
    const handlerB = express();
    handlerB.get('/', (_req, res) => res.send('HANDLER_B'));
    const server = new Server(handlerA);
    server.update(handlerB);
    await server.start();
    const port = server.http.address().port;
    await request(`http://localhost:${port}`).get('/').expect('HANDLER_B').catch(fail);
    return server.stop();
  });

  it('should fail to start an already started server', async () => {
    const server = new Server(express());
    await server.start();
    await expect(server.start()).rejects.toThrow(/already started/);
    return server.stop();
  });

  it('should fail to wait on a stopped server', async () => {
    const server = new Server(express());
    await expect(server.wait()).rejects.toThrow(/not started/);
  });

  it('should fail to stop an already stopped server', async () => {
    const server = new Server(express());
    await expect(server.stop()).rejects.toThrow(/not started/);
  });
});
