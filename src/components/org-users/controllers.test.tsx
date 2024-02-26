import cheerio from 'cheerio';
import jwt from 'jsonwebtoken';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as cfData from '../../lib/cf/cf.test.data';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';
import { Token } from '../auth';

import { composeOrgRoles, composeSpaceRoles } from './test-helpers';

import * as orgUsers from '.';



const tokenKey = 'secret';

const time = Math.floor(Date.now() / 1000);
const rawToken = {
  user_id: 'uaa-id-253',
  scope: [],
  origin: 'uaa',
  exp: time + 24 * 60 * 60,
};
const accessToken = jwt.sign(rawToken, tokenKey);

const ctx: IContext = createTestContext({
  token: new Token(accessToken, [tokenKey]),
});

describe('org-users test suite', () => {

  const handlers = [
    http.post(`${ctx.app.uaaAPI}/oauth/token`, ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get('grant_type');
      if (q === 'client_credentials') {
        return new HttpResponse('{"access_token": "FAKE_ACCESS_TOKEN"}');
      }
    }),
    http.get(`${ctx.app.accountsAPI}/users/*`, () => {
      return HttpResponse.json(
        '',
        {status: 200},
      );
    }),
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should show the users pages', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForSpace,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForSpace,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.uaaAPI}/Users/uaa-id-253`, () => {
        return new HttpResponse(
          JSON.stringify({
            ...JSON.parse(uaaData.user),
            id: 'uaa-id-253',
          }),
          {status: 200},
        );
      }),
      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          JSON.stringify({
            ...JSON.parse(uaaData.user),
            id: 'uaa-user-edit-123456',
            origin: 'custom-origin-1',
          }),
          { status: 200},
        );
      }),
      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-changeperms-123456`, () => {
        return new HttpResponse(
          JSON.stringify({
            ...JSON.parse(uaaData.user),
            id: 'uaa-user-changeperms-123456',
            origin: 'custom-origin-2',
          }),
        );
      }),
      http.get(`${ctx.app.uaaAPI}/Users/99022be6-feb8-4f78-96f3-7d11f4d476f1`, () => {
        return new HttpResponse(
          JSON.stringify({
            ...JSON.parse(uaaData.user),
            id: '99022be6-feb8-4f78-96f3-7d11f4d476f1',
            origin: 'custom-origin-3',
          }),
        );
      }),
    );

    const response = await orgUsers.listUsers(ctx, {
      organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
    });

    expect(response.body).toContain('Team members');
    expect(response.body).toContain('uaa');
    expect(response.body).toContain('Custom-origin-1');
    expect(response.body).toContain('Custom-origin-2');
    expect(response.body).toContain('Custom-origin-3');
    expect(response.body).toContain('Last login');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should not show users who do not have UAA accounts', async () => {

    server.use(
      http.get(`${ctx.app.uaaAPI}/Users/99022be6-feb8-4f78-96f3-7d11f4d476f1`, () => {
        return new HttpResponse(
          '',
          { status:404 },
        );
      }),
    );

    try {
      const response = await orgUsers.listUsers(ctx, {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      });

      expect(response.body).not.toBeFalsy();
      expect(response.body).not.toContain(
        '99022be6-feb8-4f78-96f3-7d11f4d476f1',
      );
    } catch (error) {
      expect(error);
    }
  });

  it('should show the invite page', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
    );

    const response = await orgUsers.inviteUserForm(ctx, {
      organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
    });

    expect(response.body).toContain('Invite a new team member');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show error message when email is missing', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': {
            managers: {
              current: '1',
            },
            billing_managers: {
              current: '0',
            },
            auditors: {
              current: '0',
              desired: '1',
            },
          },
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    const $ = cheerio.load(response.body as string);

    expect(response.body).toContain('Enter an email address in the correct format, like name@example.com');
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20][managers]"]:disabled',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20][billing_managers]"]:checked',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20][auditors]"]:checked',
      ).length,
    ).toEqual(1);
    expect(response.status).toEqual(400);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show error message when email is invalid according to our regex', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'x',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Enter an email address in the correct format, like name@example.com');
    expect(response.status).toEqual(400);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show error message when invitee is already a member of org', async () => {

    server.use(
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request}) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/imeCkO@test.org/)) {
          return new HttpResponse(
            uaaData.usersByEmail,
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'imeCkO@test.org',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            billing_managers: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('is already a member of the organisation');
    expect(response.status).toEqual(400);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show error when no roles selected', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
          { status: 201 },
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );
    const $ = cheerio.load(response.body as string);
    expect(response.body).toContain('At least one organisation or space level role should be selected');
    expect($('#roles').hasClass('govuk-form-group--error')).toBeTruthy();
    expect($('#roles').find('#roles-error').length).toBe(1);
    expect($('#roles').attr('aria-describedby')).toBe('roles-error');
    expect(response.status).toEqual(400);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, set BillingManager role and show success', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
          { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            billing_managers: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('New team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, set OrgManager role and show success', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
          { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),

      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            managers: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('New team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, set OrgAuditor role and show success', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
          { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            auditors: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('New team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, set SpaceManager role and show success', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
          { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{}',
        );
      }),
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
            managers: {
              current: '0',
              desired: '1',
            },
          }),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('New team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, set SpaceDeveloper role and show success', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
          { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{}',
        );
      }),
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
            developers: {
              current: '0',
              desired: '1',
            },
          }),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('New team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, set SpaceAuditor role and show success', async () => {
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
          { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
          '{}',
        );
      }),
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
            auditors: {
              current: '0',
              desired: '1',
            },
          }),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('New team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, when email address contains spaces', async () => {
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
         '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
         { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
         '{}',
        );
      }),
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
    );

    const response = await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: ' jeff @jeff.com ',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
            auditors: {
              current: '0',
              desired: '1',
            },
          }),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('New team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should invite the user, and add them to accounts', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, () => {
        return new HttpResponse(
         '{"metadata": {"guid": "a7aff246-5f5b-4cf8-87d8-f316053e4a20"}}',
         { status: 201 },
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/billing_managers/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
          '{}',
          );
        }
      }),
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
        if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/jeff@jeff.com/)) {
          return new HttpResponse(
            uaaData.noFoundUsersByEmail,
          );
        }
      }),
      http.post(`${ctx.app.accountsAPI}/users/`, () => {
        return new HttpResponse(
          '',
          { status: 201 },
        );
      }),
    );

    await orgUsers.inviteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      },
      {
        email: 'jeff@jeff.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            billing_managers: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );
  });

  it('should fail if the user does not exist in org', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
    );

    await expect(
      orgUsers.resendInvitation(
        ctx,
        {
          organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
          userGUID: 'not-existing-user',
        },
        {},
      ),
    ).rejects.toThrow(/user not found/);
  });

  it('should resend user invite', async () => {

    server.use(
      http.post(`${ctx.app.uaaAPI}/invite_users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('redirect_uri');
        const q2 = url.searchParams.get('client_id');
          if (q === 'https://www.cloud.service.gov.uk/next-steps?success' && q2 === 'user_invitation') {
          return new HttpResponse(
            uaaData.invite,
          );
        }
      }),
      http.get(`${ctx.app.uaaAPI}/Users`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('filter');
        if (q?.match(/user@uaa.example.com/)) {
          return new HttpResponse(
            uaaData.usersByEmail,
          );
        }
      }),

      http.post('https://api.notifications.service.gov.uk/v2/notifications/email', () => {
        return new HttpResponse(
          'notify: \'FAKE_NOTIFY_RESPONSE\'',
        );
      }),

      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
    );

    const response = await orgUsers.resendInvitation(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-id-253',
      },
      {},
    );

    expect(response.body).toContain('Team member successfully invited');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the user delete page', async () => {
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
    );

    const response = await orgUsers.confirmDeletion(ctx, {
      organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      userGUID: 'uaa-user-edit-123456',
    });

    expect(response.body).toContain('Confirm user deletion');
  });

  it('should throw a not found error when API returns none matching users', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
    );

    await expect(
      orgUsers.confirmDeletion(ctx, {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'NOT-EXISTING',
      }),
    ).rejects.toThrowError('User not found');
  });

  it('should update the user, set BillingManager role and show success - User Delete', async () => {

    server.use(
      http.delete(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/users/5ff19d4c-8fa0-4d74-94e0-52eac86d55a8`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '',
            { status: 200 },
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
    );

    const response = await orgUsers.deleteUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: '5ff19d4c-8fa0-4d74-94e0-52eac86d55a8',
      },
      {},
    );

    expect(response.body).toContain('Team member successfully deleted');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the user edit page', async () => {

    server.use(
      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          uaaData.usersByEmail,
        );
      }),
      http.get(`${ctx.app.accountsAPI}/users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          `{
            "user_uuid": "uaa-user-edit-123456",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }`,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),

      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForSpace,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForSpace,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.editUser(ctx, {
      organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      userGUID: 'uaa-user-edit-123456',
    });

    const $ = cheerio.load(response.body as string);

    expect(response.body).toContain('Update a team member');
    expect(response.body).toContain('one@user.in.database');
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20][managers]"]:disabled',
      ).length,
    ).toEqual(0);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20]"]:checked',
      ).length,
    ).toEqual(3);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the user edit page with disabled manager checkboxes due to single manager being set', async () => {
    server.use(
      http.get(`${ctx.app.uaaAPI}/Users/uaa-id-253`, () => {
        return new HttpResponse(
          uaaData.usersByEmail,
        );
      }),
      http.get(`${ctx.app.accountsAPI}/users/uaa-id-253`, () => {
        return new HttpResponse(
          `{
            "user_uuid": "uaa-id-253",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }`,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForSpace,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrgWithOneManager,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForSpace,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.editUser(ctx, {
      organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
      userGUID: 'uaa-id-253',
    });

    const $ = cheerio.load(response.body as string);

    expect(response.body).toContain('Update a team member');
    expect(response.body).toContain('one@user.in.database');
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20][managers]"]:disabled',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="hidden"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20][managers][desired]"]',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20][billing_managers]"]:disabled',
      ).length,
    ).toEqual(1);
    expect(
      $(
        'input[type="checkbox"][name^="org_roles[a7aff246-5f5b-4cf8-87d8-f316053e4a20]"]:checked',
      ).length,
    ).toEqual(3);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should fail to show the user edit page due to not existing user', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    await expect(
      orgUsers.editUser(ctx, {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'not-existing-user',
      }),
    ).rejects.toThrow(/user not found/);
  });

  it('should fail to show the user edit page due to not existing paas-accounts user', async () => {

    server.use(
      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          uaaData.usersByEmail,
        );
      }),
      http.get(`${ctx.app.accountsAPI}/users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          '',
          { status: 404 },
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    await expect(
      orgUsers.editUser(ctx, {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      }),
    ).rejects.toThrow(/user not found/);
  });

  it('should show error when user does not exist in UAA - User Update', async () => {

    server.use(
      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          '',
          { status:404 },
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    await expect(
      orgUsers.editUser(ctx,
        {
          organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
          userGUID: 'uaa-user-edit-123456',
        },
      ),
    ).rejects.toThrowError(/user not found in UAA/);
  });

  it('should show error when user does not exist in CF - User Edit', async () => {

    server.use(
      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          '',
          { status:404 },
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    await expect(
      orgUsers.updateUser(
        ctx,
        {
          organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
          userGUID: 'NOT_FOUND',
        },
        {},
      ),
    ).rejects.toThrowError(/user not found in CF/);
  });

  it('should show error when user does not exist in UAA - User Edit', async () => {

    server.use(
      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          '',
          { status:404 },
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    await expect(
      orgUsers.updateUser(ctx,
        {
          organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
          userGUID: 'uaa-user-edit-123456',
        },
        {},
      ),
    ).rejects.toThrowError(/user not found in UAA/);
  });

  it('should show error when no roles selected - User Edit', async () => {

    server.use(
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/billing_managers/uaa-user-edit-123456`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),

      http.get(`${ctx.app.uaaAPI}/Users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          JSON.stringify({
            ...JSON.parse(uaaData.user),
            id: 'uaa-user-edit-123456',
            origin: 'custom-origin-1',
          }),
        );
      }),
      http.get(`${ctx.app.accountsAPI}/users/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          `{
            "user_uuid": "uaa-user-edit-123456",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }`,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        email: 'jeff@jefferson.com',
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('At least one organisation or space level role should be selected');
    expect(response.status).toEqual(400);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, set BillingManager role and show success - User Edit', async () => {

    server.use(
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/billing_managers/uaa-user-edit-123456`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            billing_managers: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, remove BillingManager role and show success - User Edit', async () => {

    server.use(
      http.delete(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/billing_managers/uaa-id-253`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-id-253',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            managers: {
              current: '1',
              desired: '1',
            },
            billing_managers: {
              current: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );
    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, set OrgManager role and show success - User Edit', async () => {

    server.use(
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/managers/uaa-user-edit-123456`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            managers: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Team member details successfully updated');
  });

  it('should update the user, remove OrgManager role and show success - User Edit', async () => {

    server.use(
      http.delete(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/managers/uaa-user-changeperms-123456`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-changeperms-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            managers: {
              current: '1',
            },
            auditors: {
              current: '1',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );
    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, set OrgAuditor role and show success - User Edit', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/auditors/uaa-user-edit-123456`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            auditors: {
              current: '0',
              desired: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, remove OrgAuditor role and show success - User Edit', async () => {

    server.use(
      http.delete(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/auditors/uaa-id-253`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('recursive');
        if (q === 'true') {
          return new HttpResponse(
            '{}',
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-id-253',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({
            managers: {
              current: '1',
              desired: '1',
            },
            auditors: {
              current: '1',
            },
          }),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({}),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, set SpaceManager role and show success - User Edit', async () => {

    server.use(
      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/managers/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          '{}',
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
            managers: {
              current: '0',
              desired: '1',
            },
          }),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, set SpaceDeveloper role and show success - User Edit', async () => {

    server.use(
      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/developers/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          '{}',
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
            developers: {
              current: '0',
              desired: '1',
            },
          }),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should update the user, set SpaceAuditor role and show success - User Edit', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.put(`${ctx.app.cloudFoundryAPI}/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/auditors/uaa-user-edit-123456`, () => {
        return new HttpResponse(
          '{}',
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/user_roles`, () => {
        return new HttpResponse(
          cfData.userRolesForOrg,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/a7aff246-5f5b-4cf8-87d8-f316053e4a20/spaces`, () => {
        return new HttpResponse(
          cfData.spaces,
        );
      }),
    );

    const response = await orgUsers.updateUser(
      ctx,
      {
        organizationGUID: 'a7aff246-5f5b-4cf8-87d8-f316053e4a20',
        userGUID: 'uaa-user-edit-123456',
      },
      {
        org_roles: {
          'a7aff246-5f5b-4cf8-87d8-f316053e4a20': composeOrgRoles({}),
        },
        space_roles: {
          '5489e195-c42b-4e61-bf30-323c331ecc01': composeSpaceRoles({
            auditors: {
              current: '0',
              desired: '1',
            },
          }),
          'bc8d3381-390d-4bd7-8c71-25309900a2e3': composeSpaceRoles({}),
        },
      },
    );

    expect(response.body).toContain('Team member details successfully updated');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });
});
