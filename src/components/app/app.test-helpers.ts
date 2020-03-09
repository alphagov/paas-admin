import jwt from 'jsonwebtoken';
import * as _ from 'lodash';
import pino from 'pino';
import { Token } from '../auth';
import { config } from './app.test.config';
import { IContext } from './context';

class FakeSession implements CookieSessionInterfaces.CookieSessionObject {
  public isChanged: boolean;
  public isNew: boolean;
  public isPopulated: boolean;

  constructor() {
    this.isChanged = false;
    this.isNew = true;
    this.isPopulated = true;
  }

  readonly [propertyName: string]: any;
}

export function createTestContext(ctx?: {}): IContext {
  return _.cloneDeep({
    app: config,
    routePartOf: () => false,
    linkTo: route => `__LINKED_TO__${route}`,
    absoluteLinkTo: () => '__ABSOLUTE_LINKED_TO__',
    log: pino({ level: 'silent' }),
    token: new Token(
      jwt.sign(
        {
          user_id: 'uaa-user-123',
          exp: 2535018460,
          origin: 'uaa',
          scope: [],
        },
        'secret',
      ),
      ['secret'],
    ),
    viewContext: {
      csrf: 'CSRF_TOKEN',
      location: config.location,
      isPlatformAdmin: false,
    },
    session: new FakeSession(),
    ...ctx,
  });
}
