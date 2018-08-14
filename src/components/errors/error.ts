import express from 'express';

import { NotFoundError } from '../../lib/router';

import pageNotFound from './error.404.njk';
import internalServerError from './error.500.njk';

export function internalServerErrorMiddleware(err: Error, req: any, res: express.Response, next: express.NextFunction) {
  req.log.error(err);

  if (err instanceof NotFoundError) {
    return pageNotFoundMiddleware(req, res, next);
  }

  res.status(500);
  res.send(internalServerError.render({
    errorMessage: err.message,
  }));
}

export function pageNotFoundMiddleware(_req: any, res: express.Response, _next: express.NextFunction) {
  res.status(404);
  res.send(pageNotFound.render({}));
}

export default {
  internalServerErrorMiddleware,
  pageNotFoundMiddleware,
};
