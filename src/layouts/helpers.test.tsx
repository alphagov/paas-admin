/**
 * @jest-environment jsdom
 */
import { randomUUID } from 'crypto';

import { render } from '@testing-library/react';

import React from 'react';

import { GIBIBYTE, KIBIBYTE, MEBIBYTE, TEBIBYTE } from './constants';
import {
  Abbreviation,
  bytesToHuman,
  capitalize,
  checkIfValidUuid,
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
  it('should display bytes correctly', () => {
    const { container } = render(bytesToHuman(5.3))
    expect(container.innerHTML).toContain('5 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="bytes">B</abbr>');
  });

  it('should display kibibytes correctly', () => {
    const { container } = render(bytesToHuman(5.3 * KIBIBYTE));
    expect(container.innerHTML).toContain('5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="kibibytes">KiB</abbr>');
  });

  it('should display mebibytes correctly', () => {
    const { container } = render(bytesToHuman(5.3 * MEBIBYTE));
    expect(container.innerHTML).toContain('5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="mebibytes">MiB</abbr>');
  });

  it('should display gibibytes correctly', () => {
    const { container } = render(bytesToHuman(5.3 * GIBIBYTE));
    expect(container.innerHTML).toContain('5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="gibibytes">GiB</abbr>');
  });

  it('should display tebibytes correctly', () => {
    const { container } = render(bytesToHuman(5.3 * TEBIBYTE));
    expect(container.innerHTML).toContain('5.30 <abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="tebibytes">TiB</abbr>');
  });
});

describe(conditionallyDisplay, () => {
  it('should do the right thing', () => {
    const OK = conditionallyDisplay(true, <p>OK</p>);
    const notOK = conditionallyDisplay(false, <p>OK</p>);

    expect(OK).toEqual(<p>OK</p>);
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
    const  { container } = render(<Abbreviation description="For the win">FTW</Abbreviation>);
    const element = container.getElementsByTagName('abbr')[0]
    expect(element).toHaveAttribute('tabindex', expect.stringContaining('0'));
    expect(element).toHaveTextContent('FTW');
    expect(element).toHaveAttribute('aria-label', expect.stringContaining('For the win'));
    expect(element).toHaveAttribute('role', expect.stringContaining('tooltip'));
  });
});

describe(checkIfValidUuid, () => {
  it('should return true if string is a valid UUID', () => {
    expect(checkIfValidUuid(randomUUID())).toBeTruthy();
  });

  it('should return false if string is not a valid UUID', () => {
    expect(checkIfValidUuid('a24a6ea4-ce75-4665-a070')).toBeFalsy();
  });
});
