import {test} from 'tap';

import Route from './route';

test('should call for action correctly', async t => {
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
  t.contains(delResponse.body, /DELETE ROUTE/);
  const getResponse = await getRoute.definition.action({}, {});
  t.contains(getResponse.body, /GET ROUTE/);
  const pstResponse = await pstRoute.definition.action({}, {});
  t.contains(pstResponse.body, /POST ROUTE/);
  const putResponse = await putRoute.definition.action({}, {});
  t.contains(putResponse.body, /PUT ROUTE/);
});

test('should compose URL correctly', async t => {
  const route = new Route({
    name: 'test.route',
    action: async () => ({}),
    path: '/hello/:name',
  });

  t.equal(route.composeURL({name: 'world'}), '/hello/world');
  t.equal(route.composeURL({name: 'world', q: 'query'}), '/hello/world?q=query');
  t.throws(() => route.composeURL({}), /could not compose url: \/hello\/:name/);
});

test('should match route correctly', async t => {
  const route = new Route({
    name: 'test.route',
    action: async () => ({}),
    path: '/hello/:name',
  });

  t.ok(route.matches('/hello/world'));
  t.notOk(route.matches('/world/hello'));
});
