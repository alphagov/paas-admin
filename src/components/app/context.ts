import { Logger } from 'pino';

import Router, { IParameters, Route } from '../../lib/router';
import { Token } from '../auth';
import { IAppConfig } from './app';

export type RouteLinker = (name: string, params?: IParameters) => string;
export type RouteActiveChecker = (name: string) => boolean;

export interface IRawToken {
  readonly user_id: string;
  readonly scope: ReadonlyArray<string>;
}

export interface IViewContext {
  readonly csrf: string;
  readonly location: string;
  readonly origin?: string;
  readonly isPlatformAdmin: boolean;
}

export interface IContext {
  readonly app: IAppConfig;
  readonly routePartOf: RouteActiveChecker;
  readonly linkTo: RouteLinker;
  readonly absoluteLinkTo: RouteLinker;
  readonly log: Logger;
  readonly token: Token;
  readonly session: CookieSessionInterfaces.CookieSessionObject;
  readonly viewContext: IViewContext;
}

export function initContext(req: any, router: Router, route: Route, config: IAppConfig): IContext {
  const origin = req.token && req.token.origin;
  const isPlatformAdmin = req.token && req.token.hasAdminScopes && req.token.hasAdminScopes();

  return {
    app: config,
    routePartOf: (name: string) => route.definition.name === name || route.definition.name.startsWith(name),
    linkTo: (name: string, params: IParameters = {}) => {
      return router.findByName(name).composeURL(params);
    },
    absoluteLinkTo: (name: string, params: IParameters = {}) => {
      return router.findByName(name).composeAbsoluteURL(config.domainName, params);
    },
    log: req.log,
    token: req.token,
    viewContext: {
      location: config.location,
      csrf: req.csrfToken(),
      origin, isPlatformAdmin,
    },
    session: req.session,
  };
}
