import {IParameters, IResponse} from '../../lib/router';
import UAAClient, {IUaaUser} from '../../lib/uaa';
import {IContext} from '../app';
import useGoogleSSOTemplate from './use-google-sso.njk';
import successfulUpliftTemplate from './successful-uplift.njk';

export class AccountUser {
  constructor(private user: IUaaUser) {
  }

  get name(): string {
    return `${this.user.name.givenName} ${this.user.name.familyName}`;
  }

  get email(): string {
    return this.user.userName;
  }

  get authenticationMethod(): string {
    switch (this.user.origin) {
      case 'uaa':
        return 'Username & password';
      case 'google':
        return 'Google';
      default:
        return 'Unknown';
    }
  }

  get isGDSUser(): boolean {
    return this.email.endsWith('@digital.cabinet-office.gov.uk');
  }

  get origin(): string {
    return this.user.origin;
  }
}

export async function getUseGoogleSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const user = await fetchLoggedInUser(ctx);

  if (!user.isGDSUser) {
    return {
      redirect: ctx.linkTo("admin.home")
    };
  }

  return {
    body: useGoogleSSOTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      location: ctx.app.location,
      user: user,
    })
  };
}

export async function postUseGoogleSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });
  await uaa.setUserOrigin(ctx.token.userID, 'google');

  return {
    body: successfulUpliftTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      location: ctx.app.location
    })
  };
}

export async function fetchLoggedInUser(ctx: IContext): Promise<AccountUser> {
  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  return new AccountUser(await uaa.getUser(ctx.token.userID));
}
