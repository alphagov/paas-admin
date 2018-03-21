import express from 'express';
import CloudFoundryClient from './cf';

export default function cfClientMiddleware({apiEndpoint, accessToken, clientCredentials}) {
  const app = express();

  app.use((req, res, next) => {
    req.cf = new CloudFoundryClient({
      apiEndpoint,
      clientCredentials,
      accessToken: req.accessToken || /* istanbul ignore next */ accessToken
    });

    next();
  });

  return app;
}
