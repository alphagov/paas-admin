import Router, { IParameters } from '../../lib/router';

import * as account from '../account';
import * as applicationEvents from '../application-events';
import * as applications from '../applications';
import * as orgUsers from '../org-users';
import * as organizations from '../organizations';
import * as platformAdmin from '../platform-admin';
import * as reports from '../reports';
import * as serviceEvents from '../service-events';
import * as serviceMetrics from '../service-metrics';
import * as services from '../services';
import * as spaces from '../spaces';
import * as statements from '../statements';
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
    action: spaces.viewSpaceEvents,
    name: 'admin.organizations.spaces.events.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/events',
  },
  {
    action: spaces.viewSpaceEvent,
    name: 'admin.organizations.spaces.event.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/events/:eventGUID',
  },
  {
    action: applications.viewApplication,
    name: 'admin.organizations.spaces.applications.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/applications/:applicationGUID',
  },
  {
    action: applicationEvents.viewApplicationEvents,
    name: 'admin.organizations.spaces.applications.events.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/applications/:applicationGUID/events',
  },
  {
    action: applicationEvents.viewApplicationEvent,
    name: 'admin.organizations.spaces.applications.event.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/applications/:applicationGUID/events/:eventGUID',
  },
  {
    action: services.viewService,
    name: 'admin.organizations.spaces.services.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID',
  },
  {
    action: serviceMetrics.viewServiceMetrics,
    name: 'admin.organizations.spaces.services.metrics.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/metrics',
  },
  {
    action: serviceMetrics.downloadServiceMetrics,
    name: 'admin.organizations.spaces.services.metrics.download',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/metrics/download',
  },
  {
    action: serviceMetrics.resolveServiceMetrics,
    name: 'admin.organizations.spaces.services.metrics.redirect',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/metrics/:offset',
  },
  {
    action: serviceEvents.viewServiceEvents,
    name: 'admin.organizations.spaces.services.events.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/events',
  },
  {
    action: serviceEvents.viewServiceEvent,
    name: 'admin.organizations.spaces.services.event.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/events/:eventGUID',
  },
  {
    action: orgUsers.listUsers,
    name: 'admin.organizations.users',
    path: '/organisations/:organizationGUID/users',
  },
  {
    action: orgUsers.inviteUserForm,
    name: 'admin.organizations.users.invite',
    path: '/organisations/:organizationGUID/users/invite',
  },
  {
    action: orgUsers.inviteUser,
    method: 'post',
    name: 'admin.organizations.users.invite.process',
    path: '/organisations/:organizationGUID/users/invite',
  },
  {
    action: orgUsers.editUser,
    name: 'admin.organizations.users.edit',
    path: '/organisations/:organizationGUID/users/:userGUID',
  },
  {
    action: orgUsers.updateUser,
    method: 'post',
    name: 'admin.organizations.users.update',
    path: '/organisations/:organizationGUID/users/:userGUID',
  },
  {
    action: orgUsers.confirmDeletion,
    name: 'admin.organizations.users.delete',
    path: '/organisations/:organizationGUID/users/:userGUID/delete',
  },
  {
    action: orgUsers.deleteUser,
    method: 'post',
    name: 'admin.organizations.users.delete.process',
    path: '/organisations/:organizationGUID/users/:userGUID/delete',
  },
  {
    action: orgUsers.resendInvitation,
    method: 'post',
    name: 'admin.organizations.users.invite.resend',
    path: '/organisations/:organizationGUID/users/:userGUID/invite',
  },
  {
    action: statements.downloadCSV,
    name: 'admin.statement.download',
    path: '/organisations/:organizationGUID/statements/:rangeStart/download',
  },
  {
    action: statements.viewStatement,
    name: 'admin.statement.view',
    path: '/organisations/:organizationGUID/statements/:rangeStart',
  },
  {
    action: statements.statementRedirection,
    name: 'admin.statement.dispatcher',
    path: '/organisations/:organizationGUID/statements',
  },
  {
    action: reports.viewOrganizationsReport,
    name: 'admin.reports.organizations',
    path: '/reports/organisations',
  },
  {
    action: reports.viewCostReport,
    name: 'admin.reports.cost',
    path: '/reports/cost/:rangeStart',
  },
  {
    action: reports.viewCostByServiceReport,
    name: 'admin.reports.costbyservice',
    path: '/reports/cost-by-service/:rangeStart',
  },
  {
    action: reports.viewPmoOrgSpendReportCSV,
    name: 'admin.reports.pmo-org-spend-csv',
    path: '/reports/pmo-org-spend/:rangeStart',
  },
  {
    action: reports.viewVisualisation,
    name: 'admin.reports.visualisation',
    path: '/reports/visualisation/:rangeStart',
  },
  {
    action: account.getUseGoogleSSO,
    name: 'account.use-google-sso.view',
    path: '/my-account/use-google-sso',
  },
  {
    action: account.postUseGoogleSSO,
    name: 'account.use-google-sso.post',
    method: 'post',
    path: '/my-account/use-google-sso',
  },
  {
    action: account.getGoogleOIDCCallback,
    name: 'account.use-google-sso-callback.get',
    path: '/my-account/use-google-sso/callback',
  },
  {
    action: account.getUseMicrosoftSSO,
    name: 'account.use-microsoft-sso.view',
    path: '/my-account/use-microsoft-sso',
  },
  {
    action: account.postUseMicrosoftSSO,
    name: 'account.use-microsoft-sso.post',
    method: 'post',
    path: '/my-account/use-microsoft-sso',
  },
  {
    action: account.getMicrosoftOIDCCallback,
    name: 'account.use-microsoft-sso-callback.get',
    path: '/my-account/use-microsoft-sso/callback',
  },
  {
    action: users.getUser,
    name: 'users.get',
    path: '/users/:emailOrUserGUID',
  },
  {
    action: platformAdmin.viewHomepage,
    name: 'platform-admin.homepage',
    path: '/platform-admin',
  },
  {
    action: platformAdmin.redirectToPage,
    method: 'post',
    name: 'platform-admin.redirect',
    path: '/platform-admin',
  },
]);

export default router;
