/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { Heading, TermsPage } from './views';

const title = 'Test certificate';
const content = `# ${title}

* [See example](https://example.com)
* [Another example](https://example.com)

1. Visit first example
1. Visit the other example`;

describe(TermsPage, () => {
  it('should be capable of parsing markdown content', () => {
    const { container, queryByRole } = render(
      <TermsPage content={content} csrf="CSRF_TOKEN" name={title} />,
    );
    expect(
      container
        .querySelector('input[name=_csrf]'))
        .toHaveValue('CSRF_TOKEN')
      expect(
        container
          .querySelector('input[name=document_name]'))
          .toHaveValue(title)
    expect(queryByRole('heading', { level: 1})).toHaveClass('govuk-heading-xl');
    expect(queryByRole('heading', { level: 1})).toHaveTextContent(title);
    expect(container.querySelector('ul')).toHaveClass('govuk-list');
    expect(container.querySelector('ul')).toHaveClass('govuk-list--bullet');
    expect(container.querySelector('ol')).toHaveClass('govuk-list');
    expect(container.querySelector('ol')).toHaveClass('govuk-list--number');
    expect(container.querySelector('a')).toHaveTextContent('See example');
  });
});

describe(Heading, () => {
  it('should be capable to display correct heading', () => {

    const { queryByRole } = render(
      <>
      <Heading level={1}>TEST</Heading>,
      <Heading level={2}>TEST</Heading>,
      <Heading level={3}>TEST</Heading>,
      <Heading level={4}>TEST</Heading>,
      <Heading level={5}>TEST</Heading>,
      <Heading level={6}>TEST</Heading>,
      <Heading level={7}>TEST</Heading>,
      </>,
    )
    expect(queryByRole('heading', { level: 1})).toHaveTextContent('TEST');
    expect(queryByRole('heading', { level: 1})).toHaveClass('govuk-heading-xl');
    expect(queryByRole('heading', { level: 2})).toHaveTextContent('TEST');
    expect(queryByRole('heading', { level: 2})).toHaveClass('govuk-heading-l');
    expect(queryByRole('heading', { level: 3})).toHaveTextContent('TEST');
    expect(queryByRole('heading', { level: 3})).toHaveClass('govuk-heading-m');
    expect(queryByRole('heading', { level: 4})).toHaveTextContent('TEST');
    expect(queryByRole('heading', { level: 4})).toHaveClass('govuk-heading-s');
    expect(queryByRole('heading', { level: 5})).toHaveTextContent('TEST');
    expect(queryByRole('heading', { level: 5})).not.toHaveAttribute('class');
    expect(queryByRole('heading', { level: 6})).toHaveTextContent('TEST');
    expect(queryByRole('heading', { level: 6})).not.toHaveAttribute('class');
    expect(queryByRole('heading', { level: 7})).toBeFalsy();
  });
});
