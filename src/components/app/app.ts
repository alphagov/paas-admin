import { IncomingMessage, ServerResponse } from 'http';

import compression from 'compression';
import cookieSession from 'cookie-session';
import csrf from 'csurf';
import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import staticGzip from 'express-static-gzip';
import helmet, { contentSecurityPolicy } from 'helmet';
import { BaseLogger } from 'pino';

import { IResponse, NotAuthorisedError } from '../../lib/router';
import { handleSession, requireAuthentication } from '../auth';
import { getCalculator } from '../calculator';
import { internalServerErrorMiddleware } from '../errors';
import { listServices, viewService } from '../marketplace';
import {
  ContactUsForm,
  FindOutMoreForm,
  HandleContactUsFormPost,
  HandleFindOutMoreFormPost,
  HandleHelpUsingPaasFormPost,
  HandleSignupFormPost,
  HandleSomethingWrongWithServiceFormPost,
  HandleSupportSelectionFormPost,
  HelpUsingPaasForm,
  JoiningExistingOrganisationNotice,
  RequestAnAccountForm,
  SignupForm,
  SomethingWrongWithServiceForm,
  SupportSelectionForm,
} from '../support';
import { termsCheckerMiddleware } from '../terms';
import { resetPassword, resetPasswordObtainToken, resetPasswordProvideNew, resetPasswordRequestToken } from '../users';

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
  readonly notifyPasswordResetTemplateID?: string;
  readonly notifyWelcomeTemplateID?: string;
  readonly mailchimpAPIKey: string;
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
  readonly zendeskConfig: {
    readonly token: string;
    readonly remoteUri: string;
    readonly username: string;
  };
}

export type OIDCProviderName = 'google';

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
  app.use(contentSecurityPolicy(csp));

  app.use(express.urlencoded({ extended: true }));
  app.use(csrf());

  app.get('/healthcheck', (_req: express.Request, res: express.Response) =>
    res.send({ message: 'OK' }),
  );

  const sessionConfig = {
    authorizationURL: `${config.authorizationAPI}/oauth/authorize`,
    clientID: config.oauthClientID,
    clientSecret: config.oauthClientSecret,
    logoutURL: `${config.authorizationAPI}/logout.do`,
    tokenURL: `${config.uaaAPI}/oauth/token`,
    uaaAPI: config.uaaAPI,
  };

  app.use(
    handleSession(sessionConfig),
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

  /* istanbul ignore next */
  app.get('/password/request-reset', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('users.password.request.form');
    const ctx = initContext(req, router, route, config);

    resetPasswordRequestToken(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  /* istanbul ignore next */
  app.post('/password/request-reset', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('users.password.request');
    const ctx = initContext(req, router, route, config);

    resetPasswordObtainToken(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  /* istanbul ignore next */
  app.get('/password/confirm-reset', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('users.password.reset.form');
    const ctx = initContext(req, router, route, config);

    resetPasswordProvideNew(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  /* istanbul ignore next */
  app.post('/password/confirm-reset', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('users.password.reset');
    const ctx = initContext(req, router, route, config);

    resetPassword(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
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

  //support forms routes here
  app.get('/support', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.selection');
    const ctx = initContext(req, router, route, config);

    SupportSelectionForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  /* istanbul ignore next */
  app.post('/support', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.selection.post');
    const ctx = initContext(req, router, route, config);

    HandleSupportSelectionFormPost(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
      .then((response: IResponse) => {
        const selectedOption = req.body && req.body['support_type'];
        if (selectedOption === undefined) {
          res.status(response.status || 200).send(response.body);
        } else {
          res.redirect(`/support/${selectedOption}`);
        }
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/support/something-wrong-with-service', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.something-wrong-with-service');
    const ctx = initContext(req, router, route, config);

    SomethingWrongWithServiceForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  /* istanbul ignore next */
  app.post('/support/something-wrong-with-service', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.something-wrong-with-service.post');
    const ctx = initContext(req, router, route, config);

    HandleSomethingWrongWithServiceFormPost(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/support/help-using-paas', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.help-using-paas');
    const ctx = initContext(req, router, route, config);

    HelpUsingPaasForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );
  /* istanbul ignore next */
  app.post('/support/help-using-paas', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.help-using-paas.post');
    const ctx = initContext(req, router, route, config);

    HandleHelpUsingPaasFormPost(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/support/find-out-more', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.find-out-more');
    const ctx = initContext(req, router, route, config);

    FindOutMoreForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );
  /* istanbul ignore next */
  app.post('/support/find-out-more', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.find-out-more.post');
    const ctx = initContext(req, router, route, config);

    HandleFindOutMoreFormPost(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/support/contact-us', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.contact-us');
    const ctx = initContext(req, router, route, config);

    ContactUsForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );
  /* istanbul ignore next */
  app.post('/support/contact-us', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.contact-us.post');
    const ctx = initContext(req, router, route, config);

    HandleContactUsFormPost(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/support/sign-up', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.sign-up');
    const ctx = initContext(req, router, route, config);

    SignupForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );
  /* istanbul ignore next */
  app.post('/support/sign-up', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.sign-up.post');
    const ctx = initContext(req, router, route, config);

    HandleSignupFormPost(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) }, req.body)
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/support/request-an-account', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.request-an-account');
    const ctx = initContext(req, router, route, config);

    RequestAnAccountForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  /* istanbul ignore next */
  app.post('/support/request-an-account', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.request-an-account');
    const ctx = initContext(req, router, route, config);

    RequestAnAccountForm(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then(() => {
        const selectedOption = req.body && req.body['create-an-org'];
        if (selectedOption === 'yes') {
          res.redirect('/support/sign-up');
        } else {
          res.redirect('/support/existing-organisation');
        }
      })
      .catch(err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  app.get('/support/existing-organisation', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const route = router.findByName('support.existing-organisation');
    const ctx = initContext(req, router, route, config);

    JoiningExistingOrganisationNotice(ctx, { ...req.query, ...req.params, ...route.parser.match(req.path) })
      .then((response: IResponse) => {
        res.status(response.status || 200).send(response.body);
      })
      .catch(
        /* istanbul ignore next */
        err => internalServerErrorMiddleware(err, req, res, next));
    },
  );

  // Authenticated endpoints follow
  app.use(
    requireAuthentication(sessionConfig),
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
