import {syncMiddleware} from '../app/sync-handler';
import {pageNotFoundMiddleware} from '../errors';

export function requireOrgRole(role, adminWrite = false) {
  return syncMiddleware(async (req, res, next) => {
    if (!req.params.organization) {
      throw new TypeError('requireOrgRole: needs to be used with `organization` parameter');
    }

    const setup = {
      organizationGUID: req.params.organization,
      rawAccessToken: req.rawToken,
      role,
      adminWrite
    };

    if (!(await hasOrgRole(req.cf, setup))) {
      return pageNotFoundMiddleware(req, res);
    }

    next();
  });
}

export async function hasOrgRole(client, {organizationGUID, rawAccessToken, role, adminWrite}) {
  const users = await client.usersForOrganization(organizationGUID);
  const user = users.find(user => user.metadata.guid === rawAccessToken.user_id); // eslint-disable-line camelcase

  return hasAdminAccess(rawAccessToken.scope, adminWrite) || (user && user.entity.organization_roles.includes(role));
}

function hasAdminAccess(scopes, write) {
  return write ?
    scopes.includes('cloud_controller.admin') :
    scopes.some(scope => [
      'cloud_controller.admin',
      'cloud_controller.admin_read_only',
      'cloud_controller.global_auditor'
    ].includes(scope));
}
