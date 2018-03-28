import { Logger } from 'pino';

import CloudFoundryClient from '../cf';
import Router, { IParameters } from '../lib/router';
import NotificationClient from '../notify';
import UAAClient from '../uaa';

export interface IRawToken {
  readonly user_id: string;
  readonly scope: ReadonlyArray<string>;
}

export interface IContext {
  readonly cf: CloudFoundryClient;
  readonly linkTo: (name: string, params?: IParameters) => string;
  readonly log: Logger;
  readonly notify: NotificationClient;
  readonly rawToken: IRawToken;
  readonly uaa: UAAClient;
}

export function initContext(req: any, router: Router): IContext {
  return {
    cf: req.cf,
    linkTo: (name: string, params: IParameters = {}) => router.findByName(name).composeURL(params),
    log: req.log,
    notify: req.notify,
    rawToken: req.rawToken,
    uaa: req.uaa,
  };
}
