import {test} from 'tap';
import request from 'supertest';
import init from '.';

const app = init();

test('should render as text/html with utf-8 charset', async t => {
  return request(app)
    .get('/')
    .expect('Content-Type', 'text/html; charset=utf-8');
});

test('should have a Content Security Policy set', async t => {
  return request(app)
    .get('/')
    .expect('Content-Security-Policy', `default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' www.google-analytics.com 'sha256-+6WnXIl4mbFTCARd8N3COQmT3bJJmo32N8q8ZSQAIcU=' 'sha256-G29/qSW/JHHANtFhlrZVDZW1HOkCDRc78ggbqwwIJ2g='; img-src 'self' www.google-analytics.com; connect-src 'self' www.google-analytics.com; frame-src 'self'; font-src 'self' data:; object-src 'self'; media-src 'self'`);
});

test('should gzip responses', async t => {
  return request(app)
    .get('/')
    .expect('Content-Encoding', /gzip/);
});

test('should display a 404 page', async t => {
  return request(app)
    .get('/this-should-not-exists')
    .expect(/Page not found/i)
    .expect(404);
});

