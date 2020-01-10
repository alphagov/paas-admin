import React, { ReactElement, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';

interface ITermsPageProperties {
  readonly csrf: string;
  readonly name: string;
  readonly content: string;
}

function Link(props: { readonly href: string; readonly children: string; }): ReactElement {
  return <a href={props.href} className="govuk-link">{props.children}</a>;
}

function Paragraph(props: { readonly children: string; }): ReactElement {
  return <p className="govuk-body">{props.children}</p>;
}

export function List(props: { readonly children: ReactNode; readonly ordered: boolean; }): ReactElement {
  return props.ordered
    ? <ol className="govuk-list govuk-list--number">{props.children}</ol>
    : <ul className="govuk-list govuk-list--bullet">{props.children}</ul>;
}

export function Heading(props: { readonly level: number; readonly children: ReactNode }): ReactElement {
  switch (props.level) {
    case 1:
      return (<h1 className="govuk-heading-xl">{props.children}</h1>);
    case 2:
      return (<h2 className="govuk-heading-l">{props.children}</h2>);
    case 3:
      return (<h3 className="govuk-heading-m">{props.children}</h3>);
    case 4:
      return (<h4 className="govuk-heading-s">{props.children}</h4>);
    case 5:
      return (<h5>{props.children}</h5>);
    case 6:
      return (<h6>{props.children}</h6>);
  }
  return (<></>);
}

export function TermsPage(props: ITermsPageProperties): ReactElement {
  return (
    <form method="post" action="/agreements">
      <input type="hidden" name="_csrf" value={props.csrf} />

      <ReactMarkdown className="md" source={props.content} renderers={{
        heading: Heading,
        link: Link,
        list: List,
        paragraph: Paragraph,
      }} />

      <input type="hidden" name="document_name" value={props.name} />

      <button className="govuk-button" data-module="govuk-button" type="submit">
        Agree
      </button>
    </form>
  );
}
