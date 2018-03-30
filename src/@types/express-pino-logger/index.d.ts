declare module 'express-pino-logger' {
  import express from 'express';
  import { BaseLogger } from 'pino';

  interface IOptions {
    readonly logger: BaseLogger;
  }

  type MiddlewareFunction = (req: express.Request, res: express.Response, next: express.NextFunction) => void;

  export default function(opts?: IOptions): MiddlewareFunction;
}
