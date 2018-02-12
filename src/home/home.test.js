import {test} from 'tap';
import request from 'supertest';
import app from '.';

test('should render home page', async t => {
  return request(app)
    .get('/')
    .expect(/congratulations/i)
    .expect(200);
});

