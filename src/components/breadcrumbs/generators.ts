import { IContext } from '../app';

import { IBreadcrumbsItem } from './views';

export interface IOrganizationSkeleton {
  readonly metadata: {
    readonly guid: string;
  };
  readonly entity: {
    readonly name: string;
  };
}

export function fromOrg(
  ctx: IContext,
  organization: IOrganizationSkeleton,
  children: ReadonlyArray<IBreadcrumbsItem>,
): ReadonlyArray<IBreadcrumbsItem> {
  return [
    { text: 'Organisations', href: ctx.linkTo('admin.organizations') },
    {
      text: organization.entity.name,
      href: ctx.linkTo('admin.organizations.view', {
        organizationGUID: organization.metadata.guid,
      }),
    },
    ...children,
  ];
}
