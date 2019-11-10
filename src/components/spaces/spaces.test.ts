import lodash from 'lodash';
import nock from 'nock';

import * as spaces from '.';

import * as data from '../../lib/cf/cf.test.data';
import {app as defaultApp} from '../../lib/cf/test-data/app';
import {auditEvent as defaultAuditEvent} from '../../lib/cf/test-data/audit-event';
import {org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapResources, wrapV3Resources} from '../../lib/cf/test-data/wrap-resources';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

const ctx: IContext = createTestContext();
const spaceGUID = 'bc8d3381-390d-4bd7-8c71-25309900a2e3';
const organizationGUID = '3deb9f04-b449-4f94-b3dd-c73cefe5b275';

describe('space event', () => {
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

    const response = await spaces.viewSpaceEvent(ctx, {
      organizationGUID, spaceGUID, eventGUID: defaultAuditEvent().guid,
    });

    expect(response.body).toContain(`name-2064 - Space Event`);

    expect(response.body).toContain(/* Date        */ 'June 8th 2016');
    expect(response.body).toContain(/* Time        */ '17:41');
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

    const response = await spaces.viewSpaceEvent(ctx, {
      organizationGUID, spaceGUID, eventGUID: defaultAuditEvent().guid,
    });

    expect(response.body).toContain(`name-2064 - Space Event`);

    expect(response.body).toContain(/* Date        */ 'June 8th 2016');
    expect(response.body).toContain(/* Time        */ '17:41');
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

    const response = await spaces.viewSpaceEvent(ctx, {
      organizationGUID, spaceGUID, eventGUID: defaultAuditEvent().guid,
    });

    expect(response.body).toContain(`name-2064 - Space Event`);

    expect(response.body).toContain(/* Date        */ 'June 8th 2016');
    expect(response.body).toContain(/* Time        */ '17:41');
    expect(response.body).toContain(/* Actor       */ 'unknown-actor');
    expect(response.body).toContain(/* Description */ 'Updated application');
    expect(response.body).toContain(/* Metadata    */ 'CRASHED');
  });
});

