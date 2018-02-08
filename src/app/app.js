import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import helmet from 'helmet';
import home from '../home';
import orgs from '../orgs';
import {pageNotFoundMiddleware, internalServerErrorMiddleware} from '../errors';

const app = express();

app.use(pinoMiddleware());

app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: [
      `'none'`
    ],
    styleSrc: [
      `'self'`,
      `'unsafe-inline'`
    ],
    scriptSrc: [
      `'self'`,
      'www.google-analytics.com',
      `'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='`, // Inline script tag in govuk_template
      `'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='`  // Inline script tag in govuk_template
    ],
    imgSrc: [
      `'self'`,
      'www.google-analytics.com'
    ],
    connectSrc: [
      `'self'`,
      'www.google-analytics.com'
    ],
    frameSrc: [
      `'self'`
    ],
    fontSrc: [
      `'self'`,
      'data:'
    ],
    objectSrc: [
      `'self'`
    ],
    mediaSrc: [
      `'self'`
    ]
  }
}));

app.use('/assets', express.static('dist/assets', {
  immutable: process.env.NODE_ENV === 'production'
}));

app.use('/orgs', orgs);
app.use('/', home);

app.use(pageNotFoundMiddleware);
app.use(internalServerErrorMiddleware);

export default app;

