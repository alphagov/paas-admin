import cheerio from 'cheerio';
import { shallow } from 'enzyme';
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

    const markup = shallow(<Breadcrumbs items={breadcrumbs} />);
    const $ = cheerio.load(markup.html());
    expect($('li')).toHaveLength(4);

    expect($('li:first-of-type a').prop('href')).toEqual('/1');
    expect($('li:first-of-type').text()).toEqual('1');
    expect($('li:first-of-type').prop('aria-current')).toBeUndefined();

    expect($('li:last-of-type a').prop('href')).toBeUndefined();
    expect($('li:last-of-type').text()).toEqual('4');
    expect($('li:last-of-type').prop('aria-current')).toEqual('page');

    expect(
      spacesMissingAroundInlineElements(markup.html() as string),
    ).toHaveLength(0);
  });
});
