import pino from 'pino';

import { IAppConfig } from './app';

const logger = pino({level: 'silent'});

const sessionSecret = 'mysecret';

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
  location: 'eu-west-1',
  uaaAPI: 'https://example.com/uaa',
  authorizationAPI: 'https://example.com/login',
  notifyAPIKey: 'test-123456-qwerty',
  notifyWelcomeTemplateID: 'qwerty-123456',
};
