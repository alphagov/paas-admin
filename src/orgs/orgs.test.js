import {test} from 'tap';
import request from 'supertest';
import app from '.';

test('should show the orgs page', async t => {
  const response = await request(app).get('/');

  t.equal(response.status, 200);
  t.contains(response.text, 'Create org');
});
