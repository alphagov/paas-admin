import {
  IParameters,
  IResponse,
  NotAuthorisedError,
} from '../../lib/router';

import { IContext } from '../app/context';

import homepageTemplate from './homepage.njk';

export async function viewHomepage(
  ctx: IContext,
  _params: IParameters,
): Promise<IResponse> {
  const token = ctx.token;

  if (!token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin');
  }

  return {
    body: homepageTemplate.render({
      linkTo: ctx.linkTo,
      context: ctx.viewContext,
    }),
  };
}
