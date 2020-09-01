import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { GIBIBYTE, KIBIBYTE, MEBIBYTE, TEBIBYTE } from './constants';
import {
  Abbreviation,
  bytesToHuman,
  capitalize,
  conditionallyDisplay,
  percentage,
} from './helpers';

describe(percentage, () => {
  it('should do the right thing', () => {
    expect(percentage(5, 100)).toEqual('5.0%');
    expect(percentage(100, 5)).toEqual('2000.0%');
  });
});

describe(bytesToHuman, () => {
  it('should do the right thing', () => {
    const bytes = <span>{bytesToHuman(5.3)}</span>;
    const kibibytes = <span>{bytesToHuman(5.3 * KIBIBYTE)}</span>;
    const mebibytes = <span>{bytesToHuman(5.3 * MEBIBYTE)}</span>;
    const gibibytes = <span>{bytesToHuman(5.3 * GIBIBYTE)}</span>;
    const tebibytes = <span>{bytesToHuman(5.3 * TEBIBYTE)}</span>;
    expect(shallow(bytes).html()).toContain(
      '5 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="bytes">B</abbr>',
    );
    expect(shallow(kibibytes).html()).toContain(
      '5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="kibibytes">KiB</abbr>',
    );
    expect(shallow(mebibytes).html()).toContain(
      '5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="mebibytes">MiB</abbr>',
    );
    expect(shallow(gibibytes).html()).toContain(
      '5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="gibibytes">GiB</abbr>',
    );
    expect(shallow(tebibytes).html()).toContain(
      '5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="tebibytes">TiB</abbr>',
    );
  });
});

describe(conditionallyDisplay, () => {
  it('should do the right thing', () => {
    const OK = conditionallyDisplay(true, <p>OK</p>);
    const notOK = conditionallyDisplay(false, <p>OK</p>);

    expect(shallow(OK).html()).toEqual('<p>OK</p>');
    expect(notOK).toBeUndefined();
  });
});

describe(capitalize, () => {
  it('should do the right thing', () => {
    expect(capitalize('test')).toEqual('Test');
  });
});

describe(Abbreviation, () => {
  it('it should render the abbreviation tooltip correctly', () => {
    const output = <Abbreviation description="For the win">FTW</Abbreviation>;
    const $ = cheerio.load(shallow(output).html());
    expect($('abbr').attr('tabindex')).toBe('0');
    expect($('abbr').text()).toBe('FTW');
    expect($('abbr').attr('aria-label')).toBe('For the win');
    expect($('abbr').attr('role')).toBe('tooltip');
  });
});
