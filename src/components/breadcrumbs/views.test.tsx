/**
 * @jest-environment jsdom
 */
 import {render, screen} from '@testing-library/react'
import React from 'react';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';

import { Breadcrumbs } from './views';

describe(Breadcrumbs, () => {
  it('should produce path of items', () => {
    const breadcrumbs = [
      { text: '1', href: '/1' },
      { text: '2', href: '/2' },
      { text: '3', href: '/3' },
      { text: '4' },
    ];

    const { container } = render(<Breadcrumbs items={breadcrumbs} />);
    

    expect(screen.getAllByRole('listitem')).toHaveLength(4)
    // first item checks
    expect(container.getElementsByTagName('li')[0]).toHaveTextContent('1')
    expect(screen.getByText('1')).toHaveAttribute('href', expect.stringContaining('1'))
    expect(screen.getByText('1')).not.toHaveAttribute('aria-current')
    //last item checks
    expect(container.getElementsByTagName('li')[3]).toHaveTextContent('4')
    expect(screen.getByText('4')).not.toHaveAttribute('href')
    expect(screen.getByText('4')).toHaveAttribute('aria-current', expect.stringContaining('page'))

    expect(
      spacesMissingAroundInlineElements(container.innerHTML),
    ).toHaveLength(0);
  });
});
