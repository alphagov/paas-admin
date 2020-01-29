declare module 'express-pino-logger' {
  import express from 'express';
  import { BaseLogger, SerializerFn } from 'pino';

  interface IOptions {
    readonly logger: BaseLogger;
    serializers?: { [key: string]: SerializerFn };
  }

  type MiddlewareFunction = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => void;

  export default function(opts?: IOptions): MiddlewareFunction;
}
