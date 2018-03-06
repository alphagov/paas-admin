import express from 'express';
import Client from './client';

export default function cfClient(config) {
  const app = express();

  app.use((req, res, next) => {
    req.cf = new Client(config.cloudFoundryAPI, req.accessToken);
    next();
  });

  return app;
}
