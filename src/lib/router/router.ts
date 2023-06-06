import { NotFoundError } from './errors';
import Route, { IRouteDefinition } from './route';

export default class Router {
  public readonly routes: ReadonlyArray<Route>;
  public readonly cacheDisableNamespaces: ReadonlyArray<string>;

  constructor(
    readonly routesConfig: ReadonlyArray<IRouteDefinition>,
    readonly cacheDisableNamespacesConfig: ReadonlyArray<string>) {
    this.cacheDisableNamespaces = cacheDisableNamespacesConfig;

    this.routes = routesConfig.map(
      (definition: IRouteDefinition) => this.routeFromDefinition(definition));
    this.validate();
  }

  public find(path: string, method = 'get'): Route {
    const route: Route | undefined = this.routes.find(
      (r: Route) =>
        r.matches(path) && r.method.toLowerCase() === method.toLowerCase(),
    );

    if (!route) {
      throw new NotFoundError(`unregistered route: ${path}`);
    }

    return route;
  }

  public findByName(name: string): Route {
    const route: Route | undefined = this.routes.find(
      (r: Route) => r.definition.name === name,
    );

    if (!route) {
      throw new NotFoundError(`named route not found: ${name}`);
    }

    return route;
  }

  private validate(): void {
    const seenRoutes: { [key: string]: boolean } = {};
    this.routes.forEach(r => {
      if (seenRoutes[r.definition.name]) {
        throw new Error(
          `Router: duplicate route entry for name '${r.definition.name}'`,
        );
      }
      seenRoutes[r.definition.name] = true;
    });
    const seenNamespaces: { [key: string]: boolean } = {};
    this.cacheDisableNamespaces.forEach(ns => {
      if (seenNamespaces[ns]) {
        throw new Error(
          `Router: duplicate cacheDisableNamespace entry for name '${ns}'`,
        );
      }
      seenNamespaces[ns] = true;
    });
  }

  private routeFromDefinition(definition: IRouteDefinition): Route {
    if (this.definitionShouldNotBeCached(definition)) {
      return new Route(definition, [
        { name: 'Cache-Control', value: 'no-store' },
        { name: 'Pragma', value: 'no-cache' },
        { name: 'Expires', value: '0' },
      ]);
    }

    return new Route(definition);
  }

  private definitionShouldNotBeCached(definition: IRouteDefinition): boolean {
    return this.cacheDisableNamespaces.some(ns => definition.name.startsWith(ns));
  }
}
