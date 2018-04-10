import { NotFoundError } from './errors';
import Route, { IRouteDefinition } from './route';

export default class Router {
  public readonly routes: ReadonlyArray<Route>;

  constructor(readonly routesConfig: ReadonlyArray<IRouteDefinition>) {
    this.routes = routesConfig.map((definition: IRouteDefinition) => new Route(definition));
  }

  public find(path: string, method: string = 'get'): Route {
    const route: Route | undefined = this.routes.find((r: Route) =>
      r.matches(path) && r.method.toLowerCase() === method.toLowerCase());

    if (!route) {
      throw new NotFoundError(`unregistered route: ${path}`);
    }

    return route;
  }

  public findByName(name: string): Route {
    const route: Route | undefined = this.routes.find((r: Route) => r.definition.name === name);

    if (!route) {
      throw new NotFoundError(`named route not found: ${name}`);
    }

    return route;
  }

  /* istanbul ignore next */
  private defaultError(err: Error) {
    throw err;
  }
}
