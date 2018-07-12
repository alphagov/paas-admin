import Route from './route';

describe ('lib/router test suite - route', () => {
  it('should call for action correctly', async () => {
    const delRoute = new Route({
      name: 'test.del.route',
      action: async () => ({body: 'DELETE ROUTE TEST'}),
      method: 'DELETE',
      path: '/',
    });
    const getRoute = new Route({
      name: 'test.get.route',
      action: async () => ({body: 'GET ROUTE TEST'}),
      method: 'GET',
      path: '/',
    });
    const pstRoute = new Route({
      name: 'test.pst.route',
      action: async () => ({body: 'POST ROUTE TEST'}),
      method: 'POST',
      path: '/',
    });
    const putRoute = new Route({
      name: 'test.put.route',
      action: async () => ({body: 'PUT ROUTE TEST'}),
      method: 'PUT',
      path: '/',
    });

    const delResponse = await delRoute.definition.action({}, {});
    expect(delResponse.body).toMatch(/DELETE ROUTE/);
    const getResponse = await getRoute.definition.action({}, {});
    expect(getResponse.body).toMatch(/GET ROUTE/);
    const pstResponse = await pstRoute.definition.action({}, {});
    expect(pstResponse.body).toMatch(/POST ROUTE/);
    const putResponse = await putRoute.definition.action({}, {});
    expect(putResponse.body).toMatch(/PUT ROUTE/);
  });

  it('should compose URL correctly', async () => {
    const route = new Route({
      name: 'test.route',
      action: async () => ({}),
      path: '/hello/:name',
    });

    expect(route.composeURL({name: 'world'})).toEqual('/hello/world');
    expect(route.composeURL({name: 'world', q: 'query'})).toEqual('/hello/world?q=query');
    expect(() => route.composeURL({})).toThrow(/could not compose url: \/hello\/:name/);
  });

  it('should match route correctly', async () => {
    const route = new Route({
      name: 'test.route',
      action: async () => ({}),
      path: '/hello/:name',
    });

    expect(route.matches('/hello/world')).toBeTruthy();
    expect(route.matches('/world/hello')).toBeFalsy();
  });
});
