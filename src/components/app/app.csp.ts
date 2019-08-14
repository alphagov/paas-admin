import crypto from 'crypto';
import fs from 'fs';

function hashOfFile(path: string): string {
  const hasher = crypto.createHash('sha256');
  const content = fs.readFileSync(path, {encoding: 'utf-8'});
  hasher.update(content);
  return `'sha256-${hasher.digest('base64')}'`;
}

export default {
  directives: {
    defaultSrc: [
      `'none'`,
    ],
    styleSrc: [
      `'self'`,
      `'unsafe-inline'`,
    ],
    scriptSrc: [
      `'self'`,
      // node_modules/govuk-frontend/template.njk, xpath: //html/body/script[1]
      `'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU='`,
      'www.google-analytics.com',
      'www.googletagmanager.com',
      // this file is inlined by Nunjucks, but we keep it external to make hashing it easier
      hashOfFile('./src/frontend/javascript/analytics.js'),
    ],
    imgSrc: [
      `'self'`,
      'www.google-analytics.com',
    ],
    connectSrc: [
      `'self'`,
      'www.google-analytics.com',
    ],
    frameSrc: [
      `'self'`,
    ],
    fontSrc: [
      `'self'`,
      'data:',
    ],
    objectSrc: [
      `'self'`,
    ],
    mediaSrc: [
      `'self'`,
    ],
  },
};
