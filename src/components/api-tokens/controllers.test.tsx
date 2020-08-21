import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import CloudFoundryClient from '../../lib/cf';
import UAAClient from '../../lib/uaa';
import { IContext } from '../app';
import { createTestContext } from '../app/app.test-helpers';

import { compose, confirmRevocation, confirmRotation, create, isTokenUser, list, revoke, rotate } from './controllers';
import { DEFAULT_KEY_LENGTH, DEFAULT_SECRET_LENGTH } from './token';

jest.mock('../../lib/cf');
jest.mock('../../lib/uaa');

const mockOrganization = { entity: { name: 'org-name' }, metadata: { guid: 'ORG_GUID' } };
const mockUAAUser = { userName: 'jeff@jefferson.com' };
const mockUAAUserToken = { userName: 'org-name-deployer-q1w2e3r4' };
const mockUser = {
  entity: { username: mockUAAUser.userName },
  metadata: { created_at: '2020-01-01T11:00:00', guid: '__USER_GUID__' },
};
const mockToken = {
  entity: { username: mockUAAUserToken.userName },
  metadata: { created_at: '2020-01-01T12:00:00', guid: '__TOKEN_GUID__' },
};

const ctx: IContext = createTestContext();
const MockCFClient = CloudFoundryClient as jest.Mock;
const MockUAAClient = UAAClient as jest.Mock;

describe(isTokenUser, () => {
  it('should correctly define a token user', () => {
    expect(isTokenUser('govuk-paas', 'govuk-paas-deploy-user-q1w2e3r4')).toBe(true);
    expect(isTokenUser('govuk-paas', 'govuk-paas-prod-1q2w3e4r')).toBe(true);
    expect(isTokenUser('govuk_paas', 'govuk_paas-deploy-user-q1w2e3r4')).toBe(true);
    expect(isTokenUser('govuk_paas', 'govuk_paas-prod-1q2w3e4r')).toBe(true);
    expect(isTokenUser('paas', 'paas-deploy-user-q1w2e3r4')).toBe(true);
    expect(isTokenUser('paas', 'paas-prod-1q2w3e4r')).toBe(true);
    expect(isTokenUser('testing-very-long-org-name', 'testing-very-long-org-name-deploy-user-q1w2e3r4')).toBe(true);
    expect(isTokenUser('testing-very-long-org-name', 'testing-very-long-org-name-prod-1q2w3e4r')).toBe(true);

    expect(isTokenUser('govuk-paas', 'admin')).toBe(false);
    expect(isTokenUser('govuk-paas', 'jeff.jefferson@example.com')).toBe(false);
    expect(isTokenUser('govuk-paas', '12345678900987654321')).toBe(false);
  });
});

