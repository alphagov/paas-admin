import cheerio from 'cheerio';
import { shallow } from 'enzyme';
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
    const markup = shallow(<TermsPage content={content} csrf="CSRF_TOKEN" name={title} />);
    const $ = cheerio.load(markup.html());
    expect(markup.find('input').filter({ name: '_csrf' }).prop('value')).toEqual('CSRF_TOKEN');
    expect(markup.find('input').filter({ name: 'document_name' }).prop('value')).toEqual(title);
    expect($('h1').hasClass('govuk-heading-xl')).toBe(true);
    expect($('h1').text()).toEqual(title);
    expect($('ul').hasClass('govuk-list')).toBe(true);
    expect($('ul').hasClass('govuk-list--bullet')).toBe(true);
    expect($('ol').hasClass('govuk-list')).toBe(true);
    expect($('ol').hasClass('govuk-list--number')).toBe(true);
    expect($('a').hasClass('govuk-link')).toBe(true);
    expect($('a').first().text()).toEqual('See example');
  });
});

describe(Heading, () => {
  it('should be capable to display correct heading', () => {
    expect(shallow(<Heading level={1}>TEST</Heading>).matchesElement(<h1 className="govuk-heading-xl">TEST</h1>))
      .toBe(true);
    expect(shallow(<Heading level={2}>TEST</Heading>).matchesElement(<h2 className="govuk-heading-l">TEST</h2>))
      .toBe(true);
    expect(shallow(<Heading level={3}>TEST</Heading>).matchesElement(<h3 className="govuk-heading-m">TEST</h3>))
      .toBe(true);
    expect(shallow(<Heading level={4}>TEST</Heading>).matchesElement(<h4 className="govuk-heading-s">TEST</h4>))
      .toBe(true);
    expect(shallow(<Heading level={5}>TEST</Heading>).matchesElement(<h5 className={undefined}>TEST</h5>)).toBe(true);
    expect(shallow(<Heading level={6}>TEST</Heading>).matchesElement(<h6 className={undefined}>TEST</h6>)).toBe(true);
    expect(shallow(<Heading level={7}>TEST</Heading>).html()).toEqual('');
  });
});
