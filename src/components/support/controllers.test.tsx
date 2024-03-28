import jwt from 'jsonwebtoken';
import { merge } from 'lodash-es';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { orgRole } from '../../lib/cf/test-data/roles';
import { wrapV3Resources } from '../../lib/cf/test-data/wrap-resources';
import * as uaaData from '../../lib/uaa/uaa.test.data';
import { IContext } from '../app';
import { createTestContext } from '../app/app.test-helpers';
import { Token } from '../auth';

import * as controller from './controllers';

const token = jwt.sign(
  {
    exp: 2535018460,
    origin: 'uaa',
    scope: [],
    user_id: uaaData.userId,
  },
  'secret',
);

let ctx: IContext = createTestContext({
  linkTo: (name: any, params: any) =>
    `${name}/${params ? params.rangeStart : ''}`,
  token: new Token(token, ['secret']),
});

describe(controller.HandleContactUsFormPost, () => {
  const handlers = [
    http.post(`${ctx.app.zendeskConfig.remoteUri}`, () => {
      return new HttpResponse('{}');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleContactUsFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      message: undefined,
      department_agency: undefined,
      service_team: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your message');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter your message');
    expect(response.body).toContain('Enter your department or agency');
    expect(response.body).toContain('Enter your service or team');
  });

  it('should create a zendesk ticket correctly', async () => {
    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return new HttpResponse('{}',{ status: 201 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleContactUsFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Comment',
      department_agency: 'Naming Authority',
      service_team: 'Digital',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });
});

describe(controller.HandleHelpUsingPaasFormPost, () => {
  const handlers = [
    http.post(`${ctx.app.zendeskConfig.remoteUri}`, () => {
      return new HttpResponse('{}');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleHelpUsingPaasFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      message: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your message');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter your message');
  });

  it('should create a zendesk ticket correctly', async () => {
    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return new HttpResponse('{}',{ status: 201 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleHelpUsingPaasFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      paas_organisation_name: '__FAKE_ORG__',
      message: 'Comment',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });

  it('should create a zendesk ticket correctly when no org has been provided', async () => {
    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return new HttpResponse('{}',{ status: 201 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleHelpUsingPaasFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Comment',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });
});

describe(controller.HandleSomethingWrongWithServiceFormPost, () => {
  const handlers = [
    http.post(`${ctx.app.zendeskConfig.remoteUri}`, () => {
      return new HttpResponse('{}');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: undefined,
      email: undefined,
      message: undefined,
      affected_paas_organisation: undefined,
      impact_severity: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).not.toContain('We have received your message');
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Enter your full name');
    expect(response.body).toContain('Enter an email address in the correct format');
    expect(response.body).toContain('Enter the name of the affected organisation');
    expect(response.body).toContain('Select the severity of the impact');
    expect(response.body).toContain('Enter your message');
  });

  it('should create a zendesk ticket correctly', async () => {
    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return new HttpResponse('{}',{ status: 201 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Comment',
      affected_paas_organisation: '__fake_org__',
      impact_severity: 'critical',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });

  it('should create a ticket with the word "URGENT" toward the front when a support form severity is "service_down"', async () => {

    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, async({ request }) => {
        const data:any = await request.json();
        const isUrgent = () => {
          const subject = data['ticket']['subject'] as string;

return subject.substr(0, (subject.length/2)).includes('URGENT');
        };
        if(isUrgent()) {
          return new HttpResponse('{}',{ status: 201 });
        }

return new HttpResponse(null,{ status: 404 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Help my service is down',
      affected_paas_organisation: '__fake_org__',
      impact_severity: 'service_down',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });

  it('should create a ticket with the word "URGENT" toward the front when a support form severity is "service_downgraded"', async () => {

    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, async({ request }) => {
        const data:any = await request.json();
        const isUrgent = () => {
          const subject = data['ticket']['subject'] as string;

return subject.substr(0, (subject.length/2)).includes('URGENT');
        };
        if(isUrgent()) {
          return new HttpResponse('{}',{ status: 201 });
        }

return new HttpResponse(null,{ status: 404 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Help my service is down',
      affected_paas_organisation: '__fake_org__',
      impact_severity: 'service_down',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });

  it('should create a ticket with the word "URGENT" toward the front when a support form severity is "cannot_operate_live"', async () => {

    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, async({ request }) => {
        const data:any = await request.json();
        const isUrgent = () => {
          const subject = data['ticket']['subject'] as string;

return subject.substr(0, (subject.length/2)).includes('URGENT');
        };
        if(isUrgent()) {
          return new HttpResponse('{}',{ status: 201 });
        }

return new HttpResponse(null,{ status: 404 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Help my service is down',
      affected_paas_organisation: '__fake_org__',
      impact_severity: 'service_down',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });

  it('should NOT create a ticket with the word "URGENT" toward the front when a support form severity is "cannot_operate_dev"', async () => {

    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, async({ request }) => {
        const data:any = await request.json();
        const isUrgent = () => {
          const subject = data['ticket']['subject'] as string;

return !subject.includes('URGENT');
        };
        if(!isUrgent()) {
          return new HttpResponse('{}',{ status: 201 });
        }

return new HttpResponse(null,{ status: 404 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Help my service is down',
      affected_paas_organisation: '__fake_org__',
      impact_severity: 'service_down',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });

  it('should NOT create a ticket with the word "URGENT" toward the front when a support form severity is "other"', async () => {

    server.use(
      http.post(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, async({ request }) => {
        const data:any = await request.json();
        const isUrgent = () => {
          const subject = data['ticket']['subject'] as string;

return !subject.includes('URGENT');
        };
        if(!isUrgent()) {
          return new HttpResponse('{}',{ status: 201 });
        }

return new HttpResponse(null,{ status: 404 });
      }),
      http.put(`${ctx.app.zendeskConfig.remoteUri}/tickets.json`, () => {
        return HttpResponse.json({ id:111 },{ status: 201 });
      }),
    );

    const response = await controller.HandleSomethingWrongWithServiceFormPost(ctx, {}, {
      name: 'Jeff',
      email: 'jeff@example.gov.uk',
      message: 'Help my service is down',
      affected_paas_organisation: '__fake_org__',
      impact_severity: 'service_down',
    } as any);

    expect(response.status).toBeUndefined();
    expect(response.body).toContain('We have received your message');
  });
});

describe(controller.HandleSupportSelectionFormPost, () => {
  const handlers = [
    http.post(`${ctx.app.zendeskConfig.remoteUri}`, () => {
      return new HttpResponse('{}');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should throw validation errors when missing data has been submited', async () => {
    const response = await controller.HandleSupportSelectionFormPost(ctx, {}, {
      support_type: undefined,
    } as any);

    expect(response.status).toEqual(400);
    expect(response.body).toContain('Error');
    expect(response.body).toContain('Select which type of support your require');
  });

  it('should carry on', async () => {
    const response = await controller.HandleSupportSelectionFormPost(ctx, {}, {
      support_type: 'general',
    } as any);

    expect(response.status).toBeUndefined();
  });
});

describe(controller.fetchRequesterDetailsAndRoles, () => {
  const handlers = [
    http.post(`${ctx.app.zendeskConfig.remoteUri}`, () => {
      return new HttpResponse('{}');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should return the UAA user and their organisational roles', async () => {

    const orgGUID = 'org-guid-1';
    const orgName = 'org-1';
    const userGUID = 'user-guid';
    const userRole = 'organization_manager';
    const expectedRequesterData = JSON.parse(uaaData.user);

    // create mock context with mock UAA user
    ctx = merge(ctx, {
      session: {
        passport: {
          user: token,
        },
      },
    });

    server.use(
      http.get('https://example.com/uaa/token_keys', () => {
        return HttpResponse.json(
          { keys: [{ value: 'secret' }] },
        );
      }),
      http.get(`https://example.com/uaa/Users/${uaaData.userId}`, () => {
        return new HttpResponse(
          uaaData.user,
        );
      }),
      http.post('https://example.com/uaa/oauth/token', ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('grant_type');
        if (q === 'client_credentials') {
          return new HttpResponse('{"access_token": "FAKE_ACCESS_TOKEN"}');
        }
      }),
      http.get('https://example.com/api/v3/roles', () => {
        return new HttpResponse(
          JSON.stringify(wrapV3Resources(
            orgRole(userRole, orgGUID, userGUID),
          )),
        );
      }),
      http.get(`https://example.com/api/v2/organizations/${orgGUID}`, () => {
        return new HttpResponse(
          JSON.stringify(merge(
            defaultOrg(),
            { metadata: { guid: orgGUID }, entity: { name: orgName } },
          )),
        );
      }),
    );
    const user = await controller.fetchRequesterDetailsAndRoles(ctx);

    expect(user.acc_email).toBe(expectedRequesterData.emails[0].value);
    expect(user.region).toBe(ctx.app.location.toLowerCase());
    expect(user.roles).toContainEqual({
      orgGuid: orgGUID,
      orgName: orgName,
      roleType: userRole,
    });
  });
});

describe(controller.requesterDetailsContent , () => {

  it('should output that user is not logged', () => {
    const requester = {};
    const output = controller.requesterDetailsContent(requester);
    expect(output).toBe('Requester not logged in');
  });

  it('should output user email, organisation roles and organisation details', () => {
    const requester = {
      acc_email: 'test@testing.com',
      region: 'ireland',
      roles: [
        {
          orgGuid: 'abc-def',
          orgName: 'org 1',
          roleType: 'regular',
        },
        {
          orgGuid: 'ghi-jkl',
          orgName: 'org 2',
          roleType: 'large',
        },
      ],
    };
    const output = controller.requesterDetailsContent(requester);
    expect(output.trim()).toContain(
      'Role of regular in org 1: https://admin.cloud.service.gov.uk/organisations/abc-def',
    );
    expect(output.trim()).toContain('Role of large in org 2: https://admin.cloud.service.gov.uk/organisations/ghi-jkl');
    expect(output.trim()).toContain('Account email address: test@testing.com');
  });

  it('should output that the requester has no roles', () => {
    const requester = {
      acc_email: 'test@testing.com',
      roles: [],
    };
    const output = controller.requesterDetailsContent(requester);
    expect(output.trim()).toContain('No organisation roles found');
  });

  it('should output the correct org url based on region', () => {
    const requester = {
      acc_email: 'test@testing.com',
      region: 'london',
      roles: [
        {
          orgGuid: 'abc-def',
          orgName: 'org 1',
          roleType: 'regular',
        },
      ],
    };
    const output = controller.requesterDetailsContent(requester);
    expect(output.trim()).toContain(
      'Role of regular in org 1: https://admin.london.cloud.service.gov.uk/organisations/abc-def',
    );
  });
});

describe(controller.handleStaticIPs, () => {
  it('should carry on', async () => {
    const response = await controller.handleStaticIPs(ctx);

    expect(response.status).toBeUndefined();
  });
});

describe(controller.handleCrownMoU, () => {
  it('should carry on', async () => {
    const response = await controller.handleCrownMoU(ctx);

    expect(response.status).toBeUndefined();
  });
});

describe(controller.handleNonCrownMoU, () => {
  it('should carry on', async () => {
    const response = await controller.handleNonCrownMoU(ctx);

    expect(response.status).toBeUndefined();
  });
});
