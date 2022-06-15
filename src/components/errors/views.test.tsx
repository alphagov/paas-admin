/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
import React from 'react';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';

import { ErrorPage } from './views';

describe(ErrorPage, () => {
  it('should print the default error message', () => {
    const { container } = render(<ErrorPage title="TEST CASE" />);
    expect(container.querySelector('h1')).toHaveTextContent(/TEST CASE/);
    expect(container.querySelector('.govuk-body')).toHaveTextContent(
      /Something went wrong while processing the request./,
    );
    expect(container.querySelector('.govuk-body + p')).toHaveTextContent(
      'You can browse from the',
    );
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });

  it('should print custom error message', () => {
    const { container } = render(
      <ErrorPage title="TEST CASE">Expected Test</ErrorPage>,
    );
    expect(container.querySelector('h1')).toHaveTextContent(/TEST CASE/);
    expect(container.querySelector('.govuk-body')).toHaveTextContent(/Expected Test/);
    expect(container.querySelector('.govuk-body + p')).toHaveTextContent(
      'You can browse from the',
    );
    expect(spacesMissingAroundInlineElements(container.innerHTML)).toHaveLength(0);
  });
});
