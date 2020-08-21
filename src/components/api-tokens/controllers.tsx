import React from 'react';

import { SLUG_REGEX, Template } from '../../layouts';
import CloudFoundryClient from '../../lib/cf';
import { IParameters, IResponse, NotFoundError } from '../../lib/router';
import UAAClient from '../../lib/uaa';
import { IContext } from '../app';
import { CLOUD_CONTROLLER_ADMIN } from '../auth';
import { fromOrg } from '../breadcrumbs';
import { SuccessPage } from '../shared';

import { generateKey, generateSecret } from './token';
import { ConfirmAction, CreateAPIToken, ExposeSecret, ListTokens } from './views';

interface ICreateUserBody {
  readonly name: string;
}

async function checkIfAuthorised(ctx: IContext, cf: CloudFoundryClient, organizationGUID: string): Promise<void> {
  const isAdmin = ctx.token.hasAnyScope(CLOUD_CONTROLLER_ADMIN);
  const isManager = await cf.hasOrganizationRole(organizationGUID, ctx.token.userID, 'org_manager');

  if (!isAdmin && !isManager) {
    throw new NotFoundError('not found');
  }
}

export function isTokenUser(organizationName: string, name: string): boolean {
  const regex = /^.+?-[a-z0-9]{8}$/;

  return name.startsWith(organizationName) && regex.test(name);
}

function tokenName(organization: string, name: string): string {
  return name.replace(`${organization}-`, '').slice(0, -9);
}

export async function list(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const organization = await cf.organization(params.organizationGUID);

  await checkIfAuthorised(ctx, cf, organization.metadata.guid);

  const users = await cf.usersForOrganization(organization.metadata.guid);
  const tokens = users.filter(user => isTokenUser(organization.entity.name, user.entity.username));

  const template = new Template(ctx.viewContext, 'API Tokens');
  template.breadcrumbs = fromOrg(ctx, organization, [
    { text: 'API Tokens' },
  ]);

  return {
    body: template.render(
      <ListTokens
        linkTo={ctx.linkTo}
        organization={organization}
        tokens={tokens}
      />,
    ),
  };
}

export async function confirmRevocation(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const organization = await cf.organization(params.organizationGUID);

  await checkIfAuthorised(ctx, cf, organization.metadata.guid);

  const token = await uaa.getUser(params.tokenGUID);
  if (!token || !isTokenUser(organization.entity.name, token.userName)) {
    throw new NotFoundError('token not found');
  }

  const template = new Template(ctx.viewContext, 'Are you sure you\'d like to revoke the following API Token?');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.tokens.list', { organizationGUID: organization.metadata.guid }),
      text: 'API Tokens',
    },
    { text: tokenName(organization.entity.name, token.userName) },
  ]);

  return {
    body: template.render(
      <ConfirmAction
        action="revoke"
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        organization={organization}
        token={token}
      />,
    ),
  };
}

export async function revoke(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const organization = await cf.organization(params.organizationGUID);

  await checkIfAuthorised(ctx, cf, organization.metadata.guid);

  const token = await uaa.getUser(params.tokenGUID);
  if (!token || !isTokenUser(organization.entity.name, token.userName)) {
    throw new NotFoundError('token not found');
  }

  await cf.setOrganizationRole(organization.metadata.guid, token.id, 'users', false);

  const template = new Template(ctx.viewContext, 'Successfully revoked an API Token');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.tokens.list', { organizationGUID: organization.metadata.guid }),
      text: 'API Tokens',
    },
    { text: 'Revoke API Token' },
  ]);

  return {
    body: template.render(
      <SuccessPage
        heading="Successfully revoked an API Token"
      />,
    ),
  };
}

export async function compose(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const organization = await cf.organization(params.organizationGUID);

  await checkIfAuthorised(ctx, cf, organization.metadata.guid);

  const template = new Template(ctx.viewContext, 'Create new API Token');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.tokens.list', { organizationGUID: organization.metadata.guid }),
      text: 'API Tokens',
    },
    { text: 'Create API Token' },
  ]);

  return {
    body: template.render(
      <CreateAPIToken
        csrf={ctx.viewContext.csrf}
        organization={organization}
      />,
    ),
  };
}

