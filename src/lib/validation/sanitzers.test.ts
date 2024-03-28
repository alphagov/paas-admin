import { describe, expect, it } from 'vitest';

import { sanitizeEmail } from './sanitizers';

describe('sanitizeEmail', () => {
  it('removes whitespace from email', () => {
    const email = '  test@example.com  ';
    const sanitizedEmail = sanitizeEmail(email);
    expect(sanitizedEmail).toBe('test@example.com');
  });

  it('returns empty string if email is undefined', () => {
    const email = undefined;
    const sanitizedEmail = sanitizeEmail(email);
    expect(sanitizedEmail).toBe('');
  });

  it('returns empty string if email is empty', () => {
    const email = '';
    const sanitizedEmail = sanitizeEmail(email);
    expect(sanitizedEmail).toBe('');
  });
});
