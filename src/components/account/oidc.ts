import nanoid from 'nanoid';
import * as oidc from 'openid-client';
import UAAClient from '../../lib/uaa';
import {UaaOrigin} from '../../lib/uaa/uaa';
import {IContext} from '../app';

export const KEY_STATE = 'oidc_flow_state';
const KEY_OID = 'oid';
const KEY_SUB = 'sub';

export default class OIDC {
  constructor(
    private clientID: string,
    private clientSecret: string,
    private discoveryURL: string,
    private redirectURL: string,
  ) {
  }

  public async getAuthorizationOIDCURL(session: CookieSessionInterfaces.CookieSessionObject): Promise<string> {
    const client = await this.createOIDCClient();
    const state = this.generateStateToken();

    const redirectUrl = client.authorizationUrl({
      scope: 'openid profile email',
      response_type: 'code',
      redirect_uri: this.redirectURL,
      // @ts-ignore
      state,
    });

    session[KEY_STATE] = {
      state,
      response_type: 'code',
    };
    session.save();
    return redirectUrl;
  }

  public async oidcCallback(
    ctx: IContext,
    authResponse: AuthorizationResponse,
    uaa: UAAClient,
    providerName: UaaOrigin,
  ): Promise<boolean> {
    try {
      const client = await this.createOIDCClient();

      const {state, response_type} = ctx.session[KEY_STATE];

      const tokenSet = await client.authorizationCallback(
        this.redirectURL,
        authResponse,
        {state, response_type},
      );

      switch (providerName) {
        case 'microsoft': {
          const oid = tokenSet.claims[KEY_OID] as string;
          await uaa.setUserOrigin(ctx.token.userID, providerName, oid);
        }
        case 'google': {
          const sub = tokenSet.claims[KEY_SUB] as string;
          await uaa.setUserOrigin(ctx.token.userID, providerName, sub);
        }
      }

      ctx.session[KEY_STATE] = null;
      ctx.session.save();

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

export interface IAuthorizationCodeResponse {
  code: string;
  state: string;
}

export interface IAuthorizationErrorResponse {
  error: string;
  error_description?: string;
  error_uri?: string;
  state: string;
}

export type AuthorizationResponse = IAuthorizationCodeResponse | IAuthorizationErrorResponse;
