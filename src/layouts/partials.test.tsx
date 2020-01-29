import { shallow } from 'enzyme';
import React from 'react';

import { Footer, Header, Main } from './partials';

describe(Header, () => {
  it('should successfully display the header element', () => {
    const markup = shallow(
      <Header location="London" isPlatformAdmin={false} />,
    );
    expect(markup.find('header nav li a.paas-govuk-tag').text()).toMatch(
      'London',
    );
    expect(markup.find('header nav li.admin')).toHaveLength(0);
    // The following is for simply compliance with the design system.
    // https://github.com/alphagov/govuk-frontend/issues/1688
    expect(
      markup
        .find('header.govuk-header .govuk-header__logotype svg image')
        .filterWhere(
          item =>
            item.prop('src') === '/assets/images/govuk-logotype-crown.png',
        ),
    ).toHaveLength(1);
  });

  it('should show the admin link if platform admin', () => {
    const markup = shallow(
      <Header location="Ireland" isPlatformAdmin={true} />,
    );
    expect(markup.find('header nav li a.paas-govuk-tag').text()).toMatch(
      'Ireland',
    );
    expect(markup.find('header nav li.admin')).toHaveLength(1);
  });
});

describe(Main, () => {
  it('should successfully display the main element', async () => {
    const markup = shallow(
      <Main>
        <p>This is a test</p>
      </Main>,
    );
    expect(markup.text()).toBe('This is a test');
  });
});

describe(Footer, () => {
  it('should successfully display the footer element', async () => {
    const markup = shallow(<Footer />);
    expect(markup.find('.govuk-footer__licence-description').html()).toContain(
      'All content is available under the <a',
    );
    expect(
      markup
        .find('.govuk-footer__licence-description a')
        .containsMatchingElement(
          <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">
            Open Government Licence v3.0
          </a>,
        ),
    ).toBe(true);
    expect(markup.text()).toContain('Crown copyright');
  });
});
