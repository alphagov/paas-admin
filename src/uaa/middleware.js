import express from 'express';
import UAAClient from './uaa';

export default function uaaClientMiddleware(uaaClientConfig) {
  const app = express();

  app.use((req, res, next) => {
    req.uaa = new UAAClient(uaaClientConfig);
    next();
  });

  return app;
}
