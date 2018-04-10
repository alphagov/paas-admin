import express from 'express';

import UAAClient from './uaa';

interface IClientCredentials {
  readonly clientID: string;
  readonly clientSecret: string;
}

interface IClientConfig {
  readonly apiEndpoint: string;
  readonly clientCredentials: IClientCredentials;
  readonly accessToken?: string;
}

export default function uaaClientMiddleware(uaaClientConfig: IClientConfig) {
  const app = express();

  app.use((req: any, _res: express.Response, next: express.NextFunction) => {
    req.uaa = new UAAClient(uaaClientConfig);
    next();
  });

  return app;
}
