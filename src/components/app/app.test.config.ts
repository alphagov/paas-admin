import pino from 'pino';

import {IAppConfig, IOIDCConfig, OIDCProviderName} from './app';

const logger = pino({level: 'silent'});

const sessionSecret = 'mysecret';

const providers = new Map<OIDCProviderName, IOIDCConfig>();
providers.set('microsoft', {
  providerName: 'microsoft',
  clientID: 'CLIENTID',
  clientSecret: 'CLIENTSECRET',
  discoveryURL: 'https://login.microsoftonline.com/tenant_id/v2.0/.well-known/openid-configuration',
});
providers.set('google', {
  providerName: 'google',
  clientID: 'CLIENTID',
  clientSecret: 'CLIENTSECRET',
  discoveryURL: 'https://accounts.google.com/.well-known/openid-configuration',
});
export const config: IAppConfig = {
  logger,
  sessionSecret,
  allowInsecureSession: true,
  billingAPI: 'https://example.com/billing',
  accountsAPI: 'https://example.com/accounts',
  accountsSecret: 'acc_secret',
  oauthClientID: 'key',
  oauthClientSecret: 'secret',
  cloudFoundryAPI: 'https://example.com/api',
  location: 'Ireland',
  uaaAPI: 'https://example.com/uaa',
  authorizationAPI: 'https://example.com/login',
  notifyAPIKey: 'test-123456-qwerty',
  notifyWelcomeTemplateID: 'qwerty-123456',
  oidcProviders: providers,
  domainName: 'https://admin.example.com/',
  awsRegion: 'eu-west-1',
  awsCloudwatchEndpoint: 'https://aws.example.com/',
  adminFee: 0.1,
  prometheusEndpoint: 'https://example.com/prom',
  prometheusUsername: 'prometheusUsername',
  prometheusPassword: 'prometheusPassword',
};
