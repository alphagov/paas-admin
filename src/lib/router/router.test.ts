import { describe, expect, it } from "vitest";
import Router from './router';

describe('lib/router suite case', () => {
  it('should setup the router correctly', () => {
    const router = new Router([
      {
        action: async () => await Promise.resolve({}),
        name: 'test.route',
        path: '/',
      },
      {
        action: async () => await Promise.resolve({}),
        name: 'test.route.further',
        path: '/further',
      },
    ],['test.route.further']);

    expect(router.routes.length).toEqual(2);
    expect(router.cacheDisableNamespaces.length).toEqual(1);
  });

  it('should find routes correctly', () => {
    const router = new Router([
      {
        action: async () => await Promise.resolve({}),
        name: 'test.home',
        path: '/',
      },
      {
        action: async () => await Promise.resolve({}),
        name: 'test.complex',
        path: '/more/:name/route/:file',
      },
    ],[]);

    expect(router.find('/more/complex/route/structure')).toBeTruthy();
    expect(router.find('/')).toBeTruthy();
    expect(() => router.find('/404')).toThrow(/unregistered route/);
  });

  it('should find routes by name correctly', () => {
    const router = new Router([
      {
        action: async () => await Promise.resolve({}),
        name: 'test.home',
        path: '/',
      },
    ],[]);

    expect(router.findByName('test.home')).toBeTruthy();
    expect(() => router.findByName('random')).toThrow(/named route not found/);
  });

  it('should add cache control headers correctly', () => {
    const router = new Router([
      {
        action: async () => await Promise.resolve({}),
        name: 'test',
        path: '/',
      },
      {
        action: async () => await Promise.resolve({}),
        name: 'test.home',
        path: '/home',
      },
      {
        action: async () => await Promise.resolve({}),
        name: 'test.home.more',
        path: '/home/more',
      },
      {
        action: async () => await Promise.resolve({}),
        name: 'test.complex',
        path: '/more/:name/route/:file',
      },
    ],['test.home']);


    ['test.home', 'test.home.more'].forEach(name => {
      const r = router.findByName(name);
      expect(r).toBeTruthy();
      expect(r.headers.length).toEqual(3);
      expect(r.headers).toContainEqual({
        name: 'Cache-Control',
        value: 'no-store',
      });
      expect(r.headers).toContainEqual({
        name: 'Pragma',
        value: 'no-cache',
      });
      expect(r.headers).toContainEqual({
        name: 'Expires',
        value: '0',
      });
    });

    expect(router.findByName('test')).toBeTruthy();
    expect(router.findByName('test').headers.length).toEqual(0);

    expect(router.findByName('test.complex')).toBeTruthy();
    expect(router.findByName('test.complex').headers.length).toEqual(0);
  });

  it('should raise error for duplicate route names', () => {
    expect(() => {
      const router = new Router([
        {
          action: async () => await Promise.resolve({}),
          name: 'route.dupe',
          path: '/a',
        },
        {
          action: async () => await Promise.resolve({}),
          name: 'route.dupe',
          path: '/b',
        },
      ],[]);
      fail(
        `should have failed to setup router with dup routes but got ${router}`,
      );
    }).toThrow(/duplicate route entry/);
  });

  it('should raise error for duplicate cacheDisableNamespace values', () => {
    expect(() => {
      const router = new Router([
        {
          action: async () => await Promise.resolve({}),
          name: 'route.dupe',
          path: '/a',
        },
      ],['route.dupe','route.dupe']);
      fail(
        `should have failed to setup router with dup cacheDisableNamespace values but got ${router}`,
      );
    }).toThrow(/duplicate cacheDisableNamespace entry/);
  });
});
