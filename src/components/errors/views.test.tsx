import { shallow } from 'enzyme';
import React from 'react';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import { ErrorPage } from './views';

describe(ErrorPage, () => {
  it('should print the default error message', () => {
    const markup = shallow(<ErrorPage title="TEST CASE" />);
    expect(markup.find('h1.govuk-heading-xl').text()).toMatch(/TEST CASE/);
    expect(markup.find('p.govuk-body').text()).toMatch(/Something went wrong while processing the request./);
    expect(markup.find('p.govuk-body + p').text()).toContain('You can browse from the');
    expect(spacesMissingAroundInlineElements(markup.html())).toHaveLength(0);
  });

  it('should print custom error message', () => {
    const markup = shallow(<ErrorPage title="TEST CASE">Expected Test</ErrorPage>);
    expect(markup.find('h1.govuk-heading-xl').text()).toMatch(/TEST CASE/);
    expect(markup.find('p.govuk-body').text()).toMatch(/Expected Test/);
    expect(markup.find('p.govuk-body + p').text()).toContain('You can browse from the');
    expect(spacesMissingAroundInlineElements(markup.html())).toHaveLength(0);
  });
});
