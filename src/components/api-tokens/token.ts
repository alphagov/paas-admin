import { randomBytes } from 'crypto';

export const DEFAULT_KEY_LENGTH = 8;
export const DEFAULT_SECRET_LENGTH = 64;

export function generateKey(prefix: string, name: string, length = DEFAULT_KEY_LENGTH): string {
  const key = randomBytes(length / 2).toString('hex');

  return `${prefix}-${name}-${key}`;
}

export function generateSecret(length = DEFAULT_SECRET_LENGTH): string {
  return randomBytes(length / 2).toString('hex');
}
