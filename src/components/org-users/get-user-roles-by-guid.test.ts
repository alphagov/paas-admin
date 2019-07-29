import jwt from 'jsonwebtoken';
import nock from 'nock';

import * as orgUsers from '.';

import {AccountsClient} from '../../lib/accounts';

import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';
import {Token} from '../auth';

const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {user_id: 'uaa-id-253', scope: [], origin: 'uaa', exp: (time + (24 * 60 * 60))};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = createTestContext({
  token: new Token(accessToken, [tokenKey]),
});

describe('_getUserRolesByGuid', () => {
  let nockAccounts: nock.Scope;

  beforeEach(() => {
    nockAccounts = nock(ctx.app.accountsAPI).persist();

    nockAccounts
      .get('/users/some-user-guid-0').reply(200, JSON.stringify({
      user_uuid: 'some-user-guid-0',
      user_email: 'some-user-guid-0@fake.digital.cabinet-office.gov.uk',
      username: 'some-fake-username-from-paas-accounts',
    }))
      .get('/users/some-user-guid-1').reply(404)
      .get('/users/some-user-guid-2').reply(404);
  });

  it('should return an empty map if there are no users', async () => {
    const userOrgRoles: any = [];
    const spaceUserLists: any = [];

    const accountsClient = new AccountsClient({
      apiEndpoint: ctx.app.accountsAPI,
      secret: ctx.app.accountsSecret,
      logger: ctx.app.logger,
    });

    const result = await orgUsers._getUserRolesByGuid(userOrgRoles, spaceUserLists, accountsClient);
    expect(result).toEqual({});
  });

  it('should return org roles of a user that has no space access', async () => {
    const userOrgRoles: any = [
      {
        metadata: {guid: 'some-user-guid'},
        entity: {organization_roles: ['org_manager'], username: 'some-user-name'},
      },
    ];
    const spaceUserLists: any = [];

    const accountsClient = new AccountsClient({
      apiEndpoint: ctx.app.accountsAPI,
      secret: ctx.app.accountsSecret,
      logger: ctx.app.logger,
    });

    const result = await orgUsers._getUserRolesByGuid(userOrgRoles, spaceUserLists, accountsClient);
    expect(result).toEqual({
      'some-user-guid': {
        orgRoles: ['org_manager'],
        username: 'some-user-name',
        spaces: [],
      },
    });
  });

  it('should return roles and space of a user that has access to one space', async () => {
    const userOrgRoles: any = [
      {
        metadata: {guid: 'some-user-guid'},
        entity: {organization_roles: ['org_manager'], username: 'some-user-name'},
      },
    ];

    const space = {metadata: {guid: 'some-space-guid'}} as any;
    const user = {metadata: {guid: 'some-user-guid'}} as any;

    const spaceUserLists = [{
      space,
      users: [user],
    }];

    const accountsClient = new AccountsClient({
      apiEndpoint: ctx.app.accountsAPI,
      secret: ctx.app.accountsSecret,
      logger: ctx.app.logger,
    });

    const result = await orgUsers._getUserRolesByGuid(userOrgRoles, spaceUserLists, accountsClient);
    expect(result).toEqual({
      'some-user-guid': {
        orgRoles: ['org_manager'],
        username: 'some-user-name',
        spaces: [space],
      },
    });
  });

  it('should return roles and spaces of a user that has access to multiple spaces', async () => {
    const userOrgRoles: any = [
      {
        metadata: {guid: 'some-user-guid'},
        entity: {organization_roles: ['org_manager'], username: 'some-user-name'},
      },
    ];

    const spaces = [1, 2, 3].map(i => ({metadata: {guid: `some-space-guid-${i}`}})) as any[];
    const user = {metadata: {guid: 'some-user-guid'}} as any;

    const spaceUserLists = spaces.map(space => ({
      space,
      users: [user],
    }));

    const accountsClient = new AccountsClient({
      apiEndpoint: ctx.app.accountsAPI,
      secret: ctx.app.accountsSecret,
      logger: ctx.app.logger,
    });

    const result = await orgUsers._getUserRolesByGuid(userOrgRoles, spaceUserLists, accountsClient);
    expect(result).toEqual({
      'some-user-guid': {
        orgRoles: ['org_manager'],
        username: 'some-user-name',
        spaces,
      },
    });
  });

  it('should return users, roles and spaces of multiple users', async () => {
    const userOrgRoles: any = [0, 1, 2].map(i => (
      {
        metadata: {guid: `some-user-guid-${i}`},
        entity: {organization_roles: ['org_manager'], username: `some-user-name-${i}`},
      }
    ));

    const space: any = (i: number) => ({metadata: {guid: `some-space-guid-${i}`}});
    const user: any = (i: number) => ({metadata: {guid: `some-user-guid-${i}`}});

    const spaceUserLists = [
      {space: space(0), users: [user(0), user(1)]},
      {space: space(1), users: [user(1), user(2)]},
      {space: space(2), users: [user(0), user(1), user(2)]},
    ];

    const accountsClient = new AccountsClient({
      apiEndpoint: ctx.app.accountsAPI,
      secret: ctx.app.accountsSecret,
      logger: ctx.app.logger,
    });

    const result = await orgUsers._getUserRolesByGuid(userOrgRoles, spaceUserLists, accountsClient);
    expect(result).toEqual({
      'some-user-guid-0': {
        orgRoles: ['org_manager'],
        username: 'some-fake-username-from-paas-accounts',
        spaces: [space(0), space(2)],
      },
      'some-user-guid-1': {
        orgRoles: ['org_manager'],
        username: 'some-user-name-1',
        spaces: [space(0), space(1), space(2)],
      },
      'some-user-guid-2': {
        orgRoles: ['org_manager'],
        username: 'some-user-name-2',
        spaces: [space(1), space(2)],
      },
    });
  });

  it('should get the user\'s username from accounts, falling back to UAA', async () => {
    const userOrgRoles: any = [0, 1].map(i => (
      {
        metadata: {guid: `some-user-guid-${i}`},
        entity: {organization_roles: ['org_manager'], username: `some-user-name-${i}`},
      }
    ));

    const space: any = (i: number) => ({metadata: {guid: `some-space-guid-${i}`}});
    const user: any = (i: number) => ({metadata: {guid: `some-user-guid-${i}`}});

    const spaceUserLists = [
      {space: space(0), users: [user(0), user(1)]},
    ];

    const accountsClient = new AccountsClient({
      apiEndpoint: ctx.app.accountsAPI,
      secret: ctx.app.accountsSecret,
      logger: ctx.app.logger,
    });

    const result = await orgUsers._getUserRolesByGuid(userOrgRoles, spaceUserLists, accountsClient);
    expect(result).toMatchObject({
      'some-user-guid-0': {
        username: 'some-fake-username-from-paas-accounts',
      },
      'some-user-guid-1': {
        username: 'some-user-name-1',
      },
    });
  });
});
