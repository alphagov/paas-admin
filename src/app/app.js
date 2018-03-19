import express from 'express';
import cookieSession from 'cookie-session';
import helmet from 'helmet';
import pinoMiddleware from 'express-pino-logger';
import compression from 'compression';
import staticGzip from 'express-static-gzip';

import auth from '../auth';
import home from '../home';
import {notifyMiddleware} from '../notify';
import {cfClientMiddleware} from '../cf';
import {uaaClientMiddleware} from '../uaa';
import organizations from '../organizations';
import spaces from '../spaces';
import applications from '../applications';
import services from '../services';
import users from '../users';
import {pageNotFoundMiddleware, internalServerErrorMiddleware} from '../errors';
import csp from './app.csp';

export default function (config) {
  const app = express();

  app.use(pinoMiddleware({logger: config.logger}));

  app.use(cookieSession({
    name: 'pazmin-session',
    keys: [config.sessionSecret],
    secure: !config.allowInsecure,
    httpOnly: true
  }));

  app.use(notifyMiddleware({
    apiKey: config.notifyAPIKey,
    templates: {
      welcome: config.notifyWelcomeTemplateID
    }
  }));

  app.use('/assets', staticGzip('dist/assets', {immutable: true}));
  app.use(compression());

  app.use(helmet());
  app.use(helmet.contentSecurityPolicy(csp));

  app.use(express.urlencoded({extended: true}));

  app.use('/', home);

  // Authenticated endpoints follow
  app.use(auth(config));
  app.use(cfClientMiddleware({
    apiEndpoint: config.cloudFoundryAPI,
    clientCredentials: {
      clientID: config.oauthClientID,
      clientSecret: config.oauthClientSecret
    }
  }));
  app.use(uaaClientMiddleware({
    apiEndpoint: config.uaaAPI,
    clientCredentials: {
      clientID: config.oauthClientID,
      clientSecret: config.oauthClientSecret
    }
  }));

  app.use('/organisations', organizations);
  app.use('/spaces', spaces);
  app.use('/applications', applications);
  app.use('/services', services);
  app.use('/users', users);

  app.use(pageNotFoundMiddleware);
  app.use(internalServerErrorMiddleware);

  return app;
}
