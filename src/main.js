import sourceMapSupport from 'source-map-support';
import pino from 'pino';
import app from './app';
import Server from './server';

sourceMapSupport.install();

const logger = pino();

function expectEnvVariable(variableName) {
  if (process.env[variableName] === undefined || process.env[variableName] === '') {
    logger.error(`Expected environment variable "${variableName}" to be set.`);
    process.exit(100);
  }

  return process.env[variableName];
}

function onError(err) {
  logger.error({exit: 1}, err.toString());
  process.exit(100);
}

function onShutdown() {
  logger.info({exit: 0}, 'shutdown gracefully');
  process.exit(0);
}

async function main(cfg) {
  const server = new Server(app(cfg), {
    port: process.env.PORT
  });

  process.once('SIGINT', () => server.stop());
  process.once('SIGTERM', () => server.stop());

  await server.start();
  logger.info({port: server.http.address().port}, `listening http://localhost:${server.http.address().port}/`);

  /* istanbul ignore if  */
  if (module.hot) {
    module.hot.accept('./app', () => server.update(app(cfg)));
  }

  return server.wait();
}

const config = {
  logger,
  sessionSecret: process.env.SESSION_SECRET || 'mysecret',
  allowInsecure: (process.env.ALLOW_INSECURE === 'true'),
  oauthAuthorizationURL: expectEnvVariable('OAUTH_AUTHORIZATION_URL'),
  oauthTokenURL: expectEnvVariable('OAUTH_TOKEN_URL'),
  oauthClientID: expectEnvVariable('OAUTH_CLIENT_ID'),
  oauthClientSecret: expectEnvVariable('OAUTH_CLIENT_SECRET'),
  serverRootURL: process.env.SERVER_ROOT_URL || 'http://localhost:' + (process.env.PORT || '3000'),
  cloudFoundryAPI: expectEnvVariable('API_URL')
};

main(config).then(onShutdown).catch(onError);
