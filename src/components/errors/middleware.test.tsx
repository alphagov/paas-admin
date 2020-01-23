import express, { Express } from 'express';
import pinoMiddleware from 'express-pino-logger';
import pino from 'pino';
import request from 'supertest';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import Router, { NotAuthorisedError, NotFoundError } from '../../lib/router';

import { internalServerErrorMiddleware, UserFriendlyError } from '.';

describe('middleware', () => {
  let app: Express;
  const logger = pino({level: 'silent'});

  beforeEach(() => {
    app = express();

    app.use(pinoMiddleware({logger}));

    app.use((req: any, _res, next) => {
      req.csrfToken = () => '';

      next();
    });
  });

  describe(internalServerErrorMiddleware, () => {
    it('should display an internal-server-error 500 error page for errors', async () => {
      app.use('/bang', (_req, _res, _next) => {
        throw new Error('bang');
      });
      app.use(internalServerErrorMiddleware);
      const response = await request(app).get('/bang');

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Sorry an error occurred');
    });

    it('should display a user friendly 500 page with error', async () => {
      app.use('/friendly-bang', (_req, _res, _next) => {
        throw new UserFriendlyError('friendly-bang');
      });
      app.use(internalServerErrorMiddleware);
      const response = await request(app).get('/friendly-bang');

      expect(response.status).toEqual(500);
      expect(response.text).toContain('Sorry an error occurred');
      expect(response.text).toContain('friendly-bang');
      expect(spacesMissingAroundInlineElements(response.text)).toHaveLength(0);
    });

    it('should display a not-found 404 error page if a route throws that type of error', async () => {
      app.get('/throw-not-found', (_req, _res) => {
        throw new NotFoundError('TEST CASE');
      });
      app.use(internalServerErrorMiddleware);
      const response = await request(app).get('/throw-not-found');

      expect(response.status).toEqual(404);
      expect(response.text).toContain('Page not found');
      expect(spacesMissingAroundInlineElements(response.text)).toHaveLength(0);
    });

    it('should display a not-authorised 403 error page if a route throws that type of error', async () => {
      app.get('/throw-not-authorised', (_req, _res) => {
        throw new NotAuthorisedError('TEST CASE');
      });
      app.use(internalServerErrorMiddleware);
      const response = await request(app).get('/throw-not-authorised');

      expect(response.status).toEqual(403);
      expect(response.text).toContain('Page not authorised');
      expect(spacesMissingAroundInlineElements(response.text)).toHaveLength(0);
    });
  });
});
