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
  readonly authenticated: boolean;
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

export function initContext(
  req: any,
  router: Router,
  route: Route,
  config: IAppConfig,
): IContext {
  const origin = req.token && req.token.origin;
  const isPlatformAdmin =
    req.token && req.token.hasAdminScopes && req.token.hasAdminScopes();

  return {
    absoluteLinkTo: (name: string, params: IParameters = {}): string => {
      return router
        .findByName(name)
        .composeAbsoluteURL(config.domainName, params);
    },
    app: config,
    linkTo: (name: string, params: IParameters = {}): string => {
      return router.findByName(name).composeURL(params);
    },
    log: req.log,
    routePartOf: (name: string): boolean => route.definition.name === name || route.definition.name.startsWith(name),
    session: req.session,
    token: req.token,
    viewContext: {
      authenticated: !!req.user,
      csrf: req.csrfToken(),
      isPlatformAdmin,
      location: config.location,
      origin,
    },
  };
}
