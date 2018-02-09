import http from 'http';
import app from './app';
import logger from './logger';

let currentApp = app;

const port = process.env.PORT || 3000;
const server = http.createServer(currentApp);

server.listen(port);

if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_WATCH) {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
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

