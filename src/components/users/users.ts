import {AccountsClient} from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import {IParameters, IResponse} from '../../lib/router';
import {NotFoundError} from '../../lib/router/errors';
import UAAClient from '../../lib/uaa';
import {IContext} from '../app/context';

import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
} from '../auth';

import userTemplate from './user.njk';

export async function getUser(ctx: IContext, params: IParameters): Promise<IResponse> {
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

  const accountsUser = (
    (emailOrUserGUID.indexOf('@') >= 0)
    ? await accountsClient.getUserByEmail(emailOrUserGUID)
    : await accountsClient.getUser(emailOrUserGUID)
  );

  if (accountsUser === null) {
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
  const lastLogonTimestamp = new Date(uaaUser.lastLogonTime)
    .toLocaleString('en-GB', { timeZone: 'UTC' });

  return {
    body: userTemplate.render({
      context: ctx.viewContext,
      accountsUser,
      orgs: cfUserSummary.entity.organizations,
      managedOrgs: cfUserSummary.entity.managed_organizations,
      uaaGroups: uaaUser.groups,
      origin, lastLogonTimestamp,
      linkTo: ctx.linkTo,
    }),
  };
}
