import { format } from 'date-fns';
import lodash from 'lodash-es';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';


import { DATE_TIME } from '../../layouts';
import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as data from '../../lib/cf/cf.test.data';
import { app as defaultApp } from '../../lib/cf/test-data/app';
import { auditEventForAutoscaler, auditEvent as defaultAuditEvent } from '../../lib/cf/test-data/audit-event';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import {
  wrapResources,
  wrapV3Resources,
} from '../../lib/cf/test-data/wrap-resources';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import * as spaces from '.';

const ctx: IContext = createTestContext();
const spaceGUID = 'bc8d3381-390d-4bd7-8c71-25309900a2e3';
const organizationGUID = '3deb9f04-b449-4f94-b3dd-c73cefe5b275';

describe('space event', () => {

  const handlers = [
    http.get(`${ctx.app.accountsAPI}/*`, () => {
      return new HttpResponse('');
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
      return new HttpResponse(
        data.space,
      );
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}`, () => {
      return HttpResponse.json(
        defaultOrg(),
      );
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());


  it('should show an event', async () => {
    const event = defaultAuditEvent();

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}`, () => {
        return HttpResponse.json(
          defaultOrg(),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(event),
        );
      }),
    );

    const response = await spaces.viewSpaceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Space name-2064 Event details');

    expect(response.body).toContain(
      /* DateTime    */ format(new Date(event.updated_at), DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'admin');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the email of the event actor if it is a user with an email', async () => {
    const event = defaultAuditEvent();

    server.use(
      http.get(`${ctx.app.accountsAPI}/users/${event.actor.guid}`, () => {
        return new HttpResponse(
          `{
            "user_uuid": "${event.actor.guid}",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }`,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(event),
        );
      }),
    );

    const response = await spaces.viewSpaceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Space name-2064 Event details');

    expect(response.body).toContain(
      /* DateTime    */ format(new Date(event.updated_at), DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'one@user.in.database');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the name of event actor if it is not a user', async () => {
    const event = defaultAuditEvent();
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(
            lodash.merge(event, {
              actor: { name: 'unknown-actor', type: 'unknown' },
            }),
          ),
        );
      }),
    );

    const response = await spaces.viewSpaceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Space name-2064 Event details');

    expect(response.body).toContain(
      /* DateTime    */ format(new Date(event.updated_at), DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'unknown-actor');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the guid of the event actor if it is not a UUID', async () => {
    const event = auditEventForAutoscaler();

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(event),
        );
      }),
    );

    const response = await spaces.viewSpaceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Space name-2064 Event details');
    expect(response.body).toContain(/* Actor       */ '<code>app_autoscaler</code>');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });
});

