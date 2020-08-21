import { DEFAULT_KEY_LENGTH, DEFAULT_SECRET_LENGTH, generateKey, generateSecret } from './token';

describe(generateKey, () => {
  it('should generate a different key each time', () => {
    const org = 'govuk-paas';
    const key1 = generateKey(org, 'prod', DEFAULT_KEY_LENGTH);
    const key2 = generateKey(org, 'staging', DEFAULT_KEY_LENGTH);
    const key3 = generateKey(org, 'dev', DEFAULT_KEY_LENGTH);
    const key4 = generateKey(org, 'dev', DEFAULT_KEY_LENGTH);

    expect(key1).toMatch(/govuk-paas-prod-[a-z0-9]{8}/);
    expect(key2).toMatch(/govuk-paas-staging-[a-z0-9]{8}/);
    expect(key3).toMatch(/govuk-paas-dev-[a-z0-9]{8}/);
    expect(key4).toMatch(/govuk-paas-dev-[a-z0-9]{8}/);
    expect(key4).not.toEqual(key3);
  });
});

describe(generateSecret, () => {
  it('should generate a different token each time', () => {
    const token1 = generateSecret();
    const token2 = generateSecret();
    const token3 = generateSecret(32);

    expect(token1).not.toEqual(token2);
    expect(token1).not.toEqual(token3);
    expect(token2).not.toEqual(token3);

    expect(token1).toHaveLength(DEFAULT_SECRET_LENGTH);
    expect(token2).toHaveLength(DEFAULT_SECRET_LENGTH);
    expect(token3).toHaveLength(32);
  });
});
