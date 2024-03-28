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
import { wrapV3Resources } from '../../lib/cf/test-data/wrap-resources';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { viewApplicationEvent, viewApplicationEvents } from '.';

const ctx: IContext = createTestContext();

describe('application event', () => {

  const handlers = [
    http.get(`${ctx.app.accountsAPI}/users/*`, () => {
      return new HttpResponse('');
    }),
    http.get(`${ctx.app.cloudFoundryAPI}`, () => {
      return new HttpResponse('');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/apps/${defaultApp().metadata.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(defaultApp()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139`, () => {
        return new HttpResponse(
          data.space,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9`, () => {
        return HttpResponse.json(
          defaultOrg(),
        );
      }),
    );
  });


  it('should show an event', async () => {
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${defaultAuditEvent().guid}`, () => {
        return new HttpResponse(
          JSON.stringify(defaultAuditEvent()),
        );
      }),
    );

    const event = defaultAuditEvent();

    const response = await viewApplicationEvent(ctx, {
      applicationGUID: defaultApp().metadata.guid,
      eventGUID: event.guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain(
      `Application ${defaultApp().entity.name} Event details`,
    );

    expect(response.body).toContain(
      /* DateTime    */ format(new Date(event.updated_at), DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'admin');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });

  it('should show the email of the event actor if it is a user with an email', async () => {
    const event = defaultAuditEvent();

    server.use(
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

    const response = await viewApplicationEvent(ctx, {
      applicationGUID: defaultApp().metadata.guid,
      eventGUID: defaultAuditEvent().guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain(
      `Application ${defaultApp().entity.name} Event`,
    );

    expect(response.body).toContain(
      /* DateTime    */ format(new Date(event.updated_at), DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'one@user.in.database');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });

  it('should show the name of the event actor if it is not a user', async () => {
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

    const response = await viewApplicationEvent(ctx, {
      applicationGUID: defaultApp().metadata.guid,
      eventGUID: event.guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain(
      `Application ${defaultApp().entity.name} Event details`,
    );

    expect(response.body).toContain(
      /* DateTime    */ format(new Date(event.updated_at), DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'unknown-actor');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });

  it('should show the GUID of the event actor if it is not a UUID', async () => {
    const event = defaultAuditEvent();
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events/${event.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(auditEventForAutoscaler()),
        );
      }),
    );

    const response = await viewApplicationEvent(ctx, {
      applicationGUID: defaultApp().metadata.guid,
      eventGUID: event.guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain(
      `Application ${defaultApp().entity.name} Event details`,
    );

    expect(response.body).toContain(/* Actor */ '<code>app_autoscaler</code>');
  });
});

describe('application events', () => {
  const handlers = [
    http.get(`${ctx.app.accountsAPI}`, () => {
      return new HttpResponse('');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen());
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    server.use(
      http.get(`${ctx.app.cloudFoundryAPI}/v2/apps/${defaultApp().metadata.guid}`, () => {
        return new HttpResponse(
          JSON.stringify(defaultApp()),
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139`, () => {
        return new HttpResponse(
          data.space,
        );
      }),
      http.get(`${ctx.app.cloudFoundryAPI}/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9`, () => {
        return HttpResponse.json(
          defaultOrg(),
        );
      }),
    );
  });

  describe('when there are no audit events to display', () => {

    beforeEach(() => {
      server.use(
        http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('target_guids');
          if (q === `${defaultApp().metadata.guid}`) {
            return new HttpResponse(
              JSON.stringify(wrapV3Resources()),
            );
          }
        }),
      );
    });

    it('should show a helpful message on the application events page', async () => {
      const response = await viewApplicationEvents(ctx, {
        applicationGUID: defaultApp().metadata.guid,
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      });

      expect(response.body).toContain(
        `Application ${defaultApp().entity.name} Events`,
      );
      expect(response.body).toContain('0 total events');
    });
  });

  describe('when there are some audit events to display', () => {
    beforeEach(() => {
      server.use(
        http.get(`${ctx.app.cloudFoundryAPI}/v3/audit_events`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('target_guids');
          if (q === `${defaultApp().metadata.guid}`) {
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
                    lodash.merge(defaultAuditEvent(), { type: 'audit.app.update' }),
                    lodash.merge(defaultAuditEvent(), { type: 'audit.app.create' }),
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
      const response = await viewApplicationEvents(ctx, {
        applicationGUID: defaultApp().metadata.guid,
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        page: 1,
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      });

      expect(response.body).toContain(
        `Application ${defaultApp().entity.name} Events`,
      );

      expect(response.body).toContain('Displaying page 1 of 2702');
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
      expect(response.body).toContain('Created application');
      expect(response.body).toContain('<code>some unknown event type</code>');
      expect(
        spacesMissingAroundInlineElements(response.body as string),
      ).toHaveLength(0);
    });
  });
});
