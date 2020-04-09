import { IncomingMessage, ServerResponse } from 'http';

import compression from 'compression';
import cookieSession from 'cookie-session';
import csrf from 'csurf';
import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import staticGzip from 'express-static-gzip';
import helmet from 'helmet';
import { BaseLogger } from 'pino';

import { IResponse, NotAuthorisedError } from '../../lib/router';
import auth from '../auth';
import { getCalculator } from '../calculator';
import { internalServerErrorMiddleware } from '../errors';
import { listServices, viewService } from '../marketplace';
import { termsCheckerMiddleware } from '../terms';

import { csp } from './app.csp';
import { initContext } from './context';
import { router } from './router';
import { routerMiddleware } from './router-middleware';

export interface IAppConfig {
  readonly allowInsecureSession?: boolean;
  readonly billingAPI: string;
  readonly accountsAPI: string;
  readonly accountsSecret: string;
  readonly cloudFoundryAPI: string;
  readonly location: string;
  readonly logger: BaseLogger;
  readonly notifyAPIKey: string;
  readonly notifyWelcomeTemplateID: string | null;
  readonly oauthClientID: string;
  readonly oauthClientSecret: string;
  readonly sessionSecret: string;
  readonly uaaAPI: string;
  readonly authorizationAPI: string;
  readonly oidcProviders: ReadonlyMap<OIDCProviderName, IOIDCConfig>;
  readonly domainName: string;
  readonly awsRegion: string;
  readonly awsCloudwatchEndpoint?: string;
  readonly awsResourceTaggingAPIEndpoint?: string;
  readonly adminFee: number;
  readonly prometheusEndpoint: string;
  readonly prometheusUsername: string;
  readonly prometheusPassword: string;
}

export type OIDCProviderName = 'microsoft' | 'google';

export interface IOIDCConfig {
  readonly providerName: string;
  readonly clientID: string;
  readonly clientSecret: string;
  readonly discoveryURL: string;
}

export default function(config: IAppConfig): express.Express {
  const app = express();

  app.use(
    pinoMiddleware({
      logger: config.logger,
      serializers: {
        req: (req: IncomingMessage): object => ({
          method: req.method,
          url: req.url,
        }),
        res: /* istanbul ignore next */ (res: ServerResponse): object => ({
          status: res.statusCode,
        }),
      },
    }),
  );

  app.set('trust proxy', true);

  app.use(
    cookieSession({
      httpOnly: true,
      keys: [config.sessionSecret],
      name: 'pazmin-session',
      secure: !config.allowInsecureSession,
    }),
  );

  app.use('/assets', staticGzip('dist/assets', { immutable: true }));
  app.use('/assets', staticGzip('node_modules/govuk-frontend/govuk', { immutable: true }));
  app.use('/assets', staticGzip('node_modules/govuk-frontend/govuk/assets', { immutable: true }));
  app.use('/assets', staticGzip('node_modules/d3/dist', { immutable: true }));
  app.use('/assets', staticGzip('node_modules/d3-sankey/dist', { immutable: true }));
  app.use(compression());

  app.use(helmet());
  app.use(helmet.contentSecurityPolicy(csp));

  app.use(express.urlencoded({ extended: true }));
  app.use(csrf());

  app.get('/healthcheck', (_req: express.Request, res: express.Response) =>
    res.send({ message: 'OK' }),
  );

  app.get('/forbidden', () => {
    throw new NotAuthorisedError('Forbidden');
  });

  app.get('/calculator', (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const route = router.findByName('admin.home');
      const ctx = initContext(req, router, route, config);

      getCalculator(ctx, {
        ...req.query,
        ...req.params,
        ...route.parser.match(req.path),
      })
        .then((response: IResponse) => {
          res.status(response.status || 200).send(response.body);
        })
        .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/marketplace', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('marketplace.view');
    const ctx = initContext(req, router, route, config);

    listServices(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/marketplace/:serviceGUID', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('marketplace.service');
    const ctx = initContext(req, router, route, config);

    viewService(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  // Authenticated endpoints follow
  app.use(
    auth({
      authorizationURL: `${config.authorizationAPI}/oauth/authorize`,
      clientID: config.oauthClientID,
      clientSecret: config.oauthClientSecret,
      logoutURL: `${config.authorizationAPI}/logout.do`,
      tokenURL: `${config.uaaAPI}/oauth/token`,
      uaaAPI: config.uaaAPI,
    }),
  );

  app.use(
    termsCheckerMiddleware(config.location, {
      apiEndpoint: config.accountsAPI,
      logger: config.logger,
      secret: config.accountsSecret,
    }),
  );

  app.use(routerMiddleware(router, config));

  app.use(internalServerErrorMiddleware);

  return app;
}