describe('spaces test suite', () => {
  const handlers = [
    http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}`, () => {
      return HttpResponse.json(
        defaultOrg(),
      );
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());


  it('should show the spaces pages', async () => {
    const secondSpace = '5489e195-c42b-4e61-bf30-323c331ecc01';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users/*`, () => {
        return new HttpResponse(
          JSON.stringify({
            user_email: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
            user_uuid: 'uaa-id-253',
            username: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
          }),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}/spaces`, () => {
        return new HttpResponse(data.spaces);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}/user_roles`, () => {
        return new HttpResponse(data.users);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019`, () => {
        return new HttpResponse(data.spaceQuota);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}/apps`, () => {
        return new HttpResponse(
          JSON.stringify(
            wrapResources(
              lodash.merge(defaultApp(), { entity: { name: 'first-app' } }),
              lodash.merge(defaultApp(), {
                entity: { name: 'second-app', state: 'RUNNING' },
              }),
            ),
          ),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}/service_instances`, () => {
        return new HttpResponse(data.services);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/quota_definitions/ORG-QUOTA-GUID`, () => {
        return new HttpResponse(
          data.organizationQuota,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${secondSpace}/apps`, () => {
        return new HttpResponse(
          JSON.stringify(
            wrapResources(
              lodash.merge(defaultApp(), {
                entity: { name: 'second-space-app' },
              }),
            ),
          ),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${secondSpace}/service_instances`, () => {
        return new HttpResponse(data.services);
      }),
    );

    const response = await spaces.listSpaces(ctx, { organizationGUID });

    expect(response.body).toContain('Assigned quota');
    expect(response.body).toContain('name-1996');
    expect(response.body).not.toMatch(
      /Using\s+1[.]00\s<abbr role="tooltip" tabindex="0" data-module="tooltip" aria-label="gibibytes">GiB<\/abbr>\s+of memory/m,
    );

    expect(response.body).toContain('Spaces');
    expect(response.body).toMatch(/0*\s.*B.*\s+of\s+20[.]00.*GiB/m);
    expect(response.body).toMatch(/1[.]00.*GiB.*\s+of\s+no limit/m);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show list of applications in space', async () => {
    const appGuid = 'efd23111-72d1-481e-8168-d5395e0ea5f0';
    const appName = 'name-2064';

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}/apps`, () => {
        return new HttpResponse(
          JSON.stringify(
            wrapResources(
              lodash.merge(defaultApp(), {
                entity: { name: appName },
                metadata: { guid: appGuid },
              }),
            ),
          ),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/apps/${appGuid}/summary`, () => {
        return new HttpResponse(
          data.appSummary,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
        return new HttpResponse(
          data.space,
        );
      }),
    );

    const response = await spaces.listApplications(ctx, {
      organizationGUID,
      spaceGUID,
    });

    expect(response.body).toContain(`Space ${appName} Applications`);
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show list of services in space', async () => {

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}/service_instances`, () => {
        return new HttpResponse(
          data.services,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/user_provided_service_instances`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('q');
          if (q === `space_guid:${spaceGUID}`) {
          return new HttpResponse(
            data.services,
          );
        }
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/service_plans/fcf57f7f-3c51-49b2-b252-dc24e0f7dcab`, () => {
        return new HttpResponse(
          data.servicePlan,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/services/775d0046-7505-40a4-bfad-ca472485e332`, () => {
        return new HttpResponse(
          data.serviceString,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
        return new HttpResponse(
          data.space,
        );
      }),
    );

    const response = await spaces.listBackingServices(ctx, {
      organizationGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Space name-2064 Backing services');
    expect(response.body).toContain('name-2104');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  describe('viewing events', () => {
    beforeEach(() => {
      server.use(
        http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
          return new HttpResponse(
            data.space,
          );
        }),
      );
    });

    describe('when there are no audit events to display', () => {
      beforeEach(() => {
        server.use(
          http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events`, ({ request }) => {
            const url = new URL(request.url);
            const q = url.searchParams.get('space_guids');
            if (q === `${spaceGUID}`) {
              return new HttpResponse(JSON.stringify(wrapV3Resources()));
            }
          }),
        );
      });

      it('should show a helpful message on the application events page', async () => {
        const response = await spaces.viewSpaceEvents(ctx, {
          organizationGUID,
          spaceGUID,
        });

        expect(response.body).toContain('Space name-2064 Events');
        expect(response.body).toContain('0 total events');
        expect(
          spacesMissingAroundInlineElements(response.body as string),
        ).toHaveLength(0);
      });
    });

    describe('when there are audit events to display', () => {
      beforeEach(() => {
        server.use(
          http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events`, ({ request }) => {
            const url = new URL(request.url);
            const q = url.searchParams.get('space_guids');
            if (q === `${spaceGUID}`) {
              return new HttpResponse(
                JSON.stringify(
                  lodash.merge(
                    wrapV3Resources(
                      lodash.merge(defaultAuditEvent(), {
                        type: 'audit.app.delete-request',
                      }),
                      lodash.merge(defaultAuditEvent(), {
                        type: 'audit.app.restage',
                      }),
                      lodash.merge(defaultAuditEvent(), {
                        target: {
                          guid: defaultAuditEvent().actor.guid,
                          name: defaultAuditEvent().actor.name,
                          type: 'user',
                        },
                        type: 'audit.app.update',
                      }),
                      lodash.merge(defaultAuditEvent(), {
                        target: {
                          guid: 'unknown',
                          name: 'an-application',
                          type: 'app',
                        },
                        type: 'audit.app.create',
                      }),
                      lodash.merge(defaultAuditEvent(), {
                        actor: {
                          guid: 'unknown',
                          name: 'some unknown actor',
                          type: 'unknown',
                        },
                        type: 'some unknown event type',
                      }),
                      auditEventForAutoscaler(),
                    ),
                    {
                      pagination: {
                        next: { href: '/link-to-next-page' },
                        total_pages: 2702,
                        total_results: 1337,
                      },
                    },
                  ),
                ),
              );
            }
          }),
          http.get(`${ctx.app.accountsAPI}/users`, ({ request }) => {
            const url = new URL(request.url);
            const q = url.searchParams.get('uuids');
            if (q === `${defaultAuditEvent().actor.guid}`) {
              return new HttpResponse(
                `{
                  "users": [{
                    "user_uuid": "${defaultAuditEvent().actor.guid}",
                    "user_email": "one@user.in.database",
                    "username": "one@user.in.database"
                  }]
                }`,
              );
            }
          }),
        );
      });

      it('should show a table of events on the application events page', async () => {
        const response = await spaces.viewSpaceEvents(ctx, {
          organizationGUID,
          page: 1,
          spaceGUID,
        });

        expect(response.body).toContain('Space name-2064 Events');
        expect(response.body).toContain('1337 total events');
        expect(response.body).toContain('<span>Previous page</span>');
        expect(response.body).not.toContain('<span>Next page</span>');
        expect(response.body).toContain('Next page');

        expect(response.body).toContain('one@user.in.database');
        expect(response.body).toContain('some unknown actor');
        expect(response.body).toContain('<code>app_autoscaler</code>');

        expect(response.body).toContain('Requested deletion of application');
        expect(response.body).toContain('Restaged application');
        expect(response.body).toContain('Updated application');

        expect(response.body).toContain('an-application');
        expect(response.body).toContain('Created application');

        expect(response.body).toContain('<code>some unknown event type</code>');
        expect(
          spacesMissingAroundInlineElements(response.body as string),
        ).toHaveLength(0);
      });
    });
  });
});

