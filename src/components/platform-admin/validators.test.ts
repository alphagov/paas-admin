import { validateNewOrganization } from './validators';

describe(validateNewOrganization, () => {
  it('should return no validation errors when correct input has been provided', () => {
    const validation = validateNewOrganization({
      organization: 'new-organization',
      owner: 'Organization Owner',
    });

    expect(validation).toHaveLength(0);
  });

  it('should return validation errors when nothing has been submitted', () => {
    const validation = validateNewOrganization({});

    expect(validation).toHaveLength(2);
  });

  it('should return validation errors when organisation name does not meet our standards', () => {
    const validation = validateNewOrganization({
      organization: 'new_organization',
      owner: 'Organization Owner',
    });

    expect(validation).toHaveLength(1);
  });
});
