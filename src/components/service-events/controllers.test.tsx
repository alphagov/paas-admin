import lodash from 'lodash';
import moment from 'moment';
import nock from 'nock';

import { DATE_TIME } from '../../layouts';
import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as data from '../../lib/cf/cf.test.data';
import { auditEvent as defaultAuditEvent, auditEventForAutoscaler } from '../../lib/cf/test-data/audit-event';
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
  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockCF = nock(ctx.app.cloudFoundryAPI);

    nockCF
      .get(`/v2/service_instances/${serviceGUID}`)
      .reply(200, data.serviceInstance)

      .get(`/v2/user_provided_service_instances?q=space_guid:${spaceGUID}`)
      .reply(200, data.userServices)

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)

      .get(`/v2/organizations/${organizationGUID}`)
      .reply(200, defaultOrg());
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.on('response', () => {
      nockCF.done();
    });

    nock.cleanAll();
  });

  it('should show an event', async () => {
    const event = defaultAuditEvent();
    nockCF
      .get(`/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`)
      .reply(200, data.serviceInstance)

      .get(`/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`)
      .reply(200, data.serviceString)

      .get(`/v3/audit_events/${event.guid}`)
      .reply(200, JSON.stringify(event));

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

    expect(response.body).toContain(
      /* DateTime    */ moment(event.updated_at).format(DATE_TIME),
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
    nockCF
      .get(`/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`)
      .reply(200, data.serviceInstance)

      .get(`/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`)
      .reply(200, data.serviceString)

      .get(`/v3/audit_events/${event.guid}`)
      .reply(200, JSON.stringify(event));

    nockAccounts.get(`/users/${event.actor.guid}`).reply(
      200,
      `{
        "user_uuid": "${event.actor.guid}",
        "user_email": "one@user.in.database",
        "username": "one@user.in.database"
      }`,
    );

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

    expect(response.body).toContain(
      /* DateTime    */ moment(event.updated_at).format(DATE_TIME),
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
      nockCF
        .get(`/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`)
        .reply(200, data.serviceInstance)

        .get(`/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`)
        .reply(200, data.serviceString)

        .get(`/v3/audit_events/${event.guid}`)
        .reply(
          200,
          JSON.stringify(
            lodash.merge(event, {
              actor: { name: 'unknown-actor', type: 'unknown' },
            }),
          ),
        );

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID,
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

    expect(response.body).toContain(
      /* DateTime    */ moment(event.updated_at).format(DATE_TIME),
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
      nockCF
        .get(`/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`)
        .reply(200, data.serviceInstance)

        .get(`/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`)
        .reply(200, data.serviceString)

        .get(`/v3/audit_events/${event.guid}`)
        .reply(
          200,
          JSON.stringify(auditEventForAutoscaler()),
        );

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
  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockCF = nock(ctx.app.cloudFoundryAPI);

    nockCF
      .get(`/v2/service_instances/${serviceGUID}`)
      .reply(200, data.serviceInstance)

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)

      .get(`/v2/organizations/${organizationGUID}`)
      .reply(200, defaultOrg());
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.on('response', () => {
  nockCF.done()
});

    nock.cleanAll();
  });

  describe('when there are no audit events to display', () => {
    beforeEach(() => {
      nockCF
        .get(`/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`)
        .reply(200, data.serviceInstance)

        .get(`/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`)
        .reply(200, data.serviceString)

        .get(`/v2/user_provided_service_instances?q=space_guid:${spaceGUID}`)
        .reply(200, data.userServices)

        .get('/v3/audit_events')
        .query({
          order_by: '-updated_at',
          page: 1,
          per_page: 25,
          target_guids: serviceGUID,
        })
        .reply(200, JSON.stringify(wrapV3Resources()));
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
      nockCF
        .get(`/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1`)
        .reply(200, data.serviceInstance)

        .get(`/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422`)
        .reply(200, data.serviceString)

        .get(`/v2/user_provided_service_instances?q=space_guid:${spaceGUID}`)
        .reply(200, data.userServices)

        .get('/v3/audit_events')
        .query({
          order_by: '-updated_at',
          page: 1,
          per_page: 25,
          target_guids: serviceGUID,
        })
        .reply(
          200,
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

      nockAccounts
        .get('/users')
        .query({ uuids: defaultAuditEvent().actor.guid })
        .reply(
          200,
          `{
          "users": [{
            "user_uuid": "${defaultAuditEvent().actor.guid}",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }]
        }`,
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

  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockCF = nock(ctx.app.cloudFoundryAPI);

    nockCF
      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)

      .get(`/v2/organizations/${organizationGUID}`)
      .reply(200, defaultOrg())

      .get(`/v2/user_provided_service_instances?q=space_guid:${customSpaceGUID}`)
      .reply(200, data.userServices)

      .get(`/v2/service_instances/${customServiceGUID}`)
      .reply(200, data.serviceInstance);
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.on('response', () => {
  nockCF.done()
});

    nock.cleanAll();
  });

  describe('when there are no audit events to display', () => {
    it('should show a helpful message on the service events page', async () => {
      nockCF
        .get('/v3/audit_events')
        .query({
          order_by: '-updated_at',
          page: 1,
          per_page: 25,
          target_guids: customServiceGUID,
        })
        .reply(200, JSON.stringify(wrapV3Resources()));

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
    nockCF
      .get(`/v3/audit_events/a595fe2f-01ff-4965-a50c-290258ab8582`)
      .reply(200, JSON.stringify(event));

    const response = await viewServiceEvent(ctx, {
      eventGUID: event.guid,
      organizationGUID,
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID,
    });

    expect(response.body).toContain('Service name-1508 Event details');

    expect(response.body).toContain(
      /* DateTime    */ moment(event.updated_at).format(DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'admin');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });
});
