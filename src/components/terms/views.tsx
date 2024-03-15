import React, { ReactElement } from 'react';
import ReactMarkdown from 'react-markdown';

interface ITermsPageProperties {
  readonly csrf: string;
  readonly name: string;
  readonly content: string;
}

export function TermsPage(props: ITermsPageProperties): ReactElement {
  return (
    <form method="post" action="/agreements">
      <input type="hidden" name="_csrf" value={props.csrf} />
      <ReactMarkdown
        className="md"
        components={{
          h1: ({ children }) => <h1 className="govuk-heading-xl">{children}</h1>,
          h2: ({ children }) => <h2 className="govuk-heading-l">{children}</h2>,
          h3: ({ children }) => <h3 className="govuk-heading-m">{children}</h3>,
          h4: ({ children }) => <h4 className="govuk-heading-s">{children}</h4>,
          h5: ({ children }) => <h5>{children}</h5>,
          h6: ({ children }) => <h6>{children}</h6>,
          ul: ({ node, children }) => { if (node?.tagName === 'ul') return <ul className="govuk-list govuk-list--bullet">{children}</ul>},
          ol: ({ node, children }) => { if (node?.tagName === 'ol') return <ol className="govuk-list govuk-list--number">{children}</ol>},
        }}
      >
        {props.content}
      </ReactMarkdown>

      <input type="hidden" name="document_name" value={props.name} />

      <button className="govuk-button" data-module="govuk-button" type="submit">
        I agree to these Terms of Use
      </button>
    </form>
  );
}
