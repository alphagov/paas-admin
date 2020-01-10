import { IOrganization } from '../../lib/cf/types';
import { IContext } from '../app';
import { IBreadcrumbsItem } from './views';

export function fromOrg(
  ctx: IContext,
  organization: IOrganization,
  children: ReadonlyArray<IBreadcrumbsItem>,
): ReadonlyArray<IBreadcrumbsItem> {
  return [
    { text: 'Organisations', href: ctx.linkTo('admin.organizations') },
    {
      text: organization.entity.name ,
      href: ctx.linkTo('admin.organizations.view', {organizationGUID: organization.metadata.guid}),
    },
    ...children,
  ];
}
