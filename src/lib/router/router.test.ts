import Router from './router'

describe('lib/router suite case', () => {
  it('should setup the router correctly', () => {
    const router = new Router([
      {
        action: async () => await Promise.resolve({}),
        name: 'test.route',
        path: '/'
      },
      {
        action: async () => await Promise.resolve({}),
        name: 'test.route.further',
        path: '/further'
      }
    ])

    expect(router.routes.length).toEqual(2)
  })

  it('should find routes correctly', () => {
    const router = new Router([
      {
        action: async () => await Promise.resolve({}),
        name: 'test.home',
        path: '/'
      },
      {
        action: async () => await Promise.resolve({}),
        name: 'test.complex',
        path: '/more/:name/route/:file'
      }
    ])

    expect(router.find('/more/complex/route/structure')).toBeTruthy()
    expect(router.find('/')).toBeTruthy()
    expect(() => router.find('/404')).toThrow(/unregistered route/)
  })

  it('should find routes by name correctly', () => {
    const router = new Router([
      {
        action: async () => await Promise.resolve({}),
        name: 'test.home',
        path: '/'
      }
    ])

    expect(router.findByName('test.home')).toBeTruthy()
    expect(() => router.findByName('random')).toThrow(/named route not found/)
  })

  it('should raise error for duplicate route names', () => {
    expect(() => {
      const router = new Router([
        {
          action: async () => await Promise.resolve({}),
          name: 'route.dupe',
          path: '/a'
        },
        {
          action: async () => await Promise.resolve({}),
          name: 'route.dupe',
          path: '/b'
        }
      ])
      fail(
        `should have failed to setup router with dup routes but got ${router}`
      )
    }).toThrow(/duplicate route entry/)
  })
})