describe('suspended organisation spaces', () => {
  const handlers = [
    http.get(`${ctx.app.accountsAPI}`, () => {
      return new HttpResponse('');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  beforeEach(() => {
    server.resetHandlers();
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}`, () => {
        return new HttpResponse(
          JSON.stringify(
            lodash.merge(defaultOrg(), { metadata: { guid: 'suspended-guid' }, entity: { name: 'a-suspended-org', status: 'suspended' } }),
          ),
        );
      }),
    );
  });
  afterAll(() => server.close());


  it('should show on the spaces pages that the organisation is suspended', async () => {
    const secondSpace = '5489e195-c42b-4e61-bf30-323c331ecc01';

    server.use(
      http.get(`${ctx.app.accountsAPI}/users/*`, () => {
        return HttpResponse.json(
          `{
            user_email: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
            user_uuid: 'uaa-id-253',
            username: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
          }`,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}/spaces`, () => {
        return new HttpResponse(data.spaces);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}/user_roles`, () => {
        return new HttpResponse(data.users);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019`, () => {
        return new HttpResponse(data.spaceQuota);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}/apps`, () => {
        return new HttpResponse(
          JSON.stringify(
            wrapResources(
              lodash.merge(defaultApp(), { entity: { name: 'first-app' } }),
              lodash.merge(defaultApp(), {
                entity: { name: 'second-app', state: 'RUNNING' },
              }),
            ),
          ),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}/service_instances`, () => {
        return new HttpResponse(data.services);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/quota_definitions/ORG-QUOTA-GUID`, () => {
        return new HttpResponse(
          data.organizationQuota,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${secondSpace}/apps`, () => {
        return new HttpResponse(
          JSON.stringify(
            wrapResources(
              lodash.merge(defaultApp(), {
                entity: { name: 'second-space-app' },
              }),
            ),
          ),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${secondSpace}/service_instances`, () => {
        return new HttpResponse(data.services);
      }),
    );

    const response = await spaces.listSpaces(ctx, { organizationGUID });

    expect(response.body).toContain('Suspended');
  });
});
