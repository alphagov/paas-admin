/**
 * @jest-environment jsdom
 */
 import { render, screen } from '@testing-library/react';
import React from 'react';

import { Footer, Header, Main } from './partials';

describe(Header, () => {
  it('should successfully display the header element', () => {
    const { container } = render(
      <Header location="London" isPlatformAdmin={false} />,
    );
    expect(container.querySelector('header nav li .app-region-tag')).toHaveTextContent('London');
    expect(container.querySelector('header nav li.admin')).toBeFalsy();
    // The following is for simply compliance with the design system.
    // https://github.com/alphagov/govuk-frontend/issues/1688
    expect(
      container
      .querySelector('header.govuk-header .govuk-header__logotype svg image'))
      .toHaveAttribute('src', expect.stringContaining('/assets/images/govuk-logotype-crown.png'))
  });

  it('should show the admin link if platform admin', () => {
    const { container } = render(
      <Header location="Ireland" isPlatformAdmin={true} />,
    );
    expect(container.querySelector('header nav li .app-region-tag')).toHaveTextContent('Ireland');
    expect(container.querySelector('header nav li.admin')).toBeTruthy();
  });
});

describe(Main, () => {
  it('should successfully display the main element', () => {
    render(
      <Main>
        <p>This is a test</p>
      </Main>,
    );
    expect(screen.getByRole('main')).toHaveTextContent('This is a test');
  });
});

describe(Footer, () => {
  it('should successfully display the footer element', () => {
    const { container } = render(<Footer />);
    expect(
      container.querySelector('.govuk-footer__licence-description'))
        .toHaveTextContent('All content is available under the Open Government Licence v3.0, except where otherwise stated');
    expect(
      container
        .querySelector('.govuk-footer__licence-description a'))
        .toHaveAttribute('href', expect.stringContaining('https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/'));
    expect(container).toHaveTextContent('Crown copyright');
  });
});
