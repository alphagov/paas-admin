import express from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import * as oauth2 from 'passport-oauth2';
import {syncMiddleware} from '../app/sync-handler';

export default function authentication(config) {
  const app = express();

  passport.use(new oauth2.Strategy({
    authorizationURL: config.oauthAuthorizationURL,
    tokenURL: config.oauthTokenURL,
    clientID: config.oauthClientID,
    clientSecret: config.oauthClientSecret
  },
    (accessToken, refreshToken, profile, cb) => {
      return cb(null, {accessToken, refreshToken, profile});
    }
  ));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, cb) => {
    cb(null, user.accessToken);
  });

  passport.deserializeUser((accessToken, cb) => {
    cb(null, {accessToken});
  });

  app.get('/auth/login', passport.authenticate('oauth2'));

  app.get('/auth/login/callback', passport.authenticate('oauth2'), (req, res) => {
    res.redirect('/');
  });

  app.get('/auth/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use(syncMiddleware(async (req, res, next) => {
    const tokenKey = await req.uaa.getSigningKey();

    if (req.isAuthenticated()) {
      req.accessToken = req.session.passport.user;

      try {
        const rawToken = await jwt.verify(req.session.passport.user, tokenKey);

        /* istanbul ignore next */
        if (!rawToken) {
          throw new Error('jwt: could not verify the token');
        }

        req.rawToken = rawToken;
        req.sessionOptions.expires = rawToken.exp;
      } catch (err) {
        req.log.warn(err);
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
