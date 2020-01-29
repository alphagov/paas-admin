import Router from './router';

describe('lib/router suite case', () => {
  it('should setup the router correctly', async () => {
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

    expect(router.routes.length).toEqual(2);
  });

  it('should find routes correctly', async () => {
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

    expect(router.find('/more/complex/route/structure')).toBeTruthy();
    expect(router.find('/')).toBeTruthy();
    expect(() => router.find('/404')).toThrow(/unregistered route/);
  });

  it('should find routes by name correctly', async () => {
    const router = new Router([
      {
        name: 'test.home',
        action: async () => ({}),
        path: '/',
      },
    ]);

    expect(router.findByName('test.home')).toBeTruthy();
    expect(() => router.findByName('random')).toThrow(/named route not found/);
  });

  it('should raise error for duplicate route names', async () => {
    expect(() => {
      const router = new Router([
        {
          name: 'route.dupe',
          action: async () => ({}),
          path: '/a',
        },
        {
          name: 'route.dupe',
          action: async () => ({}),
          path: '/b',
        },
      ]);
      fail(
        `should have failed to setup router with dup routes but got ${router}`,
      );
    }).toThrow(/duplicate route entry/);
  });
});
