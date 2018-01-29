import {test} from 'tap';
import request from 'supertest';
import app from '.';

test('should show the orgs page', async t => {
  return request(app)
    .get('/')
    .expect(/Create org/i)
    .expect(200);
});
