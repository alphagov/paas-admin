import express from 'express';
import React from 'react';

import { Template } from '../../layouts';
import { NotAuthorisedError, NotFoundError } from '../../lib/router';
import { ErrorPage } from './views';

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

export function internalServerErrorMiddleware(
  err: Error,
  req: any,
  res: express.Response,
  next: express.NextFunction,
) {
  req.log.error(err);

  if (err instanceof NotFoundError) {
    return pageNotFoundMiddleware(req, res, next);
  }

  if (err instanceof NotAuthorisedError) {
    return pageNotAuthorisedMiddleware(req, res, next);
  }

  const template = new Template(
    {
      csrf: req.csrfToken(),
      isPlatformAdmin: false,
      location: platformLocation(
        process.env.AWS_REGION || /* istanbul ignore next */ '',
      ),
    },
    'Internal Server Error',
  );

  if (err instanceof UserFriendlyError) {
    res.status(500);
    res.send(
      template.render(
        <ErrorPage title="Sorry an error occurred">{err.message}</ErrorPage>,
      ),
    );

    return;
  }

  res.status(500);
  res.send(template.render(<ErrorPage title="Sorry an error occurred" />));
}

export function pageNotFoundMiddleware(
  req: any,
  res: express.Response,
  _next: express.NextFunction,
) {
  const template = new Template(
    {
      csrf: req.csrfToken(),
      isPlatformAdmin: false,
      location: platformLocation(
        process.env.AWS_REGION || /* istanbul ignore next */ '',
      ),
    },
    'Page not found',
  );
  res.status(404);
  res.send(
    template.render(
      <ErrorPage title="Page not found">
        If you entered a web address please check it was correct.
      </ErrorPage>,
    ),
  );
}

export function pageNotAuthorisedMiddleware(
  req: any,
  res: express.Response,
  _next: express.NextFunction,
) {
  const template = new Template(
    {
      csrf: req.csrfToken(),
      isPlatformAdmin: false,
      location: platformLocation(
        process.env.AWS_REGION || /* istanbul ignore next */ '',
      ),
    },
    'Page not authorised',
  );
  res.status(403);
  res.send(
    template.render(
      <ErrorPage title="Page not authorised">
        If you entered a web address please check it was correct.
      </ErrorPage>,
    ),
  );
}
