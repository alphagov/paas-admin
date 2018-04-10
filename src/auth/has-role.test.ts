import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import CloudFoundryClient from '../cf';
import UAAClient from '../uaa';

import { hasOrgRole } from '.';
import { IContext } from '../app/context';
import NotificationClient from '../notify';

interface IUser {
  readonly metadata: {
    readonly guid: string;
  };
  readonly entity: {
    readonly admin: boolean;
    readonly organization_roles: ReadonlyArray<string>;
  };
  readonly token: {
    readonly user_id: string;
    readonly scope: ReadonlyArray<string>;
    readonly exp: number;
  };
}

const tokenKey = 'secret';
const time = Math.floor(Date.now() / 1000);

const unauthorisedUser = {
  metadata: {
    guid: 'unauthorised-user-123',
  },
  entity: {
    admin: false,
    organization_roles: ['org_user'],
  },
  token: {user_id: 'unauthorised-user-123', scope: [], exp: (time + (24 * 60 * 60))},
};

const managerUser = {
  metadata: {
    guid: 'manager-user-123',
  },
  entity: {
    admin: false,
    organization_roles: ['org_manager'],
  },
  token: {user_id: 'manager-user-123', scope: [], exp: (time + (24 * 60 * 60))},
};

const adminUser = {
  metadata: {
    guid: 'admin-user-123',
  },
  entity: {
    admin: true,
    organization_roles: [],
  },
  token: {
    user_id: 'admin-user-123',
    scope: ['cloud_controller.admin'],
    exp: (time + (24 * 60 * 60)),
  },
};

nock('https://example.com/api').persist()
  .get('/v2/organizations/organization-000/user_roles').reply(200, {resources: []})
  .get('/v2/organizations/organization-123/user_roles').reply(200, {resources: [unauthorisedUser]})
  .get('/v2/organizations/organization-231/user_roles').reply(200, {resources: [managerUser]})
  .get('/v2/organizations/organization-321/user_roles').reply(200, {resources: [adminUser]});

function setupContext(user: IUser): IContext {
  const token = jwt.sign(user.token, tokenKey);

  return {
    cf: new CloudFoundryClient({
      apiEndpoint: 'https://example.com/api',
      accessToken: token,
    }),
    routePartOf: () => false,
    linkTo: () => '__LINKED_TO__',
    log: pino({level: 'silent'}),
    notify: new NotificationClient({apiKey: '__NOTIFY_KEY__', templates: {}}),
    rawToken: user.token,
    uaa: new UAAClient({
      apiEndpoint: 'https://example.com/uaa',
      clientCredentials: {
        clientID: '__client_id__',
        clientSecret: '__client_secret__',
      },
    }),
  };
}

test('should be falsy for unauthorised user', async t => {
  t.notOk(await hasOrgRole(setupContext(unauthorisedUser), {
    organizationGUID: 'organization-123',
    role: 'org_manager',
    adminWrite: false,
  }));
});

test('should be falsy if user not in the list at all', async t => {
  t.notOk(await hasOrgRole(setupContext(unauthorisedUser), {
    organizationGUID: 'organization-000',
    role: 'org_manager',
    adminWrite: false,
  }));
});

test('should be truly if user is manager', async t => {
  t.ok(await hasOrgRole(setupContext(managerUser), {
    organizationGUID: 'organization-231',
    role: 'org_manager',
    adminWrite: false,
  }));
});

test('should be truly despite the lack of `org_manager` role if user is admin', async t => {
  t.ok(await hasOrgRole(setupContext(adminUser), {
    organizationGUID: 'organization-321',
    role: 'org_manager',
    adminWrite: false,
  }));
});

test('should be truly despite the lack of `org_manager` role if user is admin with write restriction', async t => {
  t.ok(await hasOrgRole(setupContext(adminUser), {
    organizationGUID: 'organization-321',
    role: 'org_manager',
    adminWrite: true,
  }));
});
