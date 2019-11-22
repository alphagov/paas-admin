import express from 'express';

import { NotAuthorisedError, NotFoundError } from '../../lib/router';

import pageNotAuthorised from './error.403.njk';
import pageNotFound from './error.404.njk';
import internalServerError from './error.500.njk';

export class UserFriendlyError extends Error {}

/* istanbul ignore next */
function platformLocation(region: string): string {
  switch (region) {
    case 'eu-west-1':
      return 'Ireland';
    case 'eu-west-2':
      return 'London';
    default:
      return region;
  }
}

function userHostileError(req: any) {
  return {
    context: {
      csrf: req.csrfToken(),
      location: platformLocation(process.env.AWS_REGION || /* istanbul ignore next */ ''),
    },
  };
}

export function internalServerErrorMiddleware(err: Error, req: any, res: express.Response, next: express.NextFunction) {
  req.log.error(err);

  if (err instanceof NotFoundError) {
    return pageNotFoundMiddleware(req, res, next);
  }

  if (err instanceof NotAuthorisedError) {
    return pageNotAuthorisedMiddleware(req, res, next);
  }

  if (err instanceof UserFriendlyError) {
    res.status(500);
    res.send(internalServerError.render({
      errorMessage: err.message,
      context: {
        csrf: req.csrfToken(),
        location: platformLocation(
          process.env.AWS_REGION || /* istanbul ignore next */ '',
        ),
      },
    }));

    return;
  }

  res.status(500);
  res.send(internalServerError.render(userHostileError(req)));
}

export function pageNotFoundMiddleware(req: any, res: express.Response, _next: express.NextFunction) {
  res.status(404);
  res.send(pageNotFound.render(userHostileError(req)));
}

export function pageNotAuthorisedMiddleware(req: any, res: express.Response, _next: express.NextFunction) {
  res.status(403);
  res.send(pageNotAuthorised.render(userHostileError(req)));
}

export default {
  internalServerErrorMiddleware,
  pageNotFoundMiddleware,
  pageNotAuthorisedMiddleware,
};
