import express from 'express';
import helmet from 'helmet';
import home from '../home';
import orgs from '../orgs';
import {pageNotFoundMiddleware, internalServerErrorMiddleware} from '../errors';
import {loggerMiddleware} from '../logger';
import csp from './app.csp';

const app = express();

app.use(loggerMiddleware({}));

app.use(helmet());
app.use(helmet.contentSecurityPolicy(csp));

app.use('/assets', express.static('dist/assets', {immutable: true}));

app.use('/orgs', orgs);
app.use('/', home);

app.use(pageNotFoundMiddleware);
app.use(internalServerErrorMiddleware);

export default app;

