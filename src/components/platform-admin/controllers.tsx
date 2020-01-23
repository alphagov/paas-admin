import React from 'react';

import {
  IParameters,
  IResponse,
  NotAuthorisedError,
} from '../../lib/router';

import { Template } from '../../layouts';
import { IContext } from '../app/context';
import { PlatformAdministratorPage } from './views';

export async function viewHomepage(
  ctx: IContext,
  _params: IParameters,
): Promise<IResponse> {
  const token = ctx.token;

  if (!token.hasAdminScopes()) {
    throw new NotAuthorisedError('Not a platform admin');
  }

  const template = new Template(ctx.viewContext, 'Platform Administrator');

  return {
    body: template.render(<PlatformAdministratorPage
      linkTo={ctx.linkTo}
      csrf={ctx.viewContext.csrf}
    />),
  };
}
