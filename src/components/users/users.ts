import {AccountsClient} from '../../lib/accounts';
import {IParameters, IResponse} from '../../lib/router';
import {NotFoundError} from '../../lib/router/errors';
import {IContext} from '../app/context';
import {CLOUD_CONTROLLER_ADMIN} from '../auth';

import userTemplate from './user.njk';

export async function getUser(ctx: IContext, params: IParameters): Promise<IResponse> {
  const emailOrUserGUID = params.emailOrUserGUID;

  if (typeof emailOrUserGUID === 'undefined') {
    throw new NotFoundError('not found');
  }

  if (emailOrUserGUID === '') {
    throw new NotFoundError('not found');
  }

  const isAdmin = ctx.token.hasScope(CLOUD_CONTROLLER_ADMIN);

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

  return {
    body: userTemplate.render({
      context: ctx.viewContext,
      accountsUser,
    }),
  };
}