describe(list, () => {
  beforeEach(() => {
    MockCFClient.mockClear();
  });

  it('should throw a 404 error if user has not enough permissions', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(false);

    await expect(list(ctx, {})).rejects.toThrowError(/not found/);
  });

  it('should be able to list out all tokens and no users', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockCFClient.prototype.usersForOrganization.mockReturnValueOnce([ mockToken, mockUser, mockToken ]);

    const response = await list(ctx, {});

    expect(response.status).toBeUndefined();
    expect(response.body).not.toContain(mockUser.entity.username);
    expect(response.body).toContain(mockToken.entity.username);
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(confirmRevocation, () => {
  beforeEach(() => {
    MockCFClient.mockClear();
    MockUAAClient.mockClear();
  });

  it('should throw a 404 error if user has not enough permissions', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(false);

    await expect(confirmRevocation(ctx, {})).rejects.toThrowError(/not found/);
  });

  it('should throw a 404 error if uaa user is not found', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(null);

    await expect(confirmRevocation(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should throw a 404 error if uaa user is not a token', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUser);

    await expect(confirmRevocation(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should be able to print out form requiring user confirmation on revoke action', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUserToken);

    const response = await confirmRevocation(ctx, {});

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Are you sure you\'d like to revoke the following API Token?');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(revoke, () => {
  beforeEach(() => {
    MockCFClient.mockClear();
  });

  it('should throw a 404 error if user has not enough permissions', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(false);

    await expect(revoke(ctx, {})).rejects.toThrowError(/not found/);
  });

  it('should throw a 404 error if uaa user is not found', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(null);

    await expect(revoke(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should throw a 404 error if uaa user is not a token', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUser);

    await expect(revoke(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should revoke the token after confirmation', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUserToken);
    MockCFClient.prototype.setOrganizationRole.mockReturnValueOnce(null);

    const response = await revoke(ctx, {});

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Successfully revoked an API Token');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(compose, () => {
  beforeEach(() => {
    MockCFClient.mockClear();
  });

  it('should throw a 404 error if user has not enough permissions', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(false);

    await expect(compose(ctx, {})).rejects.toThrowError(/not found/);
  });

  it('should revoke the token after confirmation', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);

    const response = await compose(ctx, {});

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Create new API Token');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(create, () => {
  beforeEach(() => {
    MockCFClient.mockClear();
  });

  it('should throw a 404 error if user has not enough permissions', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(false);

    await expect(create(ctx, {}, { name: '' })).rejects.toThrowError(/not found/);
  });

  it('should throw a validation error if token name is empty', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);

    const response = await create(ctx, {}, { name: '' });

    expect(response.status).toEqual(400);
    expect(response.body).toContain('Create new API Token');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should throw a validation error if token name is not valid', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);

    const response = await create(ctx, {}, { name: '<script>alert("pwnd");</script>' });

    expect(response.status).toEqual(400);
    expect(response.body).toContain('Create new API Token');
    expect(response.body).not.toContain('<script>alert("pwnd");</script>');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });

  it('should successfully create API Token', async () => {
    const tokenName = 'deployer';

    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.createUser.mockImplementation((username: string, password: string) => {
      const numberOfHyphensBetweenName = 2;
      const usernameLength = DEFAULT_KEY_LENGTH + numberOfHyphensBetweenName
        + mockOrganization.entity.name.length + tokenName.length;

      if (username.length !== usernameLength || password.length !== DEFAULT_SECRET_LENGTH) {
        throw new Error(`Either Key or Secret were incorrectly generated. Got:
        Key:    "${username}" <${username.length} / ${usernameLength}>
        Secret: "${password}" <${password.length} / ${DEFAULT_SECRET_LENGTH}>`);
      }

      return mockUAAUserToken;
    });
    MockCFClient.prototype.createUser.mockReturnValueOnce(mockToken);
    MockCFClient.prototype.assignUserToOrganization.mockReturnValueOnce(null);

    const response = await create(ctx, {}, { name: tokenName });

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Successfully generted token secret');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(confirmRotation, () => {
  beforeEach(() => {
    MockCFClient.mockClear();
    MockUAAClient.mockClear();
  });

  it('should throw a 404 error if user has not enough permissions', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(false);

    await expect(confirmRotation(ctx, {})).rejects.toThrowError(/not found/);
  });

  it('should throw a 404 error if uaa user is not found', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(null);

    await expect(confirmRotation(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should throw a 404 error if uaa user is not a token', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUser);

    await expect(confirmRotation(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should be able to print out form requiring user confirmation on revoke action', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUserToken);

    const response = await confirmRotation(ctx, {});

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Are you sure you\'d like to rotate the following API Token?');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});

describe(rotate, () => {
  beforeEach(() => {
    MockCFClient.mockClear();
  });

  it('should throw a 404 error if user has not enough permissions', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(false);

    await expect(rotate(ctx, {})).rejects.toThrowError(/not found/);
  });

  it('should throw a 404 error if uaa user is not found', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(null);

    await expect(rotate(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should throw a 404 error if uaa user is not a token', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUser);

    await expect(rotate(ctx, {})).rejects.toThrowError(/token not found/);
  });

  it('should rotate the token after confirmation', async () => {
    MockCFClient.prototype.organization.mockReturnValueOnce(mockOrganization);
    MockCFClient.prototype.hasOrganizationRole.mockReturnValueOnce(true);
    MockUAAClient.prototype.getUser.mockReturnValueOnce(mockUAAUserToken);
    MockUAAClient.prototype.forceSetPassword.mockImplementation((id: string, password: string) => {
      if (password.length !== DEFAULT_SECRET_LENGTH) {
        throw new Error(`Secret were incorrectly generated. Got:
        Secret: "${password}" <${password.length} / ${DEFAULT_SECRET_LENGTH}>`);
      }

      return mockUAAUserToken;
    });

    const response = await rotate(ctx, {});

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('Successfully generted token secret');
    expect(spacesMissingAroundInlineElements(response.body as string)).toHaveLength(0);
  });
});
