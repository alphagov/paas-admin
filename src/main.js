import http from 'http';
import app from './app';

let currentApp = app;

const port = process.env.PORT || 3000;
const dev = process.env.NODE_ENV === 'development';
const server = http.createServer(currentApp);

server.listen(port);

if (dev) {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
  if (module.hot) {
    module.hot.accept('./app', x => {
      try {
        server.removeListener('request', currentApp);
        currentApp = app;
        server.on('request', currentApp);
        console.log('HOT RELOADING', x);
      } catch (err) {
        console.error('HOT ERROR', err);
      }
    });
  }
  console.log(`                      Mode :`, process.env.NODE_ENV);
  console.log(`                Hot Reload :`, module.hot ? 'Enabled' : 'Disabled');
  console.log(`                  Admin UI : http://localhost:${port}/`);
  console.log(`\n\n`);
}

