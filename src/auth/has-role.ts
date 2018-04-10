import { IContext } from '../app/context';
import { IOrganizationUserRoles, OrganizationUserRoles } from '../cf/types';

interface IConfig {
  readonly organizationGUID: string;
  readonly role: OrganizationUserRoles;
  readonly adminWrite: boolean;
}

export async function hasOrgRole(ctx: IContext, config: IConfig): Promise<boolean> {
  const users = await ctx.cf.usersForOrganization(config.organizationGUID);
  const user = users.find((u: IOrganizationUserRoles) => u.metadata.guid === ctx.rawToken.user_id);

  return hasAdminAccess(ctx.rawToken.scope, config.adminWrite)
    || (user !== undefined && user.entity.organization_roles.includes(config.role));
}

function hasAdminAccess(scopes: ReadonlyArray<string>, write: boolean): boolean {
  return write ?
    scopes.includes('cloud_controller.admin') :
    scopes.some((scope: string) => [
      'cloud_controller.admin',
      'cloud_controller.admin_read_only',
      'cloud_controller.global_auditor',
    ].includes(scope));
}
