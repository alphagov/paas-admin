import pino from 'pino';
import sourceMapSupport from 'source-map-support';

import app, {
  IAppConfig,
  IOIDCConfig,
  OIDCProviderName,
} from './components/app';
import CloudFoundryClient from './lib/cf';
import Server from './server';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

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
  logger.error({ exit: 1 }, err.toString());
  process.exit(100);
}

function onShutdown() {
  logger.info({ exit: 0 }, 'shutdown gracefully');
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
  const awsRegion = expectEnvVariable('AWS_REGION');
  const location = platformLocation(awsRegion);
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

  const providers = new Map<OIDCProviderName, IOIDCConfig>();
  providers.set('microsoft', {
    providerName: 'microsoft',
    clientID: expectEnvVariable('MS_CLIENT_ID'),
    clientSecret: expectEnvVariable('MS_CLIENT_SECRET'),
    discoveryURL:
      'https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration',
  });

  providers.set('google', {
    providerName: 'google',
    clientID: expectEnvVariable('GOOGLE_CLIENT_ID'),
    clientSecret: expectEnvVariable('GOOGLE_CLIENT_SECRET'),
    discoveryURL:
      'https://accounts.google.com/.well-known/openid-configuration',
  });

  const config: IAppConfig = {
    accountsAPI: expectEnvVariable('ACCOUNTS_URL'),
    accountsSecret: expectEnvVariable('ACCOUNTS_SECRET'),
    adminFee: 0.1,
    allowInsecureSession: process.env.ALLOW_INSECURE_SESSION === 'true',
    authorizationAPI,
    awsCloudwatchEndpoint: process.env.AWS_CLOUDWATCH_ENDPOINT,
    awsRegion,
    awsResourceTaggingAPIEndpoint: process.env.AWS_RESOURCE_TAGGING_API_ENDPOINT,
    billingAPI: expectEnvVariable('BILLING_URL'),
    cloudFoundryAPI,
    domainName: expectEnvVariable('DOMAIN_NAME'),
    location,
    logger,
    notifyAPIKey: expectEnvVariable('NOTIFY_API_KEY'),
    notifyPasswordResetTemplateID: process.env.NOTIFY_PASSWORD_RESET_TEMPLATE_ID || null,
    notifyWelcomeTemplateID: process.env.NOTIFY_WELCOME_TEMPLATE_ID || null,
    oauthClientID: expectEnvVariable('OAUTH_CLIENT_ID'),
    oauthClientSecret: expectEnvVariable('OAUTH_CLIENT_SECRET'),
    oidcProviders: providers,
    prometheusEndpoint: expectEnvVariable('PROMETHEUS_ENDPOINT'),
    prometheusPassword: expectEnvVariable('PROMETHEUS_PASSWORD'),
    prometheusUsername: expectEnvVariable('PROMETHEUS_USERNAME'),
    sessionSecret: process.env.SESSION_SECRET || 'mysecret',
    uaaAPI,
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
  pino().info(
    {
      accountsAPI: config.accountsAPI,
      authorizationAPI,
      billingAPI: config.billingAPI,
      cloudFoundryAPI,
      port: server.http.address().port,
      uaaAPI,
    },
    `listening http://localhost:${server.http.address().port}/`,
  );

  return server.wait();
}

main()
  .then(onShutdown)
  .catch(onError);
