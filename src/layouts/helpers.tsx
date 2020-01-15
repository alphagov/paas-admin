import React, { ReactElement } from 'react';
import { KIBIBYTE } from './constants';

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

export function bytesToHuman(startingBytes: number): ReactElement {
  let bytes = startingBytes;
  const units = ['KiB', 'MiB', 'GiB', 'TiB'];

  if (Math.abs(bytes) < KIBIBYTE) {
    return (<>{bytes.toFixed(0)} <abbr title="bytes">B</abbr></>);
  }

  let u = -1;
  while (Math.abs(bytes) >= KIBIBYTE && u < units.length - 1) {
      bytes /= KIBIBYTE;
      ++u;
  }

  return (<>{bytes.toFixed(2)} <abbr title={longUnits[units[u]]}>{units[u]}</abbr></>);
}

export function conditionallyDisplay(b: boolean, element: ReactElement): ReactElement | undefined {
  return b ? element : undefined;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
