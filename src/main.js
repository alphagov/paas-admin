import sourceMapSupport from 'source-map-support';
import pino from 'pino';
import app from './app';
import Server from './server';

sourceMapSupport.install();

const logger = pino();

function onError(err) {
  logger.error({exit: 1}, err.toString());
  process.exit(100);
}

function onShutdown() {
  logger.info({exit: 0}, 'shutdown gracefully');
  process.exit(0);
}

async function main() {
  const server = new Server(app, {
    port: process.env.PORT
  });

  process.once('SIGINT', () => server.stop());
  process.once('SIGTERM', () => server.stop());

  await server.start();
  logger.info({port: server.http.address().port}, `listening http://localhost:${server.http.address().port}/`);

  /* istanbul ignore if  */
  if (module.hot) {
    module.hot.accept('./app', () => server.update(app));
  }

  return server.wait();
}

main().then(onShutdown).catch(onError);