describe('spaces test suite', () => {
  let nockAccounts: nock.Scope;
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();

    nockCF = nock('https://example.com/api');
    nockAccounts = nock('https://example.com/accounts');

    nockCF
      .get(`/v2/organizations/${organizationGUID}`)
      .reply(200, defaultOrg())
    ;
  });

  afterEach(() => {
    nockAccounts.done();
    nockCF.done();

    nock.cleanAll();
  });

  it('should show the spaces pages', async () => {
    const secondSpace = '5489e195-c42b-4e61-bf30-323c331ecc01';

    nockAccounts
      .get('/users/uaa-id-253').reply(200, JSON.stringify({
        user_uuid: 'uaa-id-253',
        username: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
        user_email: 'uaa-id-253@fake.digital.cabinet-office.gov.uk',
      }))
    ;

    nockCF
      .get(`/v2/organizations/${organizationGUID}/spaces`)
      .reply(200, data.spaces)

      .get(`/v2/organizations/${organizationGUID}/user_roles`)
      .times(3)
      .reply(200, data.users)

      .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019')
      .reply(200, data.spaceQuota)

      .get(`/v2/spaces/${spaceGUID}/apps`)
      .reply(200, JSON.stringify(wrapResources(
        lodash.merge(defaultApp(), {entity: {name: 'first-app'}}),
        lodash.merge(defaultApp(), {entity: {name: 'second-app', state: 'RUNNING'}}),
      )))

      .get('/v2/stacks')
      .reply(200, data.spaces)

      .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6')
      .reply(200, data.organizationQuota)

      .get(`/v2/spaces/${secondSpace}/apps`)
      .reply(200, JSON.stringify(wrapResources(
        lodash.merge(defaultApp(), {entity: {name: 'second-space-app'}}),
      )))
    ;
    const response = await spaces.listSpaces(ctx, {organizationGUID});

    expect(response.body).toContain('Quota usage');
    expect(response.body).toContain('5.0%');
    expect(response.body).toMatch(
      /Using\s+1[.]00<abbr title="gibibytes">GiB<\/abbr>\s+of memory/m,
    );

    expect(response.body).toContain('Spaces');
    expect(response.body).toMatch(/0[.]00.*GiB.*\s+of\s+20[.]00.*GiB/m);
    expect(response.body).toMatch(/1[.]00.*GiB.*\s+of\s+no limit/m);
  });

  it('should show list of applications in space', async () => {
    const appGuid = 'efd23111-72d1-481e-8168-d5395e0ea5f0';
    const appName = 'name-2064';
    nockCF
      .get('/v2/stacks')
      .reply(200, data.spaces)

      .get(`/v2/spaces/${spaceGUID}/apps`)
      .reply(200, JSON.stringify(wrapResources(
        lodash.merge(defaultApp(), {metadata: {guid: appGuid}, entity: {name: appName}}),
      )))

      .get(`/v2/apps/${appGuid}/summary`)
      .reply(200, data.appSummary)

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)
    ;
    const response = await spaces.listApplications(ctx, {organizationGUID, spaceGUID});

    expect(response.body).toContain(`${appName} - Overview`);
  });

  it('should show list of services in space', async () => {
    nockCF
      .get(`/v2/spaces/${spaceGUID}/service_instances`)
      .reply(200, data.services)

      .get(`/v2/user_provided_service_instances?q=space_guid:${spaceGUID}`)
      .reply(200, data.services)

      .get('/v2/service_plans/fcf57f7f-3c51-49b2-b252-dc24e0f7dcab')
      .reply(200, data.servicePlan)

      .get('/v2/services/775d0046-7505-40a4-bfad-ca472485e332')
      .reply(200, data.service)

      .get(`/v2/spaces/${spaceGUID}`)
      .reply(200, data.space)
    ;

    const response = await spaces.listBackingServices(ctx, {organizationGUID, spaceGUID});

    expect(response.body).toContain('name-2064 - Overview');
    expect(response.body).toContain('name-2104');
  });

  describe('viewing events', () => {
    beforeEach(() => {
      nockCF
        .get(`/v2/spaces/${spaceGUID}`)
        .reply(200, data.space)
      ;
    });

    describe('when there are no audit events to display', () => {
      beforeEach(() => {
        nockCF
          .get('/v3/audit_events')
          .query({
            page: 1, per_page: 25,
            order_by: '-updated_at',
            space_guids: spaceGUID,
          })
          .reply(200, JSON.stringify(wrapV3Resources()))
        ;
      });

      it('should show a helpful message on the application events page', async () => {
        const response = await spaces.viewSpaceEvents(ctx, {organizationGUID, spaceGUID});

        expect(response.body).toContain('name-2064 - Space Events');
        expect(response.body).toContain('Displaying page 1 of 1');
        expect(response.body).toContain('0 total events');
      });
    });

    describe('when there are no audit events to display', () => {
      beforeEach(() => {
        nockCF
          .get('/v3/audit_events')
          .query({
            page: 1, per_page: 25,
            order_by: '-updated_at',
            space_guids: spaceGUID,
          })
          .reply(200, JSON.stringify(lodash.merge(wrapV3Resources(
            lodash.merge(defaultAuditEvent(), {type: 'audit.app.delete-request'}),
            lodash.merge(defaultAuditEvent(), {type: 'audit.app.restage'}),
            lodash.merge(defaultAuditEvent(), {
              type: 'audit.app.update',
              target: { guid: defaultAuditEvent().actor.guid, name: defaultAuditEvent().actor.name, type: 'user' },
            }),
            lodash.merge(defaultAuditEvent(), {
              type: 'audit.app.create',
              target: { guid: 'unknown', name: 'an-application', type: 'app'},
            }),
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

      it('should show a table of events on the application events page', async () => {
        const response = await spaces.viewSpaceEvents(ctx, {organizationGUID, spaceGUID, page: 1});

        expect(response.body).toContain('name-2064 - Space Events');
        expect(response.body).toContain('1337 total events');
        expect(response.body).toContain('<a class="govuk-link" disabled>Previous page</a>');
        expect(response.body).not.toContain('<a class="govuk-link" disabled>Next page</a>');
        expect(response.body).toContain('Next page');

        expect(response.body).toContain('one@user.in.database');
        expect(response.body).toContain('some unknown actor');

        expect(response.body).toContain('Requested deletion of application');
        expect(response.body).toContain('Restaged application');
        expect(response.body).toContain('Updated application');

        expect(response.body).toContain('an-application');
        expect(response.body).toContain('Created application');

        expect(response.body).toContain('<code>some unknown event type</code>');
      });
    });
  });
});
