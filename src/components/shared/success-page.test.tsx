/**
 * @jest-environment jsdom
 */
import {render, screen} from '@testing-library/react';
import React from 'react';
import { SuccessPage } from './success-page';

describe(SuccessPage, () => {
  it('should parse simple SuccessPage', () => {
    render(<SuccessPage heading="Success!" />);

    expect(screen.getByRole('heading',{ level: 1 })).toHaveTextContent('Success!');
  });

  it('should parse rich SuccessPage', () => {
    render(<SuccessPage heading="Success!" text="You have passed the test.">
      <p>Read more elsewhere!</p>
      <a href="#">Elsewhere</a>
    </SuccessPage>);

    expect(screen.getByRole('heading',{ level: 1 })).toHaveTextContent('Success!');
    expect(screen.getByText('Read more elsewhere!')).toBeTruthy();
    expect(screen.getByRole('link')).toHaveTextContent('Elsewhere')
  });
});
