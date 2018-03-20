import {internalServerErrorMiddleware} from '../errors';

export default function syncHandler(f) {
  return (req, res) => {
    f(req, res).catch(err => internalServerErrorMiddleware(err, req, res));
  };
}

export function syncMiddleware(f) {
  return (req, res, next) => {
    f(req, res, next).catch(err => internalServerErrorMiddleware(err, req, res));
  };
}
