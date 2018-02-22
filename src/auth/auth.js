import express from 'express';
import passport from 'passport';
import * as oauth2 from 'passport-oauth2';

export default function authentication(config) {
  const app = express();

  passport.use(new oauth2.Strategy({
    authorizationURL: config.oauthAuthorizationURL,
    tokenURL: config.oauthTokenURL,
    clientID: config.oauthClientID,
    clientSecret: config.oauthClientSecret,
    callbackURL: config.serverRootURL + '/auth/login/callback'
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
    const redirection = req.session.returnTo;
    delete req.session.returnTo;

    res.redirect(redirection || '/');
    req.log.info({
      returnTo: redirection
    }, `Authentication successful, redirecting back to ${redirection}`);
  });

  app.get('/auth/logout', (req, res) => {
    req.logout();
    res.redirect('/');
  });

  app.use((req, res, next) => {
    if (req.isAuthenticated()) {
      req.accessToken = req.session.passport.user;
      next();
    } else {
      const fullUrl = req.protocol + '://' + req.get('host') + req.path;
      req.session.returnTo = fullUrl;
      res.redirect('/auth/login');
      req.log.info(`Performing authentication for ${fullUrl}.`);
    }
  });

  return app;
}
