import pino from 'pino';

import { IAppConfig } from './app';

const logger = pino({level: 'silent'});

const sessionSecret = 'mysecret';

export const config: IAppConfig = {
  logger,
  sessionSecret,
  allowInsecureSession: true,
  billingAPI: 'https://example.com/billing',
  oauthClientID: 'key',
  oauthClientSecret: 'secret',
  cloudFoundryAPI: 'https://example.com/api',
  uaaAPI: 'https://example.com/uaa',
  authorizationAPI: 'https://example.com/login',
  notifyAPIKey: 'test-123456-qwerty',
  notifyWelcomeTemplateID: 'qwerty-123456',
};
