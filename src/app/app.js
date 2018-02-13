import express from 'express';
import helmet from 'helmet';
import pinoMiddleware from 'express-pino-logger';
import home from '../home';
import orgs from '../orgs';
import {pageNotFoundMiddleware, internalServerErrorMiddleware} from '../errors';
import csp from './app.csp';

export default function ({logger} = {}) {
  const app = express();

  if (logger) {
    app.use(pinoMiddleware({logger}));
  }

  app.use(helmet());
  app.use(helmet.contentSecurityPolicy(csp));

  app.use('/assets', express.static('dist/assets', {immutable: true}));

  app.use('/orgs', orgs);
  app.use('/', home);

  app.use(pageNotFoundMiddleware);
  app.use(internalServerErrorMiddleware);

  return app;
}

