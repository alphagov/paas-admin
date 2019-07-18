import { Logger } from 'pino';

import Router, { IParameters, Route } from '../../lib/router';
import { Token } from '../auth';
import { IAppConfig } from './app';

export interface IRawToken {
  readonly user_id: string;
  readonly scope: ReadonlyArray<string>;
}

export interface IViewContext {
  readonly csrf: string;
  readonly location: string;
}

export interface IContext {
  readonly app: IAppConfig;
  readonly routePartOf: (name: string) => boolean;
  readonly linkTo: (name: string, params?: IParameters) => string;
  readonly absoluteLinkTo: (name: string, params?: IParameters) => string;
  readonly log: Logger;
  readonly token: Token;
  readonly session: CookieSessionInterfaces.CookieSessionObject;
  readonly viewContext: IViewContext;
}

export function initContext(req: any, router: Router, route: Route, config: IAppConfig): IContext {
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
    },
    session: req.session,
  };
}
