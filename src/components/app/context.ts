import { Logger } from 'pino';

import Router, { IParameters, Route } from '../../lib/router';
import { Token } from '../auth';
import { IAppConfig } from './app';

export interface IRawToken {
  readonly user_id: string;
  readonly scope: ReadonlyArray<string>;
}

export interface IContext {
  readonly app: IAppConfig;
  readonly routePartOf: (name: string) => boolean;
  readonly linkTo: (name: string, params?: IParameters) => string;
  readonly log: Logger;
  readonly token: Token;
  readonly csrf: string;
}

export function initContext(req: any, router: Router, route: Route, config: IAppConfig): IContext {
  return {
    app: config,
    routePartOf: (name: string) => route.definition.name === name || route.definition.name.startsWith(name),
    linkTo: (name: string, params: IParameters = {}) => router.findByName(name).composeURL(params),
    log: req.log,
    token: req.token,
    csrf: req.csrfToken(),
  };
}
