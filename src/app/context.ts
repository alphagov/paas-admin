import { Logger } from 'pino';

import CloudFoundryClient from '../cf';
import Router, { IParameters, Route } from '../lib/router';
import NotificationClient from '../notify';
import UAAClient from '../uaa';

export interface IRawToken {
  readonly user_id: string;
  readonly scope: ReadonlyArray<string>;
}

export interface IContext {
  readonly cf: CloudFoundryClient;
  readonly routePartOf: (name: string) => boolean;
  readonly linkTo: (name: string, params?: IParameters) => string;
  readonly log: Logger;
  readonly notify: NotificationClient;
  readonly rawToken: IRawToken;
  readonly uaa: UAAClient;
}

export function initContext(req: any, router: Router, route: Route): IContext {
  return {
    cf: req.cf,
    routePartOf: (name: string) => route.definition.name === name || route.definition.name.startsWith(name),
    linkTo: (name: string, params: IParameters = {}) => router.findByName(name).composeURL(params),
    log: req.log,
    notify: req.notify,
    rawToken: req.rawToken,
    uaa: req.uaa,
  };
}
