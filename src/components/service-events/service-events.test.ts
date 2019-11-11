import lodash from 'lodash';
import nock from 'nock';

import {viewServiceEvent, viewServiceEvents} from '.';

import * as data from '../../lib/cf/cf.test.data';
import {auditEvent as defaultAuditEvent} from '../../lib/cf/test-data/audit-event';
import {org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapV3Resources} from '../../lib/cf/test-data/wrap-resources';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

const organizationGUID = '6e1ca5aa-55f1-4110-a97f-1f3473e771b9';
const spaceGUID        = '38511660-89d9-4a6e-a889-c32c7e94f139';
const serviceGUID      = '0d632575-bb06-4ea5-bb19-a451a9644d92';

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

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)

      .get(`/v2/organizations/${organizationGUID}`)
      .reply(200, defaultOrg())
    ;
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.done();

    nock.cleanAll();
  });

  it('should show an event', async () => {
    nockCF
      .get(`/v3/audit_events/${defaultAuditEvent().guid}`)
      .reply(200, JSON.stringify(defaultAuditEvent()))
    ;

    const response = await viewServiceEvent(ctx, {
      organizationGUID, spaceGUID, serviceGUID,
      eventGUID: defaultAuditEvent().guid,
    });

    expect(response.body).toContain('name-1508 - Service Event');

    expect(response.body).toContain(/* Date        */ 'June 8th 2016');
    expect(response.body).toMatch(/*   Time        */ /1[67]:41/);
    expect(response.body).toContain(/* Actor       */ 'admin');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });

  it('should show the email of the event actor if it is a user with an email', async () => {
    nockCF
      .get(`/v3/audit_events/${defaultAuditEvent().guid}`)
      .reply(200, JSON.stringify(defaultAuditEvent()))
    ;

    nockAccounts
      .get(`/users/${defaultAuditEvent().actor.guid}`)
      .reply(200, `{
        "user_uuid": "${defaultAuditEvent().actor.guid}",
        "user_email": "one@user.in.database",
        "username": "one@user.in.database"
      }`)
    ;

    const response = await viewServiceEvent(ctx, {
      organizationGUID, spaceGUID, serviceGUID,
      eventGUID: defaultAuditEvent().guid,
    });

    expect(response.body).toContain('name-1508 - Service Event');

    expect(response.body).toContain(/* Date        */ 'June 8th 2016');
    expect(response.body).toMatch(/*   Time        */ /1[67]:41/);
    expect(response.body).toContain(/* Actor       */ 'one@user.in.database');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });

  it('should show the name event actor if it is not a user', async () => {
    nockCF
      .get(`/v3/audit_events/${defaultAuditEvent().guid}`)
      .reply(200, JSON.stringify(lodash.merge(
        defaultAuditEvent(),
        { actor: { type: 'unknown', name: 'unknown-actor'}},
      )))
    ;

    const response = await viewServiceEvent(ctx, {
      organizationGUID, spaceGUID, serviceGUID,
      eventGUID: defaultAuditEvent().guid,
    });

    expect(response.body).toContain('name-1508 - Service Event');

    expect(response.body).toContain(/* Date        */ 'June 8th 2016');
    expect(response.body).toMatch(/*   Time        */ /1[67]:41/);
    expect(response.body).toContain(/* Actor       */ 'unknown-actor');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
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
      .reply(200, defaultOrg())
    ;
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
          page: 1, per_page: 25,
          order_by: '-updated_at',
          target_guids: serviceGUID,
        })
        .reply(200, JSON.stringify(wrapV3Resources()))
      ;
    });

    it('should show a helpful message on the service events page', async () => {
      const response = await viewServiceEvents(ctx, {
        organizationGUID, spaceGUID, serviceGUID,
      });

      expect(response.body).toContain('name-1508 - Service Events');
      expect(response.body).toContain('Displaying page 1 of 1');
      expect(response.body).toContain('0 total events');
    });
  });

  describe('when there are some audit events to display', () => {
    beforeEach(() => {
      nockCF
        .get('/v3/audit_events')
        .query({
          page: 1, per_page: 25,
          order_by: '-updated_at',
          target_guids: serviceGUID,
        })
        .reply(200, JSON.stringify(lodash.merge(wrapV3Resources(
          lodash.merge(defaultAuditEvent(), {type: 'audit.service_instance.delete'}),
          lodash.merge(defaultAuditEvent(), {type: 'audit.service_instance.update'}),
          lodash.merge(defaultAuditEvent(), {type: 'audit.service_instance.create'}),
          lodash.merge(defaultAuditEvent(), {
            type: 'some unknown event type',
            actor: { guid: 'unknown', name: 'some unknown actor', type: 'unknown' },
          }),
        ), {pagination: {
          total_pages: 2702,
          total_results: 1337,
          next: { href: '/link-to-next-page' },
        }})))
      ;

      nockAccounts
        .get('/users')
        .query({uuids: defaultAuditEvent().actor.guid})
        .reply(200, `{
          "users": [{
            "user_uuid": "${defaultAuditEvent().actor.guid}",
            "user_email": "one@user.in.database",
            "username": "one@user.in.database"
          }]
        }`)
      ;
    });

    it('should show a table of events on the service events page', async () => {
      const response = await viewServiceEvents(ctx, {
        organizationGUID, spaceGUID, serviceGUID,
        page: 1,
      });

      expect(response.body).toContain('name-1508 - Service Events');

      expect(response.body).toContain('Displaying page 1 of 2702');
      expect(response.body).toContain('1337 total events');
      expect(response.body).toContain('<a class="govuk-link" disabled>Previous page</a>');
      expect(response.body).not.toContain('<a class="govuk-link" disabled>Next page</a>');
      expect(response.body).toContain('Next page');

      expect(response.body).toContain('one@user.in.database');
      expect(response.body).toContain('some unknown actor');

      expect(response.body).toContain('Deleted service instance');
      expect(response.body).toContain('Updated service instance');
      expect(response.body).toContain('Created service instance');
      expect(response.body).toContain('<code>some unknown event type</code>');
    });
  });
});
