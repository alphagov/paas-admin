import { format } from 'date-fns';
import lodash from 'lodash-es';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { DATE_TIME } from '../../layouts';
import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as data from '../../lib/cf/cf.test.data';
import { auditEventForAutoscaler, auditEvent as defaultAuditEvent } from '../../lib/cf/test-data/audit-event';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { wrapV3Resources } from '../../lib/cf/test-data/wrap-resources';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { viewServiceEvent, viewServiceEvents } from '.';

const organizationGUID = '6e1ca5aa-55f1-4110-a97f-1f3473e771b9';
const spaceGUID = '38511660-89d9-4a6e-a889-c32c7e94f139';
const serviceGUID = '0d632575-bb06-4ea5-bb19-a451a9644d92';

const ctx: IContext = createTestContext();

describe('service event', () => {

  const event = defaultAuditEvent();

  const handlers = [
    http.get(`${ctx.app.accountsAPI}/*`, () => {
      return new HttpResponse();
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/service_instances/${serviceGUID}`, () => {
      return new HttpResponse(data.serviceInstance);
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/user_provided_service_instances`, ({ request }) => {
      const url = new URL(request.url);
      const q = url.searchParams.get('q');
      if (q === `space_guid:${spaceGUID}`) {
        return new HttpResponse(data.userServices);
      }
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
      return new HttpResponse(data.space);
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}`, () => {
      return HttpResponse.json(defaultOrg());
    }),
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should show an event', async () => {
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`, () => {
        return new HttpResponse(
          data.serviceInstance,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`, () => {
        return new HttpResponse(
          data.serviceString,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(event),
        );
      }),
    );

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

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
      http.get(`${ctx.app.cloudFoundryAPI}/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`, () => {
        return new HttpResponse(data.serviceInstance);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`, () => {
        return new HttpResponse(data.serviceString);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(event),
        );
      }),
      http.get(`${ctx.app.accountsAPI}/users/${event.actor.guid}`, () => {
        return new HttpResponse(
          `{
            "user_uuid": "${event.actor.guid}",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }`,
        );
      }),

    );

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

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

  it('should show the name event actor if it is not a user', async () => {
    const event = defaultAuditEvent();

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`, () => {
        return new HttpResponse(data.serviceInstance);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`, () => {
        return new HttpResponse(data.serviceString);
      }),
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

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

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

  it('should show the GUID of the event actor if it is not a UUID', async () => {
    const event = defaultAuditEvent();

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`, () => {
        return new HttpResponse(data.serviceInstance);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`, () => {
        return new HttpResponse(data.serviceString);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(auditEventForAutoscaler()),
        );
      }),

    );
      // nockCF
      //   .get('/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1')
      //   .reply(200, data.serviceInstance)

      //   .get('/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422')
      //   .reply(200, data.serviceString)

      //   .get(`/v3/audit_events/${event.guid}`)
      //   .reply(
      //     200,
      //     JSON.stringify(auditEventForAutoscaler()),
        //);

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

    expect(response.body).toContain(/* Actor       */ '<code>app_autoscaler</code>');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });
});

