import Router, { IParameters, IResponse } from '../../lib/router';
import * as account from '../account';
import * as applicationEvents from '../application-events';
import * as applications from '../applications';
import * as marketplace from '../marketplace';
import * as orgUsers from '../org-users';
import * as organizations from '../organizations';
import * as platformAdmin from '../platform-admin';
import * as reports from '../reports';
import * as serviceEvents from '../service-events';
import * as serviceMetrics from '../service-metrics';
import * as services from '../services';
import * as spaces from '../spaces';
import * as statements from '../statements';
import * as support from '../support';
import * as users from '../users';

import { IContext } from './context';

export const router = new Router([
  {
    action: async (ctx: IContext, _params: IParameters): Promise<IResponse> => await Promise.resolve({
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
    action: organizations.editOrgQuota,
    name: 'admin.organizations.quota.edit',
    path: '/organisations/:organizationGUID/quota',
  },
  {
    action: organizations.updateOrgQuota,
    method: 'post',
    name: 'admin.organizations.quota.update',
    path: '/organisations/:organizationGUID/quota',
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
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/events/:eventGUID',
  },
  {
    action: applications.viewApplication,
    name: 'admin.organizations.spaces.applications.view',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/applications/:applicationGUID',
  },
  {
    action: applicationEvents.viewApplicationEvents,
    name: 'admin.organizations.spaces.applications.events.view',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/applications/:applicationGUID/events',
  },
  {
    action: applicationEvents.viewApplicationEvent,
    name: 'admin.organizations.spaces.applications.event.view',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/applications/:applicationGUID/events/:eventGUID',
  },
  {
    action: services.viewService,
    name: 'admin.organizations.spaces.services.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID',
  },
  {
    action: serviceMetrics.viewServiceMetrics,
    name: 'admin.organizations.spaces.services.metrics.view',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/metrics',
  },
  {
    action: serviceMetrics.downloadServiceMetrics,
    name: 'admin.organizations.spaces.services.metrics.download',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/metrics/download',
  },
  {
    action: serviceMetrics.resolveServiceMetrics,
    name: 'admin.organizations.spaces.services.metrics.redirect',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/metrics/:offset',
  },
  {
    action: serviceEvents.viewServiceEvents,
    name: 'admin.organizations.spaces.services.events.view',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/events',
  },
  {
    action: serviceEvents.viewServiceEvent,
    name: 'admin.organizations.spaces.services.event.view',
    path:
      '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/events/:eventGUID',
  },
  {
    action: services.listServiceLogs,
    name: 'admin.organizations.spaces.services.logs.view',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/logs',
  },
  {
    action: services.downloadServiceLogs,
    name: 'admin.organizations.spaces.services.logs.download',
    path: '/organisations/:organizationGUID/spaces/:spaceGUID/services/:serviceGUID/logs/download',
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
    method: 'post',
    name: 'account.use-google-sso.post',
    path: '/my-account/use-google-sso',
  },
  {
    action: account.getGoogleOIDCCallback,
    name: 'account.use-google-sso-callback.get',
    path: '/my-account/use-google-sso/callback',
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
  {
    action: platformAdmin.createOrganizationForm,
    name: 'platform-admin.create-organization.form',
    path: '/platform-admin/create-org',
  },
  {
    action: platformAdmin.createOrganization,
    method: 'post',
    name: 'platform-admin.create-organization',
    path: '/platform-admin/create-org',
  },
  {
    action: marketplace.listServices,
    name: 'marketplace.view',
    path: '/marketplace',
  },
  {
    action: marketplace.viewService,
    name: 'marketplace.service',
    path: '/marketplace/:serviceGUID',
  },
  {
    action: users.resetPasswordRequestToken,
    name: 'users.password.request.form',
    path: '/password/request-reset',
  },
  {
    action: users.resetPasswordObtainToken,
    method: 'post',
    name: 'users.password.request',
    path: '/password/request-reset',
  },
  {
    action: users.resetPasswordProvideNew,
    name: 'users.password.reset.form',
    path: '/password/confirm-reset',
  },
  {
    action: users.resetPassword,
    method: 'post',
    name: 'users.password.reset',
    path: '/password/confirm-reset',
  },
  {
    action: support.SupportSelectionForm,
    name: 'support.selection',
    path: '/support',
  },
  {
    action: support.HandleSupportSelectionFormPost,
    method: 'post',
    name: 'support.selection.post',
    path: '/support',
  },
  {
    action: support.SomethingWrongWithServiceForm,
    name: 'support.something-wrong-with-service',
    path: '/support/something-wrong-with-service',
  },
  {
    action: support.HandleSomethingWrongWithServiceFormPost,
    method: 'post',
    name: 'support.something-wrong-with-service.post',
    path: '/support/something-wrong-with-service',
  },
  {
    action: support.HelpUsingPaasForm,
    name: 'support.help-using-paas',
    path: '/support/help-using-paas',
  },
  {
    action: support.HandleHelpUsingPaasFormPost,
    method: 'post',
    name: 'support.help-using-paas.post',
    path: 'support/help-using-paas',
  },
  {
    action: support.FindOutMoreForm,
    name: 'support.find-out-more',
    path: '/support/find-out-more',
  },
  {
    action: support.HandleFindOutMoreFormPost,
    method: 'post',
    name: 'support.find-out-more.post',
    path: '/support/find-out-more',
  },
  {
    action: support.ContactUsForm,
    name: 'support.contact-us',
    path: '/support/contact-us',
  },
  {
    action: support.HandleContactUsFormPost,
    method: 'post',
    name: 'support.contact-us.post',
    path: '/support/contact-us',
  },
  {
    action: support.RequestAnAccountForm,
    name: 'support.request-an-account',
    path: '/support/request-an-account',
  },
  {
    action: support.JoiningExistingOrganisationNotice,
    name: 'support.existing-organisation',
    path: '/support/request-an-account/existing-organisation',
  },
  {
    action: support.SignupForm,
    name: 'support.sign-up',
    path: '/support/sign-up',
  },
  {
    action: support.HandleSignupFormPost,
    method: 'post',
    name: 'support.sign-up.post',
    path: '/support/sign-up',
  },
  {
    action: support.handleStaticIPs,
    name: 'support.static-ips',
    path: '/support/static-ip',
  },
  {
    action: support.handleCrownMoU,
    name: 'support.mou.crown',
    path: '/support/mou-crown',
  },
  {
    action: support.handleNonCrownMoU,
    name: 'support.mou.non-crown',
    path: '/support/mou-non-crown',
  },
]);

export default router;
