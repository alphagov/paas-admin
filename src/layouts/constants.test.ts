import { SLUG_REGEX } from './constants';

describe(SLUG_REGEX, () => {
  it('should only match the approved slugs', () => {
    expect('organisationname'.match(SLUG_REGEX)).not.toBeNull();
    expect('organisation-name'.match(SLUG_REGEX)).not.toBeNull();
    expect('very-long-organisation-name-please'.match(SLUG_REGEX)).not.toBeNull();
    expect('OrganisationName'.match(SLUG_REGEX)).toBeNull();
    expect('Organisation-Name'.match(SLUG_REGEX)).toBeNull();
    expect('Organisation_Name'.match(SLUG_REGEX)).toBeNull();
    expect('Organisation Name'.match(SLUG_REGEX)).toBeNull();
    expect('organisation_name'.match(SLUG_REGEX)).toBeNull();
    expect('organisation name'.match(SLUG_REGEX)).toBeNull();
  });
});
