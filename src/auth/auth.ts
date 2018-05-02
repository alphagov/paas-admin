import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';

import { internalServerErrorMiddleware } from '../errors';
import UAAClient from '../uaa';

type MiddlewareFunction = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;

interface IConfig {
  readonly oauthClientID: string;
  readonly oauthClientSecret: string;
  readonly uaaAPI: string;
}

/* istanbul ignore next */
function syncMiddleware(f: MiddlewareFunction) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    f(req, res, next).catch(err => internalServerErrorMiddleware(err, req, res, next));
  };
}

export default function authentication(config: IConfig) {
  const app = express();

  const options: StrategyOptions = {
    authorizationURL: `${config.uaaAPI}/oauth/authorize`,
    tokenURL: `${config.uaaAPI}/oauth/token`,
    callbackURL: '',
    clientID: config.oauthClientID,
    clientSecret: config.oauthClientSecret,
  };

  passport.use(new Strategy(options, (accessToken: string, refreshToken: string, profile: any, cb: any) => {
    return cb(null, {accessToken, refreshToken, profile});
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: {accessToken: string}, cb: (err: any, id?: string) => void) => {
    cb(null, user.accessToken);
  });

  passport.deserializeUser((accessToken: string, cb: (err: any, user?: {accessToken: string}) => void) => {
    cb(null, {accessToken});
  });

  app.get('/auth/login', passport.authenticate('oauth2'));

  app.get('/auth/login/callback', passport.authenticate('oauth2', {}), (_req, res) => {
    res.redirect('/');
  });

  app.get('/auth/logout', (req: {logout: () => void}, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use(syncMiddleware(async (req: any, res, next) => {
    const signingKey = await req.uaa.getSigningKey();

    if (req.isAuthenticated()) {
      req.accessToken = req.session.passport.user;

      try {
        const uaa = new UAAClient({
          apiEndpoint: config.uaaAPI,
          clientCredentials: {
            clientID: config.oauthClientID,
            clientSecret: config.oauthClientSecret,
          },
        });

        const signingKeys = await uaa.getSigningKeys();
        req.token = new Token(req.session.passport.user, signingKeys);
        req.sessionOptions.expires = req.token.expiry;
      } catch (err) {
        req.log.debug(err);
        req.session = null;
        return res.redirect('/auth/login');
      }
    } else {
      req.session = null;
      return res.redirect('/auth/login');
    }

    next();
  }));

  return app;
}
