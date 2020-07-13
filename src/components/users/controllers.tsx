import { capitalize } from 'lodash';
import React from 'react';

import { Template } from '../../layouts';
import { AccountsClient } from '../../lib/accounts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse } from '../../lib/router';
import { NotFoundError } from '../../lib/router/errors';
import UAAClient from '../../lib/uaa';
import { IContext } from '../app/context';
import {
  CLOUD_CONTROLLER_ADMIN,
  CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  CLOUD_CONTROLLER_READ_ONLY_ADMIN,
} from '../auth';

import { PasswordResetSuccess, PasswordResetRequest, UserPage, PasswordResetSetPasswordForm } from './views';
import NotificationClient from '../../lib/notify';

interface IPasswordResetBody {
  readonly email?: string;
}

interface INewPasswordBody {
  readonly code: string;
  readonly password: string;
  readonly passwordConfirmation: string;
}

export async function getUser(ctx: IContext, params: IParameters): Promise<IResponse> {
  const emailOrUserGUID = params.emailOrUserGUID;

  if (typeof emailOrUserGUID !== 'string') {
    throw new NotFoundError('not found');
  }

  const canViewUsers = ctx.token.hasAnyScope(
    CLOUD_CONTROLLER_ADMIN,
    CLOUD_CONTROLLER_READ_ONLY_ADMIN,
    CLOUD_CONTROLLER_GLOBAL_AUDITOR,
  );

  if (!canViewUsers) {
      throw new NotFoundError('not found');
  }

  const accountsClient = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
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
  if (!uaaUser) {
    throw new NotFoundError('User not found');
  }
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

export async function resetPasswordRequestToken(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const template = new Template(ctx.viewContext, 'Request password reset');

  return await Promise.resolve({
    body: template.render(<PasswordResetRequest csrf={ctx.viewContext.csrf} />),
  });
}

export async function resetPasswordObtainToken(
  ctx: IContext, params: IParameters, body: IPasswordResetBody,
): Promise<IResponse> {
  const VALID_EMAIL = /^[^@]*@[^@]*$/;
  const email = (/* istanbul ignore next */ body.email || '').toLowerCase();
  const template = new Template(ctx.viewContext, 'Request password reset');

  if (!email || !VALID_EMAIL.test(email)) {
    template.title = 'Error: Request password reset';

    return {
      body: template.render(<PasswordResetRequest csrf={ctx.viewContext.csrf} invalidEmail={true} />),
      status: 400,
    };
  }

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const accounts = new AccountsClient({
    apiEndpoint: ctx.app.accountsAPI,
    logger: ctx.app.logger,
    secret: ctx.app.accountsSecret,
  });

  const accountsUser = await accounts.getUserByEmail(email);
  if (!accountsUser) {
    // 400ms delay to stop people iterating through users
    await new Promise(finish => setTimeout(finish, 400));

    template.title = 'Error: User not found';

    return {
      body: template.render(<PasswordResetRequest csrf={ctx.viewContext.csrf} userNotFound={true} />),
      status: 404,
    };
  }

  const uaaUser = await uaa.getUser(accountsUser.uuid)
  if (!uaaUser) {
    // 400ms delay to stop people iterating through users
    await new Promise(finish => setTimeout(finish, 400));

    template.title = 'Error: User not found';

    return {
      body: template.render(<PasswordResetRequest csrf={ctx.viewContext.csrf} userNotFound={true} />),
      status: 404,
    };
  }

  if (uaaUser.origin != 'uaa') {
    // 400ms delay to stop people iterating through users
    await new Promise(finish => setTimeout(finish, 400));

    const idpNice = capitalize(uaaUser.origin);
    template.title = `Error: You have enabled ${idpNice} single sign-on`;

    return {
      body: template.render(<PasswordResetRequest csrf={ctx.viewContext.csrf} userEnabledSSO={true} idpNice={idpNice}/>),
    };
  }

  const notify = new NotificationClient({
    apiKey: ctx.app.notifyAPIKey,
    templates: {
      passwordReset: ctx.app.notifyPasswordResetTemplateID,
    },
  });
  const resetCode = await uaa.obtainPasswordResetCode(uaaUser.userName);

  const url = new URL(ctx.app.domainName);
  url.pathname = '/password/confirm-reset';
  url.searchParams.set('code', resetCode);

  await notify.sendPasswordReminder(email, url.toString());

  template.title = 'Password reset successfully requested';
  const successPage = <PasswordResetSuccess
    title="Password reset successfully requested"
    message="You should receive an email shortly with further instructions."
  />;

  return {
    body: template.render(successPage),
  };
}

export async function resetPasswordProvideNew(ctx: IContext, params: IParameters): Promise<IResponse> {
  if (!params.code) {
    throw new NotFoundError('Invalid password reset token.');
  }

  const template = new Template(ctx.viewContext, 'Password reset');

  return await Promise.resolve({
    body: template.render(<PasswordResetSetPasswordForm csrf={ctx.viewContext.csrf} code={params.code} />),
  });
}

export function checkPasswordAgainstPolicy(pw: string): { valid: boolean; message?: string } {
  if (pw.length < 12) {
    return {
      valid: false,
      message: 'Your password should be 12 characters or more',
    }
  }

  if (!pw.match(/[a-z]/)) {
    return {
      valid: false,
      message: 'Your password should contain a lowercase character',
    }
  }

  if (!pw.match(/[A-Z]/)) {
    return {
      valid: false,
      message: 'Your password should contain an uppercase character',
    }
  }

  if (!pw.match(/[0-9]/)) {
    return {
      valid: false,
      message: 'Your password should contain a number',
    }
  }

  if (!pw.match(/[-_+:;<>[\]()#@£%^&!$/]/)) {
    return {
      valid: false,
      message: 'Your password should contain a special character',
    }
  }

  return { valid: true };
}

export async function resetPassword(ctx: IContext, _params: IParameters, body: INewPasswordBody): Promise<IResponse> {
  if (!body.code) {
    throw new NotFoundError('Invalid password reset token.');
  }

  const template = new Template(ctx.viewContext, 'Password reset');

  if (body.password !== body.passwordConfirmation) {
    template.title = 'Error: Password reset';

    return {
      body: template.render(<PasswordResetSetPasswordForm
        csrf={ctx.viewContext.csrf}
        code={body.code}
        passwordMismatch={true}
      />),
      status: 400,
    };
  }

  const { valid, message } = checkPasswordAgainstPolicy(body.password);
  if (!valid) {
    template.title = 'Error: Password reset';

    return {
      body: template.render(<PasswordResetSetPasswordForm
        csrf={ctx.viewContext.csrf}
        code={body.code}
        passwordDoesNotMeetPolicy={true}
        passwordDoesNotMeetPolicyMessage={message}
      />),
      status: 400,
    };
  }

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  await uaa.resetPassword(body.code, body.password);

  return {
    body: template.render(<PasswordResetSuccess
      title="Password successfully reset"
      message="You may now log in with the use of your email and password."
    />),
  };
}
