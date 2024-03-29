import jwt from 'jsonwebtoken';
import * as _ from 'lodash-es';
import pino from 'pino';

import { Token } from '../auth';

import { config } from './app.test.config';
import { IContext, RouteLinker } from './context';

class FakeSession implements CookieSessionInterfaces.CookieSessionObject {
  public readonly isChanged: boolean;
  public readonly isNew: boolean;
  public readonly isPopulated: boolean;

  constructor() {
    this.isChanged = false;
    this.isNew = true;
    this.isPopulated = true;
  }

  readonly [propertyName: string]: any;
}

export function createTestContext(ctx?: {}, linkTo?: RouteLinker): IContext {
  const linker = linkTo || (route => `__LINKED_TO__${route}`);

  return _.cloneDeep({
    absoluteLinkTo: () => '__ABSOLUTE_LINKED_TO__',
    app: config,
    linkTo: linker,
    log: pino({ level: 'silent' }),
    routePartOf: () => false,
    session: new FakeSession(),
    token: new Token(
      jwt.sign(
        {
          exp: 2535018460,
          origin: 'uaa',
          scope: [],
          user_id: 'uaa-user-123',
        },
        'secret',
      ),
      ['secret'],
    ),
    viewContext: {
      csrf: 'CSRF_TOKEN',
      isPlatformAdmin: false,
      location: config.location,
    },

    ...ctx,
  });
}
