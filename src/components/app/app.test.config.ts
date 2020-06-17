import pino from 'pino';

import { IAppConfig, IOIDCConfig, OIDCProviderName } from './app';

const logger = pino({ level: 'silent' });

const sessionSecret = 'mysecret';

const providers = new Map<OIDCProviderName, IOIDCConfig>();

providers.set('microsoft', {
  clientID: 'CLIENTID',
  clientSecret: 'CLIENTSECRET',
  discoveryURL: 'https://login.microsoftonline.com/tenant_id/v2.0/.well-known/openid-configuration',
  providerName: 'microsoft',
});

providers.set('google', {
  clientID: 'CLIENTID',
  clientSecret: 'CLIENTSECRET',
  discoveryURL: 'https://accounts.google.com/.well-known/openid-configuration',
  providerName: 'google',
});

export const config: IAppConfig = {
  accountsAPI: 'https://example.com/accounts',
  accountsSecret: 'acc_secret',
  adminFee: 0.1,
  allowInsecureSession: true,
  authorizationAPI: 'https://example.com/login',
  awsCloudwatchEndpoint: 'https://aws-cloudwatch.example.com/',
  awsRegion: 'eu-west-1',
  awsResourceTaggingAPIEndpoint: 'https://aws-tags.example.com',
  billingAPI: 'https://example.com/billing',
  cloudFoundryAPI: 'https://example.com/api',
  domainName: 'https://admin.example.com/',
  location: 'Ireland',
  logger,
  notifyAPIKey: 'test-123456-qwerty',
  notifyPasswordResetTemplateID: 'qwerty-123456',
  notifyWelcomeTemplateID: 'qwerty-123456',
  oauthClientID: 'key',
  oauthClientSecret: 'secret',
  oidcProviders: providers,
  prometheusEndpoint: 'https://example.com/prom',
  prometheusPassword: 'prometheusPassword',
  prometheusUsername: 'prometheusUsername',
  sessionSecret,
  uaaAPI: 'https://example.com/uaa',
};
