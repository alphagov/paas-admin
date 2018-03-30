declare module 'express-static-gzip' {
  import express from 'express';

  interface IOptions {
    readonly immutable: boolean;
  }

  type MiddlewareFunction = (req: express.Request, res: express.Response, next: express.NextFunction) => void;

  export default function(path: string, opts?: IOptions): MiddlewareFunction;
}
