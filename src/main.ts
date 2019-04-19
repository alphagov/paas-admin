import pino from 'pino';
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

import apm from 'elastic-apm-node';
/* istanbul ignore next */
{
  const isApmEnabled = ['yes', 'true'].includes((process.env.ENABLE_APM || '').toLowerCase());

  const apmServiceName = process.env.APM_SERVICE_NAME || 'paas-admin-local';

  const apmSecretToken = process.env.APM_SECRET_TOKEN;
  if (isApmEnabled && !apmSecretToken) {
    throw new Error('APM_SECRET_TOKEN is a required environment variable');
  }

  const apmServerUrl = process.env.APM_SERVER_URL;
  if (isApmEnabled && !apmServerUrl) {
    throw new Error('APM_SERVER_URL is a required environment variable');
  }

  if (isApmEnabled) {
    logger.info({
      message: `Starting apm with name ${apmServiceName} -> ${apmServerUrl}`,
    });
  }

  apm.start({
    serviceName: apmServiceName,
    secretToken: apmSecretToken,
    serverUrl:   apmServerUrl,
    active: isApmEnabled,
    logger,
  });
}

import sourceMapSupport from 'source-map-support';

import app, { IAppConfig } from './components/app';
import CloudFoundryClient from './lib/cf';

import Server from './server';

sourceMapSupport.install();

function expectEnvVariable(variableName: string): string {
  const value = process.env[variableName] || '';

  if (value === '') {
    logger.error(`Expected environment variable "${variableName}" to be set.`);
    process.exit(100);
  }

  return value;
}

function onError(err: Error) {
  logger.error({exit: 1}, err.toString());
  process.exit(100);
}

function onShutdown() {
  logger.info({exit: 0}, 'shutdown gracefully');
  process.exit(0);
}

/* istanbul ignore next */
function platformLocation(region: string): string {
  switch (region) {
    case 'eu-west-1':
      return 'Ireland';
    case 'eu-west-2':
      return 'London';
    default:
      return region;
  }
}

async function main() {
  const cloudFoundryAPI = expectEnvVariable('API_URL');
  const location = platformLocation(expectEnvVariable('AWS_REGION'));
  let authorizationAPI = process.env.AUTHORIZATION_URL;
  let uaaAPI = process.env.UAA_URL;

  /* istanbul ignore next */
  if (!authorizationAPI || !uaaAPI) {
    const cf = new CloudFoundryClient({
      apiEndpoint: cloudFoundryAPI,
      logger,
    });
    const info = await cf.info();
    authorizationAPI = info.authorization_endpoint;
    uaaAPI = info.token_endpoint;
  }

  const config: IAppConfig = {
    logger,
    sessionSecret: process.env.SESSION_SECRET || 'mysecret',
    allowInsecureSession: (process.env.ALLOW_INSECURE_SESSION === 'true'),
    billingAPI: expectEnvVariable('BILLING_URL'),
    accountsAPI: expectEnvVariable('ACCOUNTS_URL'),
    accountsSecret: expectEnvVariable('ACCOUNTS_SECRET'),
    oauthClientID: expectEnvVariable('OAUTH_CLIENT_ID'),
    oauthClientSecret: expectEnvVariable('OAUTH_CLIENT_SECRET'),
    cloudFoundryAPI,
    location,
    authorizationAPI,
    uaaAPI,
    notifyAPIKey: expectEnvVariable('NOTIFY_API_KEY'),
    notifyWelcomeTemplateID: process.env.NOTIFY_WELCOME_TEMPLATE_ID || null,
  };

  const server = new Server(app(config), {
    port: parseInt(process.env.PORT || '0', 10),
  });

  process.once('SIGINT', () => {
    server.stop().catch(err => console.error(err));
  });
  process.once('SIGTERM', () => {
    server.stop().catch(err => console.error(err));
  });

  await server.start();
  pino().info({
    authorizationAPI,
    billingAPI: config.billingAPI,
    accountsAPI: config.accountsAPI,
    cloudFoundryAPI,
    port: server.http.address().port,
    uaaAPI,
  }, `listening http://localhost:${server.http.address().port}/`);

  return server.wait();
}

main().then(onShutdown).catch(onError);
