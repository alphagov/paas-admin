import React, { ReactElement } from 'react';

import { KIBIBYTE } from './constants';

interface IConvertedBytes {
  readonly long: string;
  readonly short: string;
  readonly value: string;
}

interface IAbbreviationProperties {
  readonly children: string;
  readonly description: string;
}

const longUnits: { readonly [key: string]: string } = {
  KiB: 'kibibytes',
  MiB: 'mebibytes',
  GiB: 'gibibytes',
  TiB: 'tebibytes',
};

export function percentage(value: number, ofValue: number): string {
  const result = 100 * (value / ofValue);

  return `${result.toFixed(1)}%`;
}

export function bytesConvert(startingBytes: number, precision = 2): IConvertedBytes {
  let bytes = startingBytes;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];

  if (Math.abs(bytes) < KIBIBYTE) {
    return { long: 'bytes', short: 'B', value: bytes.toFixed(0) };
  }

  let u = -1;
  while (Math.abs(bytes) >= KIBIBYTE && u < units.length - 1) {
    bytes /= KIBIBYTE;
    ++u;
  }

  return {
    long: longUnits[units[u]],
    short: units[u],
    value: bytes.toFixed(precision),
  };
}

export function Abbreviation(props: IAbbreviationProperties): ReactElement {
  return (
    <abbr role="tooltip" tabIndex={0} data-module="tooltip" aria-label={props.description}>{props.children}</abbr>
  );
}

export function bytesToHuman(startingBytes: number, precision = 2) {
  const converted = bytesConvert(startingBytes, precision);
  return (
    <>
     {converted.value} <Abbreviation description={converted.long}>{converted.short}</Abbreviation> 
    </>
  )
}

export function conditionallyDisplay(
  b: boolean,
  element: ReactElement,
): ReactElement | undefined {
  return b ? element : undefined;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/* Check if string is a valid UUID */
export function checkIfValidUuid(input: string): boolean {
  // 8-4-4-4-12 arrangement of 36 characters
  const regexExp = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
  return regexExp.test(input.toLowerCase());
}
