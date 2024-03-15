// @vitest-environment jsdom


import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { TermsPage } from './views';

const title = 'Test certificate';
const content = `# ${title}

## TEST2

### TEST3

#### TEST4

##### TEST5
###### TEST6



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
        .toHaveValue('CSRF_TOKEN');
      expect(
        container
          .querySelector('input[name=document_name]'))
          .toHaveValue(title);
    expect(container.querySelector('ul')).toHaveClass('govuk-list');
    expect(container.querySelector('ul')).toHaveClass('govuk-list--bullet');
    expect(container.querySelector('ol')).toHaveClass('govuk-list');
    expect(container.querySelector('ol')).toHaveClass('govuk-list--number');
    expect(container.querySelector('a')).toHaveTextContent('See example');
    expect(queryByRole('heading', { level: 1 })).toHaveClass('govuk-heading-xl');
    expect(queryByRole('heading', { level: 1 })).toHaveTextContent(title);
    expect(queryByRole('heading', { level: 2 })).toHaveTextContent('TEST2');
    expect(queryByRole('heading', { level: 2 })).toHaveClass('govuk-heading-l');
    expect(queryByRole('heading', { level: 3 })).toHaveTextContent('TEST3');
    expect(queryByRole('heading', { level: 3 })).toHaveClass('govuk-heading-m');
    expect(queryByRole('heading', { level: 4 })).toHaveTextContent('TEST4');
    expect(queryByRole('heading', { level: 4 })).toHaveClass('govuk-heading-s');
    expect(queryByRole('heading', { level: 5 })).toHaveTextContent('TEST5');
    expect(queryByRole('heading', { level: 5 })).not.toHaveAttribute('class');
    expect(queryByRole('heading', { level: 6 })).toHaveTextContent('TEST6');
    expect(queryByRole('heading', { level: 6 })).not.toHaveAttribute('class');
  });
});
