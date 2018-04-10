import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';

import { internalServerErrorMiddleware } from '../errors';

type MiddlewareFunction = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;

interface IConfig {
  readonly oauthAuthorizationURL: string;
  readonly oauthTokenURL: string;
  readonly oauthClientID: string;
  readonly oauthClientSecret: string;
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
    authorizationURL: config.oauthAuthorizationURL,
    tokenURL: config.oauthTokenURL,
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
        const rawToken: any = await jwt.verify(req.session.passport.user, signingKey);

        /* istanbul ignore next */
        if (!rawToken) {
          throw new Error('jwt: could not verify the token');
        }

        req.rawToken = rawToken;
        req.sessionOptions.expires = rawToken.exp;
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
