import express from 'express';

import { AccountsClient, IAccountsClientConfig } from '../../lib/accounts';

import { Token } from '../auth';
import { internalServerErrorMiddleware } from '../errors';

import termsTemplate from './terms.njk';

type MiddlewareFunction = (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;

/* istanbul ignore next */
function sync(f: MiddlewareFunction) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    f(req, res, next).catch(err => internalServerErrorMiddleware(err, req, res, next));
  };
}

export function termsCheckerMiddleware(location: string, config: IAccountsClientConfig): express.Handler {
  const accounts = new AccountsClient(config);
  const app = express();

  app.get('/agreements/:name', sync(async (req, res) => {
    const document = await accounts.getDocument(req.params.name);
    res.send(termsTemplate.render({
      document,
      context: { csrf: req.csrfToken(), location },
    }));
  }));

  app.post('/agreements', sync(async (req, res) => {
    const token: Token = (req as any).token;
    /* istanbul ignore next */
    if (!token || !token.userID) {
      throw new Error('TOU: cannot create agreement without a `userID` field');
    }
    /* istanbul ignore next */
    if (!req.body) {
      throw new Error('TOU: expected a request body, hint: have you configured a body parser?');
    }
    /* istanbul ignore next */
    if (!req.body.document_name) {
      throw new Error('TOU: expected a request body containing `document_name` field');
    }
    await accounts.createAgreement(req.body.document_name, token.userID);
    res.redirect('/');
    return;
  }));

  app.use(sync(async (req, res, next) => {
    const token: Token = (req as any).token;
    if (!token || !token.userID) {
      next();
      return;
    }
    if (req.method !== 'GET') {
      next();
      return;
    }
    const documents = await accounts.getPendingDocumentsForUserUUID(token.userID);
    if (documents.length === 0) {
      next();
      return;
    }
    res.redirect(`/agreements/${documents[0].name}`);
  }));

  return app;
}
