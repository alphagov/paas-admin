import express from 'express';

import { initContext } from '../../app/context';

import { IAppConfig } from '../../app/app';
import { IResponse } from './route';
import Router from './router';

function handleResponse(res: express.Response) {
  return (r: IResponse) => {
    if (r.redirect) {
      return res.redirect(r.redirect);
    }

    res.status(r.status || 200).send(r.body);
  };
}

export function expressMiddleware(router: Router, appConfig: IAppConfig): express.Application {
  const app = express();

  app.use((req: any, _res: express.Response, next: express.NextFunction) => {
    req.router = router;
    next();
  });

  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    let route;
    try {
      route = router.find(req.path, req.method);
    } catch (err) {
      return next(err);
    }

    const params = {
      ...req.query,
      ...req.params,
      ...route.parser.match(req.path),
    };

    const ctx = initContext(req, router, route, appConfig);

    route.definition.action(ctx, params, req.body)
      .then(handleResponse(res))
      .catch(next);
  });

  return app;
}
