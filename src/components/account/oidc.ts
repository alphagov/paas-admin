/* eslint-disable @typescript-eslint/camelcase */
import { nanoid } from 'nanoid';
import * as oidc from 'openid-client';

import UAAClient from '../../lib/uaa';
import { UaaOrigin } from '../../lib/uaa/uaa';
import { IContext } from '../app';

export const KEY_STATE = 'oidc_flow_state';
const KEY_SUB = 'sub';

export default class OIDC {
  constructor(
    private readonly clientID: string,
    private readonly clientSecret: string,
    private readonly discoveryURL: string,
    private readonly redirectURL: string,
  ) {}

  public async getAuthorizationOIDCURL(
    session: CookieSessionInterfaces.CookieSessionObject,
  ): Promise<string> {
    const client = await this.createOIDCClient();
    const state = this.generateStateToken();

    const redirectUrl = client.authorizationUrl({
      redirect_uri: this.redirectURL,
      response_type: 'code',
      scope: 'openid profile email',
      // @ts-ignore
      state,
    });

    session[KEY_STATE] = {
      response_type: 'code',
      state,
    };

    return redirectUrl;
  }

  public async oidcCallback(
    ctx: IContext,
    authResponse: oidc.CallbackParamsType,
    uaa: UAAClient,
    providerName: UaaOrigin,
  ): Promise<boolean> {
    try {
      const client = await this.createOIDCClient();

      const { response_type, state } = ctx.session[KEY_STATE];

      const tokenSet = await client.callback(this.redirectURL, authResponse, {
        response_type,
        state,
      });

      let newUsername;
      const claims = tokenSet.claims();
      switch (providerName) {
        case 'google': {
          newUsername = claims[KEY_SUB] as string;
          break;
        }
        /* istanbul ignore next */
        default: {
          throw new Error(`Provider name "${providerName}" is not recognised`);
        }
      }
      await uaa.setUserOrigin(ctx.token.userID, providerName, newUsername);

      ctx.session[KEY_STATE] = null;

      return true;
    } catch (e) {
      ctx.app.logger.error(e);

      return false;
    }
  }

  private async createOIDCClient(): Promise<oidc.Client> {
    const issuer = await oidc.Issuer.discover(this.discoveryURL);

    return new issuer.Client({
      client_id: this.clientID,
      client_secret: this.clientSecret,
      redirect_uris: [this.redirectURL],
      response_types: ['code'],
    });
  }

  private generateStateToken(): string {
    return nanoid(24);
  }
}
