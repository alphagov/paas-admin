import React, { ReactElement } from 'react';

interface IBreadcrumbsProperties {
  readonly items: ReadonlyArray<IBreadcrumbsItem>;
}

export interface IBreadcrumbsItem {
  readonly href?: string;
  readonly text: string;
}

export function Breadcrumbs(props: IBreadcrumbsProperties): ReactElement {
  const items = props.items.map((item, index) => (
    <li
      key={index}
      className="govuk-breadcrumbs__list-item"
      aria-current={index + 1 === props.items.length ? 'page' : undefined}
    >
      {item.href ? (
        <a className="govuk-breadcrumbs__link" href={item.href}>
          {item.text}
        </a>
      ) : (
        item.text
      )}
    </li>
  ));

  return (
    <div className="govuk-breadcrumbs">
      <ol className="govuk-breadcrumbs__list">{items}</ol>
    </div>
  );
}
