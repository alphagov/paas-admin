import React, { ReactElement } from 'react';
import { KIBIBYTE } from './constants';

interface IConvertedBytes {
  readonly long: string;
  readonly short: string;
  readonly value: string;
}

const longUnits: { readonly [key: string]: string; } = {
  KiB: 'kibibytes',
  MiB: 'mebibytes',
  GiB: 'gibibytes',
  TiB: 'tebibytes',
};

export function percentage(value: number, ofValue: number): string {
  const result = 100 * (value / ofValue);
  return `${result.toFixed(1)}%`;
}

export function bytesConvert(startingBytes: number): IConvertedBytes {
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

  return { long: longUnits[units[u]], short: units[u], value: bytes.toFixed(2) };
}

export function bytesToHuman(startingBytes: number): ReactElement {
  const converted = bytesConvert(startingBytes);

  return (<>{converted.value} <abbr title={converted.long}>{converted.short}</abbr></>);
}

export function conditionallyDisplay(b: boolean, element: ReactElement): ReactElement | undefined {
  return b ? element : undefined;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
