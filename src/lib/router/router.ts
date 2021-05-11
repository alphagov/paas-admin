import { NotFoundError } from './errors'
import Route, { IRouteDefinition } from './route'

export default class Router {
  public readonly routes: readonly Route[]

  constructor (readonly routesConfig: readonly IRouteDefinition[]) {
    this.routes = routesConfig.map(
      (definition: IRouteDefinition) => new Route(definition)
    )
    this.validate()
  }

  public find (path: string, method = 'get'): Route {
    const route: Route | undefined = this.routes.find(
      (r: Route) =>
        r.matches(path) && r.method.toLowerCase() === method.toLowerCase()
    )

    if (route == null) {
      throw new NotFoundError(`unregistered route: ${path}`)
    }

    return route
  }

  public findByName (name: string): Route {
    const route: Route | undefined = this.routes.find(
      (r: Route) => r.definition.name === name
    )

    if (route == null) {
      throw new NotFoundError(`named route not found: ${name}`)
    }

    return route
  }

  private validate (): void {
    const seen: { [key: string]: boolean } = {}
    this.routes.forEach(r => {
      if (seen[r.definition.name]) {
        throw new Error(
          `Router: duplicate route entry for name '${r.definition.name}'`
        )
      }
      seen[r.definition.name] = true
    })
  }
}
