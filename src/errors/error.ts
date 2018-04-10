import express from 'express';

import Router, { IParameters, NotFoundError } from '../lib/router';

import pageNotFound from './error.404.njk';
import internalServerError from './error.500.njk';

function linker(router: Router) {
    return (name: string, params: IParameters = {}) => {
      return router.findByName(name).composeURL(params);
    };
}

export function internalServerErrorMiddleware(err: Error, req: any, res: express.Response, next: express.NextFunction) {
  req.log.error(err);

  if (err instanceof NotFoundError) {
    return pageNotFoundMiddleware(req, res, next);
  }

  res.status(500);
  res.send(internalServerError.render({
    linkTo: linker(req.router),
  }));
}

export function pageNotFoundMiddleware(req: any, res: express.Response, _next: express.NextFunction) {
  res.status(404);
  res.send(pageNotFound.render({
    linkTo: linker(req.router),
  }));
}

export default {
  internalServerErrorMiddleware,
  pageNotFoundMiddleware,
};
