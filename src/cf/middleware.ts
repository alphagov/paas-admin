import express from 'express';
import CloudFoundryClient from './cf';

interface IClientCredentials {
  readonly clientID: string;
  readonly clientSecret: string;
}

interface IClientConfig {
  readonly accessToken?: string;
  readonly apiEndpoint: string;
  readonly clientCredentials?: IClientCredentials;
  readonly tokenEndpoint?: string;
}

export default function cfClientMiddleware(config: IClientConfig) {
  const app = express();

  app.use((req: any, _res: express.Response, next: express.NextFunction) => {
    req.cf = new CloudFoundryClient({
      accessToken: req.accessToken || /* istanbul ignore next */ config.accessToken,
      apiEndpoint: config.apiEndpoint,
      clientCredentials: config.clientCredentials,
      tokenEndpoint: config.tokenEndpoint || '',
    });

    next();
  });

  return app;
}
