import compression from 'compression';
import cookieSession from 'cookie-session';
import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import staticGzip from 'express-static-gzip';
import helmet from 'helmet';
import { BaseLogger } from 'pino';

import auth from '../auth';
import { cfClientMiddleware } from '../cf';
import { internalServerErrorMiddleware, pageNotFoundMiddleware } from '../errors';
import { expressMiddleware as routerMiddleware } from '../lib/router';
import NotificationClient from '../notify';
import { uaaClientMiddleware } from '../uaa';

import csp from './app.csp';
import router from './router';

export interface IAppConfig {
  readonly allowInsecureSession?: boolean;
  readonly cloudFoundryAPI: string;
  readonly logger: BaseLogger;
  readonly notifyAPIKey: string;
  readonly notifyWelcomeTemplateID: string | null;
  readonly oauthAuthorizationURL: string;
  readonly oauthClientID: string;
  readonly oauthClientSecret: string;
  readonly oauthTokenURL: string;
  readonly sessionSecret: string;
  readonly uaaAPI: string;
}

export default function(config: IAppConfig) {
  const app = express();

  app.use(pinoMiddleware({logger: config.logger}));

  app.set('trust proxy', true);

  app.use(cookieSession({
    name: 'pazmin-session',
    keys: [config.sessionSecret],
    secure: !config.allowInsecureSession,
    httpOnly: true,
  }));

  app.use('/assets', staticGzip('dist/assets', {immutable: true}));
  app.use(compression());

  app.use(helmet());
  app.use(helmet.contentSecurityPolicy(csp));

  app.use(express.urlencoded({extended: true}));

  app.get('/healthcheck', (_req: express.Request, res: express.Response) => res.send({message: 'OK'}));

  app.use(uaaClientMiddleware({
    apiEndpoint: config.uaaAPI,
    clientCredentials: {
      clientID: config.oauthClientID,
      clientSecret: config.oauthClientSecret,
    },
  }));

  // Authenticated endpoints follow
  app.use(auth(config));

  app.use((req: any, _res, next) => {
    req.notify = new NotificationClient({
      apiKey: config.notifyAPIKey,
      templates: {
        welcome: config.notifyWelcomeTemplateID,
      },
    });

    next();
  });

  app.use(cfClientMiddleware({
    apiEndpoint: config.cloudFoundryAPI,
    clientCredentials: {
      clientID: config.oauthClientID,
      clientSecret: config.oauthClientSecret,
    },
  }));

  app.use(routerMiddleware(router));

  app.use(pageNotFoundMiddleware);
  app.use(internalServerErrorMiddleware);

  return app;
}
