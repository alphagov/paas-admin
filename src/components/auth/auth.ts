import express from 'express';
import passport from 'passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';

import UAAClient from '../../lib/uaa';
import { internalServerErrorMiddleware } from '../errors';

import { Token } from '.';

type MiddlewareFunction = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) => Promise<void>;

interface IConfig {
  readonly clientID: string;
  readonly clientSecret: string;
  readonly authorizationURL: string;
  readonly tokenURL: string;
  readonly uaaAPI: string;
  readonly logoutURL: string;
}

/* istanbul ignore next */
function syncMiddleware(f: MiddlewareFunction) {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    f(req, res, next).catch(err =>
      internalServerErrorMiddleware(err, req, res, next),
    );
  };
}

export function handleSession(config: IConfig) {
  const app = express();

  const options: StrategyOptions = {
    authorizationURL: config.authorizationURL,
    callbackURL: '',
    clientID: config.clientID,
    clientSecret: config.clientSecret,
    tokenURL: config.tokenURL,
  };

  passport.use(
    new Strategy(
      options,
      (accessToken: string, refreshToken: string, profile: any, cb: any) => {
        return cb(null, { accessToken, profile, refreshToken });
      },
    ),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser(
    (user: { readonly accessToken: string }, cb: (err: any, id?: string) => void) => {
      cb(null, user.accessToken);
    },
  );

  passport.deserializeUser(
    (
      accessToken: string,
      cb: (err: any, user?: { readonly accessToken: string }) => void,
    ) => {
      cb(null, { accessToken });
    },
  );

  app.get('/auth/login', passport.authenticate('oauth2'));

  app.get(
    '/auth/login/callback',
    passport.authenticate('oauth2', {}),
    (_req, res) => {
      res.redirect('/');
    },
  );

  app.get('/auth/logout', (req: { readonly logout: () => void }, res) => {
    req.logout();
    res.redirect(config.logoutURL);
  });

  return app;
}

export function requireAuthentication(config: IConfig) {
  const app = express();

  app.use(
    syncMiddleware(async (req: any, res, next) => {
      if (req.isAuthenticated()) {
        try {
          const uaa = new UAAClient({
            apiEndpoint: config.uaaAPI,
            clientCredentials: {
              clientID: config.clientID,
              clientSecret: config.clientSecret,
            },
          });

          const signingKeys = await uaa.getSigningKeys();
          req.token = new Token(req.session.passport.user, signingKeys);
          req.sessionOptions.expires = new Date(
            req.token.expiry * 1000 /* as milliseconds */,
          );
        } catch (err) {
          req.log.error(err);
          req.session = null;

          return res.redirect('/auth/login');
        }
      } else {
        req.session = null;

        return res.redirect('/auth/login');
      }

      next();
    }),
  );

  return app;
}