export async function create(ctx: IContext, params: IParameters, body: ICreateUserBody): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const organization = await cf.organization(params.organizationGUID);

  await checkIfAuthorised(ctx, cf, organization.metadata.guid);

  if (!body.name || !body.name.match(SLUG_REGEX)) {
    const template = new Template(ctx.viewContext, 'Error: Create new API Token');
    template.breadcrumbs = fromOrg(ctx, organization, [
      {
        href: ctx.linkTo('admin.organizations.tokens.list', { organizationGUID: organization.metadata.guid }),
        text: 'API Tokens',
      },
      { text: 'Create API Token' },
    ]);

    return {
      body: template.render(
        <CreateAPIToken
          csrf={ctx.viewContext.csrf}
          error={true}
          organization={organization}
          values={body}
        />,
      ),
      status: 400,
    };
  }

  const tokenKey = generateKey(organization.entity.name, body.name);
  const tokenSecret = generateSecret();

  const uaaUser = await uaa.createUser(tokenKey, tokenSecret);
  const user = await cf.createUser(uaaUser.id);
  await cf.assignUserToOrganization(organization.metadata.guid, user.metadata.guid);

  const template = new Template(ctx.viewContext, 'Successfully generted token secret');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.tokens.list', { organizationGUID: organization.metadata.guid }),
      text: 'API Tokens',
    },
    { text: tokenName(organization.entity.name, tokenKey) },
  ]);

  return {
    body: template.render(
      <ExposeSecret
        linkTo={ctx.linkTo}
        organization={organization}
        tokenKey={tokenKey}
        tokenSecret={tokenSecret}
        userGUID={user.metadata.guid}
      />,
    ),
  };
}

export async function confirmRotation(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const organization = await cf.organization(params.organizationGUID);

  await checkIfAuthorised(ctx, cf, organization.metadata.guid);

  const token = await uaa.getUser(params.tokenGUID);
  if (!token || !isTokenUser(organization.entity.name, token.userName)) {
    throw new NotFoundError('token not found');
  }

  const template = new Template(ctx.viewContext, 'Are you sure you\'d like to rotate the following API Token?');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.tokens.list', { organizationGUID: organization.metadata.guid }),
      text: 'API Tokens',
    },
    { text: tokenName(organization.entity.name, token.userName) },
  ]);

  return {
    body: template.render(
      <ConfirmAction
        action="rotate"
        csrf={ctx.viewContext.csrf}
        linkTo={ctx.linkTo}
        organization={organization}
        token={token}
      />,
    ),
  };
}

export async function rotate(ctx: IContext, params: IParameters): Promise<IResponse> {
  const cf = new CloudFoundryClient({
    accessToken: ctx.token.accessToken,
    apiEndpoint: ctx.app.cloudFoundryAPI,
    logger: ctx.app.logger,
  });

  const uaa = new UAAClient({
    apiEndpoint: ctx.app.uaaAPI,
    clientCredentials: {
      clientID: ctx.app.oauthClientID,
      clientSecret: ctx.app.oauthClientSecret,
    },
  });

  const organization = await cf.organization(params.organizationGUID);

  await checkIfAuthorised(ctx, cf, organization.metadata.guid);

  const token = await uaa.getUser(params.tokenGUID);
  if (!token || !isTokenUser(organization.entity.name, token.userName)) {
    throw new NotFoundError('token not found');
  }

  const tokenSecret = generateSecret();
  await uaa.forceSetPassword(token.id, tokenSecret);

  const template = new Template(ctx.viewContext, 'Successfully generted token secret');
  template.breadcrumbs = fromOrg(ctx, organization, [
    {
      href: ctx.linkTo('admin.organizations.tokens.list', { organizationGUID: organization.metadata.guid }),
      text: 'API Tokens',
    },
    { text: tokenName(organization.entity.name, token.userName) },
  ]);

  return {
    body: template.render(
      <ExposeSecret
        linkTo={ctx.linkTo}
        organization={organization}
        tokenKey={token.userName}
        tokenSecret={tokenSecret}
        userGUID={token.id}
      />,
    ),
  };
}
