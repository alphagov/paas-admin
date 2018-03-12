import internalServerError from './error.500.njk';
import pageNotFound from './error.404.njk';

export function internalServerErrorMiddleware(err, req, res, _next) {
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
