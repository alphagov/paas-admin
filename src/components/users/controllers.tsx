import React from 'react';

import { Template } from '../../layouts';
import { AccountsClient } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { NotFoundError } from '../../lib/router/errors';
import UAAClient from '../../lib/uaa';
import { IContext } from '../app/context';
import { UserPage } from './views';

import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
} from '../auth';

export async function getUser(
  ctx: IContext,
  params: IParameters,
): Promise<IResponse> {
  const emailOrUserGUID = params.emailOrUserGUID;

  if (typeof emailOrUserGUID !== 'string') {
    throw new NotFoundError('not found');
  }

  const isAdmin = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
  );

  /* istanbul ignore next */
  if (!isAdmin) {
    throw new NotFoundError('not found');
  }

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    secret: ctx.app.accountsSecret,
    logger: ctx.app.logger,
  });

  const accountsUser =
    emailOrUserGUID.indexOf('@') >= 0
      ? await accountsClient.getUserByEmail(emailOrUserGUID)
      : await accountsClient.getUser(emailOrUserGUID);

  if (!accountsUser) {
    throw new NotFoundError(
      `Could not find user for ${emailOrUserGUID} in paas-accounts`,
    );
  }

  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const cfUserSummary = await cf.userSummary(accountsUser.uuid);

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const uaaUser = await uaa.getUser(accountsUser.uuid);
  const origin = uaaUser.origin;

  const template = new Template(ctx.viewContext, 'User');

  return {
    body: template.render(
      <UserPage
        groups={uaaUser.groups}
        lastLogon={new Date(uaaUser.lastLogonTime)}
        linkTo={ctx.linkTo}
        managedOrganizations={cfUserSummary.entity.managed_organizations}
        organizations={cfUserSummary.entity.organizations}
        origin={origin}
        user={accountsUser}
      />,
    ),
  };
}
