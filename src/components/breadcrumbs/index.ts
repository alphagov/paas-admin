import {IOrganization} from '../../lib/cf/types';

import {IContext} from '../app/context';

export interface IBreadcrumb {
  readonly href?: string;
  readonly text: string;
}

export function fromOrg(
  ctx: IContext,
  organization: IOrganization,
  children: ReadonlyArray<IBreadcrumb>,
): ReadonlyArray<IBreadcrumb> {
  return [
    { text: 'Organisations', href: ctx.linkTo('admin.organizations') },
    {
      text: organization.entity.name ,
      href: ctx.linkTo('admin.organizations.view', {organizationGUID: organization.metadata.guid}),
    },
    ...children,
  ];
}
