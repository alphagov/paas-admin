import internalServerError from './error.500.njk';
import pageNotFound from './error.404.njk';

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function internalServerErrorMiddleware(err, req, res, next) {
  if (err instanceof NotFoundError) {
    return pageNotFoundMiddleware(req, res, next);
  }

  req.log.error(err);
  res.status(500);
  res.send(internalServerError.render({message: err}));
}

export function pageNotFoundMiddleware(req, res, _next) {
  res.status(404);
  res.send(pageNotFound.render({}));
}

export default {
  internalServerErrorMiddleware,
  pageNotFoundMiddleware
};
