import React from 'react';

import { Template } from '../../layouts';
import {  IParameters, IResponse  } from '../../lib/router';
import UAAClient from '../../lib/uaa';
import { UaaOrigin} from '../../lib/uaa/uaa';
import { IContext, IOIDCConfig } from '../app';
import { AccountUser } from './account_user';
import OIDC from './oidc';
import { AccessDeniedPage, SSOPage, SuccessfulUpliftPage, UnavailablePage, UnsuccessfulUpliftPage } from './views';

export async function getUseGoogleSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cfgProvided = ctx.app.oidcProviders.get('google');

  if (!cfgProvided) {
    throw new Error('Unable to find Google OIDC config');
  }

  const user = await fetchLoggedInUser(ctx);
  const template = new Template(ctx.viewContext, 'Google Single Sign On - GOV.UK PaaS');

  return {
    body: template.render(<SSOPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      user={user}
      provider="google"
    />),
  };
}

export async function postUseGoogleSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cfgProvided = ctx.app.oidcProviders.get('google');

  if (!cfgProvided) {
    throw new Error('Unable to find Google OIDC config');
  }

  const oidcClient = new OIDC(
    cfgProvided.clientID,
    cfgProvided.clientSecret,
    cfgProvided.discoveryURL,
    ctx.absoluteLinkTo('account.use-google-sso-callback.get'),
  );
  const redirectURL = await oidcClient.getAuthorizationOIDCURL(ctx.session);

  return {
    redirect: redirectURL,
  };
}

export async function getGoogleOIDCCallback(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const cfgProvided = ctx.app.oidcProviders.get('google');

  if (!cfgProvided) {
    throw new Error('Unable to find Google OIDC config');
  }

  const oidcClient = new OIDC(
    cfgProvided.clientID,
    cfgProvided.clientSecret,
    cfgProvided.discoveryURL,
    ctx.absoluteLinkTo('account.use-google-sso-callback.get'),
  );

  if (_params.hasOwnProperty('error')) {
    return oidcErrorHandler(ctx, _params, cfgProvided);
  }

  const authResponse = {
    code: _params.code,
    state: _params.state,
  };

  const success = await oidcClient.oidcCallback(ctx, authResponse, uaa, cfgProvided.providerName as UaaOrigin);
  const template = new Template(ctx.viewContext, `${success ? 'Successful' : 'Unsuccessful'} Google Single Sign On - Activation - GOV.UK PaaS`);

  return {
    body: success ?
    template.render(<SuccessfulUpliftPage linkTo={ctx.linkTo} provider={cfgProvided.providerName} />) :
    template.render(<UnsuccessfulUpliftPage linkTo={ctx.linkTo} provider={cfgProvided.providerName} />),
  };
}

export async function getUseMicrosoftSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cfgProvided = ctx.app.oidcProviders.get('microsoft');

  if (!cfgProvided) {
    throw new Error('Unable to find Microsoft OIDC config');
  }

  const user = await fetchLoggedInUser(ctx);
  const template = new Template(ctx.viewContext, 'Microsoft Single Sign On - GOV.UK PaaS');

  return {
    body: template.render(<SSOPage
      csrf={ctx.viewContext.csrf}
      linkTo={ctx.linkTo}
      user={user}
      provider="microsoft"
    />),
  };
}

export async function postUseMicrosoftSSO(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const cfgProvided = ctx.app.oidcProviders.get('microsoft');

  if (!cfgProvided) {
    throw new Error('Unable to find Microsoft OIDC config');
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
    throw new Error('Unable to find Microsoft OIDC config');
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

  const authResponse = {
    code: _params.code,
    state: _params.state,
  };

  const success = await oidcClient.oidcCallback(ctx, authResponse, uaa, cfgProvided.providerName as UaaOrigin);
  const template = new Template(ctx.viewContext, `${success ? 'Successful' : 'Unsuccessful'} Microsoft Single Sign On - Activation - GOV.UK PaaS`);

  return {
    body: success ?
    template.render(<SuccessfulUpliftPage linkTo={ctx.linkTo} provider={cfgProvided.providerName} />) :
    template.render(<UnsuccessfulUpliftPage linkTo={ctx.linkTo} provider={cfgProvided.providerName} />),
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
  const template = new Template(ctx.viewContext);
  let body: string;

  switch (_params.error) {
    case 'access_denied':
      template.title = 'Sorry, there is a problem with the service – SSO Access Denied – GOV.UK PaaS';
      body = template.render(<AccessDeniedPage
        linkTo={ctx.linkTo}
        provider={cfg.providerName}
      />);
      break;
    case 'temporarily_unavailable':
      template.title = 'Sorry, there is a problem with the service – SSO Temporarily Unavailable – GOV.UK PaaS';
      body = template.render(<UnavailablePage
        linkTo={ctx.linkTo}
        provider={cfg.providerName}
      />);
      break;
    default:
      throw new Error('Unknown OIDC error');
  }

  return { body };
}
