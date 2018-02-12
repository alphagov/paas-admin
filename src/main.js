import http from 'http';
import sourceMapSupport from 'source-map-support';
import app from './app';
import logger from './logger';

sourceMapSupport.install();

let currentApp = app;

const port = process.env.PORT || 3000;
const server = http.createServer(currentApp);

server.listen(port);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received attempting graceful shutdown...');
  server.close();
});

if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_WATCH) {
  if (module.hot) {
    module.hot.accept('./app', path => {
      try {
        server.removeListener('request', currentApp);
        currentApp = app;
        server.on('request', currentApp);
      } catch (err) {
        logger.error(`failed to apply hot reloaded for ${path}: ${err}`);
      }
    });
  }
  logger.info(`Mode        :`, process.env.NODE_ENV);
  logger.info(`Hot Reload  :`, module.hot ? 'Enabled' : 'Disabled');
}

logger.info(`Listening   : http://localhost:${port}/`);

