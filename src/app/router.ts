import { IParameters } from '../lib/router';
import Router from '../lib/router/router';

import * as applications from '../applications';
import * as organizations from '../organizations';
import * as services from '../services';
import * as spaces from '../spaces';
import * as statement from '../statement';
import * as users from '../users';
import { IContext } from './context';

const router = new Router([
  {
    action: async (ctx: IContext, _params: IParameters) => ({
      redirect: ctx.linkTo('admin.organizations'),
    }),
    name: 'admin.home',
    path: '/',
  },
  {
    action: organizations.listOrganizations,
    name: 'admin.organizations',
    path: '/organisations',
  },
  {
    action: spaces.listSpaces,
    name: 'admin.organizations.view',
    path: '/organisations/:organizationGUID',
  },
  {
    action: spaces.listApplications,
    name: 'admin.organizations.spaces.applications.list',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/applications',
  },
  {
    action: spaces.listBackingServices,
    name: 'admin.organizations.spaces.services.list',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services',
  },
  {
    action: applications.viewApplication,
    name: 'admin.organizations.spaces.applications.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/applications/:applicationGUID',
  },
  {
    action: services.viewService,
    name: 'admin.organizations.spaces.services.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID',
  },
  {
    action: users.listUsers,
    name: 'admin.organizations.users',
    path: '/organisations/:organizationGUID/users',
  },
  {
    action: users.inviteUserForm,
    name: 'admin.organizations.users.invite',
    path: '/organisations/:organizationGUID/users/invite',
  },
  {
    action: users.inviteUser,
    method: 'post',
    name: 'admin.organizations.users.invite.process',
    path: '/organisations/:organizationGUID/users/invite',
  },
  {
    action: users.editUser,
    name: 'admin.organizations.users.edit',
    path: '/organisations/:organizationGUID/users/:userGUID',
  },
  {
    action: users.updateUser,
    method: 'post',
    name: 'admin.organizations.users.update',
    path: '/organisations/:organizationGUID/users/:userGUID',
  },
  {
    action: users.confirmDeletion,
    name: 'admin.organizations.users.delete',
    path: '/organisations/:organizationGUID/users/:userGUID/delete',
  },
  {
    action: users.deleteUser,
    method: 'post',
    name: 'admin.organizations.users.delete.process',
    path: '/organisations/:organizationGUID/users/:userGUID/delete',
  },
  {
    action: statement.viewStatement,
    name: 'admin.statement.view',
    path: '/organisations/:organizationGUID/statements/:rangeStart',
  },
]);

export default router;