describe('service events', () => {

  const handlers = [
    http.get(`${ctx.app.cloudFoundryAPI}/v2/service_instances/${serviceGUID}`, () => {
      return new HttpResponse(data.serviceInstance);
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
      return new HttpResponse(data.space);
    }),
    http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}`, () => {
      return HttpResponse.json(defaultOrg());
    }),
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('when there are no audit events to display', () => {
    beforeEach(() => {
      server.use(
        http.get(`${ctx.app.cloudFoundryAPI}/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`, () => {
          return new HttpResponse(data.serviceInstance);
        }),
        http.get(`${ctx.app.cloudFoundryAPI}/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`, () => {
          return new HttpResponse(data.serviceString);
        }),
        http.get(`${ctx.app.cloudFoundryAPI}/v2/user_provided_service_instances`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('q');
          if (q === `space_guid:${spaceGUID}`) {
            return new HttpResponse(data.userServices);
          }
        }),
        http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('target_guids');
          if (q === `${serviceGUID}`) {
            return new HttpResponse(JSON.stringify(wrapV3Resources()));
          }
        }),
      );
    });

    it('should show a helpful message on the service events page', async () => {
      const response = await viewServiceEvents(ctx, {
        organizationGUID,
        serviceGUID,
        spaceGUID,
      });

      expect(response.body).toContain('Service name-1508 Events');
      expect(response.body).toContain('0 total events');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });

  describe('when there are some audit events to display', () => {
    beforeEach(() => {
      server.use(
        http.get(`${ctx.app.cloudFoundryAPI}/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`, () => {
          return new HttpResponse(data.serviceInstance);
        }),
        http.get(`${ctx.app.cloudFoundryAPI}/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`, () => {
          return new HttpResponse(data.serviceString);
        }),
        http.get(`${ctx.app.cloudFoundryAPI}/v2/user_provided_service_instances`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('q');
          if (q === `space_guid:${spaceGUID}`) {
            return new HttpResponse(data.userServices);
          }
        }),
        http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('target_guids');
          if (q === `${serviceGUID}`) {
            return new HttpResponse(
              JSON.stringify(
                lodash.merge(
                  wrapV3Resources(
                    lodash.merge(defaultAuditEvent(), {
                      type: 'audit.service_instance.delete',
                    }),
                    lodash.merge(defaultAuditEvent(), {
                      type: 'audit.service_instance.update',
                    }),
                    lodash.merge(defaultAuditEvent(), {
                      type: 'audit.service_instance.create',
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
        http.get(`${ctx.app.accountsAPI}/users`, () => {
          return new HttpResponse(
            `{
              "users": [{
                "user_uuid": "${defaultAuditEvent().actor.guid}",
                "user_email": "one@user.in.database",
                "username": "one@user.in.database"
              }]
            }`,
          );
        }),
      );
    });

    it('should show a table of events on the service events page', async () => {
      const response = await viewServiceEvents(ctx, {
        organizationGUID,
        page: 1,
        serviceGUID,
        spaceGUID,
      });

      expect(response.body).toContain('Service name-1508 Events');

      expect(response.body).toContain('Displaying page 1 of 2702');
      expect(response.body).toContain('1337 total events');
      expect(response.body).toContain('<span>Previous page</span>');
      expect(response.body).not.toContain('<span>Next page</span>');
      expect(response.body).toContain('Next page');

      expect(response.body).toContain('one@user.in.database');
      expect(response.body).toContain('some unknown actor');
      expect(response.body).toContain('<code>app_autoscaler</code>');

      expect(response.body).toContain('Deleted service instance');
      expect(response.body).toContain('Updated service instance');
      expect(response.body).toContain('Created service instance');
      expect(response.body).toContain('<code>some unknown event type</code>');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });
});

describe('service event - CUPS', () => {
  const customSpaceGUID = '38511660-89d9-4a6e-a889-c32c7e94f139';
  const customServiceGUID = '54e4c645-7d20-4271-8c27-8cc904e1e7ee';

  const handlers = [
    http.get(`${ctx.app.cloudFoundryAPI}`, () => {
      return new HttpResponse();
    }),
    http.get(`${ctx.app.accountsAPI}/*`, () => {
      return new HttpResponse();
    }),
  ];

  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => {
    server.resetHandlers();
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/service_instances/${customServiceGUID}`, () => {
        return new HttpResponse(data.serviceInstance);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/${spaceGUID}`, () => {
        return new HttpResponse(data.space);
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/${organizationGUID}`, () => {
        return HttpResponse.json(defaultOrg());
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/user_provided_service_instances`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('q');
        if (q === `space_guid:${customSpaceGUID}`) {
          return new HttpResponse(
            data.userServices,
          );
        }
      }),
    );
  });
  afterAll(() => server.close());

  describe('when there are no audit events to display', () => {
    it('should show a helpful message on the service events page', async () => {

      server.use(
        http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('target_guids');
          if (q === `${customServiceGUID}`) {
            return new HttpResponse(
              JSON.stringify(wrapV3Resources()),
            );
          }
        }),
      );

      const response = await viewServiceEvents(ctx, {
        organizationGUID,
        serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
        spaceGUID,
      });

      expect(response.body).toContain('Service name-1508 Events');
      expect(response.body).not.toContain('Displaying page 1 of 1');
      expect(response.body).toContain('0 total events');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });

  it('should show an event for CUPS', async () => {
    const event = defaultAuditEvent();

    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/a595fe2f-01ff-4965-a50c-290258ab8582`, () => {
        return new HttpResponse(
          JSON.stringify(event),
        );
      }),
    );

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

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
});
