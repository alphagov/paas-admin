import {IParameters, IResponse} from '../../lib/router';
import UAAClient from '../../lib/uaa';
import {UaaOrigin} from '../../lib/uaa/uaa';
import {IContext, IOIDCConfig} from '../app';
import error500 from '../errors/error.500.njk';
import accessDeniedTemplate from './access-denied.njk';
import {AccountUser} from './account_user';
import OIDC, {IAuthorizationCodeResponse} from './oidc';
import successfulUpliftTemplate from './successful-uplift.njk';
import temporarilyUnavailableTemplate from './temporarily-unavailable.njk';
import unsuccessfulUpliftTemplate from './unsuccessful-uplift.njk';
import useGoogleSSOTemplate from './use-google-sso.njk';
import useMicrosoftSSOTemplate from './use-microsoft-sso.njk';

export async function getUseGoogleSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const user = await fetchLoggedInUser(ctx);

  if (!user.isGDSUser) {
    return {
      redirect: ctx.linkTo('admin.home'),
    };
  }

  return {
    body: useGoogleSSOTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      location: ctx.app.location,
      user,
    }),
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
      location: ctx.app.location,
      providerName: 'Google',
    }),
  };
}

export async function getUseMicrosoftSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cfgProvided = ctx.app.oidcProviders.get('microsoft');

  if (!cfgProvided) {
    ctx.app.logger.error('Unable to find Microsoft OIDC config');

    return {
      body: error500.render({
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        csrf: ctx.csrf,
        location: ctx.app.location,
      }),
    };
  }

  const user = await fetchLoggedInUser(ctx);

  return {
    body: useMicrosoftSSOTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      location: ctx.app.location,
      user,
    }),
  };
}

export async function postUseMicrosoftSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cfgProvided = ctx.app.oidcProviders.get('microsoft');

  if (!cfgProvided) {
    ctx.app.logger.error('Unable to find Microsoft OIDC config');

    return {
      body: error500.render({
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        csrf: ctx.csrf,
        location: ctx.app.location,
      }),
    };
  }

  const oidcClient = new OIDC(
    cfgProvided.clientID,
    cfgProvided.clientSecret,
    cfgProvided.discoveryURL,
    ctx.absoluteLinkTo('account.use-microsoft-sso-callback.get'),
  );
  const redirectURL = await oidcClient.getAuthorizationOIDCURL(ctx.session);

  return {
    redirect: redirectURL,
  };
}

export async function getMicrosoftOIDCCallback(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const cfgProvided = ctx.app.oidcProviders.get('microsoft');

  if (!cfgProvided) {
    ctx.app.logger.error('Unable to find Microsoft OIDC config');

    return {
      body: error500.render({
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        csrf: ctx.csrf,
        location: ctx.app.location,
      }),
    };
  }

  const oidcClient = new OIDC(
    cfgProvided.clientID,
    cfgProvided.clientSecret,
    cfgProvided.discoveryURL,
    ctx.absoluteLinkTo('account.use-microsoft-sso-callback.get'),
  );

  if (_params.hasOwnProperty('error')) {
    return oidcErrorHandler(ctx, _params, cfgProvided);
  }

  const authResponse: IAuthorizationCodeResponse = {
    code: _params.code,
    state: _params.state,
  };

  const success = await oidcClient.oidcCallback(ctx, authResponse, uaa, cfgProvided.providerName as UaaOrigin);

  if (success) {
    return {
      body: successfulUpliftTemplate.render({
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        csrf: ctx.csrf,
        location: ctx.app.location,
        providerName: cfgProvided.providerName,
      }),
    };
  }
  return {
    body: unsuccessfulUpliftTemplate.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      location: ctx.app.location,
      providerName: cfgProvided.providerName,
    }),
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

async function oidcErrorHandler(ctx: IContext, _params: IParameters, cfg: IOIDCConfig): Promise<IResponse> {
  ctx.app.logger.error('The OIDC callback returned an error', _params, cfg.providerName);

  if (_params.error === 'access_denied') {
    return {
      body: accessDeniedTemplate.render({
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        csrf: ctx.csrf,
        location: ctx.app.location,
        providerName: cfg.providerName,
      }),
    };
  }

  if (_params.error === 'temporarily_unavailable') {
    return {
      body: temporarilyUnavailableTemplate.render({
        routePartOf: ctx.routePartOf,
        linkTo: ctx.linkTo,
        csrf: ctx.csrf,
        location: ctx.app.location,
        providerName: cfg.providerName,
      }),
    };
  }

  return {
    body: error500.render({
      routePartOf: ctx.routePartOf,
      linkTo: ctx.linkTo,
      csrf: ctx.csrf,
      location: ctx.app.location,
    }),
  };
}
