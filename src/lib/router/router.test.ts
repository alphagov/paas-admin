import {test} from 'tap';

import Router from './router';

test('should setup the router correctly', async t => {
  const router = new Router([
    {
      name: 'test.route',
      action: async () => ({}),
      path: '/',
    },
    {
      name: 'test.route.further',
      action: async () => ({}),
      path: '/further',
    },
  ]);

  t.equal(router.routes.length, 2);
});

test('should find routes correctly', async t => {
  const router = new Router([
    {
      name: 'test.home',
      action: async () => ({}),
      path: '/',
    },
    {
      name: 'test.complex',
      action: async () => ({}),
      path: '/more/:name/route/:file',
    },
  ]);

  t.ok(router.find('/more/complex/route/structure'));
  t.ok(router.find('/'));
  t.throws(() => router.find('/404'), /unregistered route/);
});

test('should find routes by name correctly', async t => {
  const router = new Router([
    {
      name: 'test.home',
      action: async () => ({}),
      path: '/',
    },
  ]);

  t.ok(router.findByName('test.home'));
  t.throws(() => router.findByName('random'), /named route not found/);
});
