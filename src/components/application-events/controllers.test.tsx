import lodash from 'lodash';
import moment from 'moment';
import nock from 'nock';


import { DATE_TIME } from '../../layouts';
import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as data from '../../lib/cf/cf.test.data';
import { app as defaultApp } from '../../lib/cf/test-data/app';
import { auditEvent as defaultAuditEvent } from '../../lib/cf/test-data/audit-event';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { wrapV3Resources } from '../../lib/cf/test-data/wrap-resources';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { viewApplicationEvent, viewApplicationEvents } from '.';

const ctx: IContext = createTestContext();

describe('application event', () => {
  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockCF = nock(ctx.app.cloudFoundryAPI);

    nockCF
      .get(`/v2/apps/${defaultApp().metadata.guid}`)
      .reply(200, JSON.stringify(defaultApp()))

      .get('/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139')
      .reply(200, data.space)

      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9')
      .reply(200, defaultOrg());
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.done();

    nock.cleanAll();
  });

  it('should show an event', async () => {
    nockCF
      .get(`/v3/audit_events/${defaultAuditEvent().guid}`)
      .reply(200, JSON.stringify(defaultAuditEvent()));

    const event = defaultAuditEvent();

    const response = await viewApplicationEvent(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      applicationGUID: defaultApp().metadata.guid,
      eventGUID: event.guid,
    });

    expect(response.body).toContain(
      `${defaultApp().entity.name} - Application Event`,
    );

    expect(response.body).toContain(
      /* DateTime    */ moment(event.updated_at).format(DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'admin');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });

  it('should show the email of the event actor if it is a user with an email', async () => {
    const event = defaultAuditEvent();
    nockCF
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

    const response = await viewApplicationEvent(ctx, {
      applicationGUID: defaultApp().metadata.guid,
      eventGUID: defaultAuditEvent().guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain(
      `${defaultApp().entity.name} - Application Event`,
    );

    expect(response.body).toContain(
      /* DateTime    */ moment(event.updated_at).format(DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'one@user.in.database');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });

  it('should show the name event actor if it is not a user', async () => {
    const event = defaultAuditEvent();
    nockCF.get(`/v3/audit_events/${event.guid}`).reply(
      200,
      JSON.stringify(
        lodash.merge(event, {
          actor: { name: 'unknown-actor', type: 'unknown' },
        }),
      ),
    );

    const response = await viewApplicationEvent(ctx, {
      applicationGUID: defaultApp().metadata.guid,
      eventGUID: event.guid,
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain(
      `${defaultApp().entity.name} - Application Event`,
    );

    expect(response.body).toContain(
      /* DateTime    */ moment(event.updated_at).format(DATE_TIME),
    );
    expect(response.body).toContain(/* Actor       */ 'unknown-actor');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });
});

describe('application events', () => {
  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockAccounts = nock(ctx.app.accountsAPI);
    nockCF = nock(ctx.app.cloudFoundryAPI);

    nockCF
      .get(`/v2/apps/${defaultApp().metadata.guid}`)
      .reply(200, JSON.stringify(defaultApp()))

      .get('/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139')
      .reply(200, data.space)

      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9')
      .reply(200, defaultOrg());
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.done();

    nock.cleanAll();
  });

  describe('when there are no audit events to display', () => {
    beforeEach(() => {
      nockCF
        .get('/v3/audit_events')
        .query({
          order_by: '-updated_at',
          page: 1,
          per_page: 25,
          target_guids: defaultApp().metadata.guid,
        })
        .reply(200, JSON.stringify(wrapV3Resources()));
    });

    it('should show a helpful message on the application events page', async () => {
      const response = await viewApplicationEvents(ctx, {
        applicationGUID: defaultApp().metadata.guid,
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      });

      expect(response.body).toContain(
        `${defaultApp().entity.name} - Application Events`,
      );
      expect(response.body).toContain('Displaying page 1 of 1');
      expect(response.body).toContain('0 total events');
    });
  });

  describe('when there are some audit events to display', () => {
    beforeEach(() => {
      nockCF
        .get('/v3/audit_events')
        .query({
          order_by: '-updated_at',
          page: 1,
          per_page: 25,
          target_guids: defaultApp().metadata.guid,
        })
        .reply(
          200,
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

    it('should show a table of events on the application events page', async () => {
      const response = await viewApplicationEvents(ctx, {
        applicationGUID: defaultApp().metadata.guid,
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        page: 1,
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      });

      expect(response.body).toContain(
        `${defaultApp().entity.name} - Application Events`,
      );

      expect(response.body).toContain('Displaying page 1 of 2702');
      expect(response.body).toContain('1337 total events');
      expect(response.body).toContain('<span>Previous page</span>');
      expect(response.body).not.toContain('<span>Next page</span>');
      expect(response.body).toContain('Next page');

      expect(response.body).toContain('one@user.in.database');
      expect(response.body).toContain('some unknown actor');

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
