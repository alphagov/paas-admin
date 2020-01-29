import { IParameters, IResponse, NotAuthorisedError } from '../../lib/router';

import { IContext } from '../app/context';

export async function redirectToPage(
  ctx: IContext,
  params: IParameters,
  body: any,
): Promise<IResponse> {
  const token = ctx.token;

  if (!token.hasAdminScopes()) {
    throw new NotAuthorisedError('not a platform admin');
  }

  const action = body.action;

  if (typeof action === 'undefined') {
    throw new Error('Action not present');
  }

  if (action === 'find-user') {
    return findUser(ctx, params, body);
  }

  if (action === 'view-costs') {
    return viewCosts(ctx, params, body);
  }

  throw new Error(`Unknown action: ${action}`);
}

async function findUser(
  ctx: IContext,
  _params: IParameters,
  body: any,
): Promise<IResponse> {
  const emailOrUserGUID = body['email-or-user-guid'];

  if (typeof emailOrUserGUID === 'undefined' || emailOrUserGUID === '') {
    throw new Error('Field email-or-user-guid is undefined or blank');
  }

  return {
    redirect: ctx.linkTo('users.get', { emailOrUserGUID }),
  };
}

async function viewCosts(
  ctx: IContext,
  _params: IParameters,
  body: any,
): Promise<IResponse> {
  const month = body.month;
  const year = body.year;
  const format = body.format;

  if (typeof month === 'undefined' || month === '') {
    throw new Error('Field month is undefined or blank');
  }

  if (typeof year === 'undefined' || year === '') {
    throw new Error('Field year is undefined or blank');
  }

  if (typeof format === 'undefined' || format === '') {
    throw new Error('Field format is undefined or blank');
  }

  const rangeStart = `${year}-${month}-01`;

  if (!rangeStart.match(/[20][123][0-9]-[01][0-9]-01/)) {
    throw new Error(
      `Constructed date is invalid, should be YYYY-MM-DD: ${rangeStart}`,
    );
  }

  return {
    redirect: ctx.linkTo(`admin.reports.${format}`, { rangeStart }),
  };
}
