import lodash from 'lodash';
import nock from 'nock';

import {viewApplicationEvents} from '.';

import * as data from '../../lib/cf/cf.test.data';
import {app as defaultApp} from '../../lib/cf/test-data/app';
import {auditEvent as defaultAuditEvent} from '../../lib/cf/test-data/audit-event';
import {org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapV3Resources} from '../../lib/cf/test-data/wrap-resources';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

const ctx: IContext = createTestContext();

describe('application events', () => {
  let nockCF: nock.Scope;

  beforeEach(() => {
    nock.cleanAll();
    nockCF = nock('https://example.com/api');

    nockCF
      .get(`/v2/apps/${defaultApp().metadata.guid}`)
      .reply(200, JSON.stringify(defaultApp()))

      .get(`/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139`)
      .reply(200, data.space)

      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9')
      .reply(200, defaultOrg())
    ;
  });

  afterEach(() => {
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
          target_guids: defaultApp().metadata.guid,
        })
        .reply(200, JSON.stringify(wrapV3Resources()))
      ;
    });

    it('should show a helpful message on the application events page', async () => {
      const response = await viewApplicationEvents(ctx, {
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
        applicationGUID: defaultApp().metadata.guid,
      });

      expect(response.body).toContain(`${defaultApp().entity.name} - Application Events`);
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
          target_guids: defaultApp().metadata.guid,
        })
        .reply(200, JSON.stringify(lodash.merge(wrapV3Resources(
          lodash.merge(defaultAuditEvent(), {type: 'audit.app.delete-request'}),
          lodash.merge(defaultAuditEvent(), {type: 'audit.app.restage'}),
          lodash.merge(defaultAuditEvent(), {type: 'audit.app.update'}),
          lodash.merge(defaultAuditEvent(), {type: 'audit.app.create'}),
          lodash.merge(defaultAuditEvent(), {type: 'some unknown event type'}),
        ), {pagination: {
          total_pages: 2702,
          total_results: 1337,
          next: { href: '/link-to-next-page' },
        }})))
      ;
    });

    it('should show a table of events on the application events page', async () => {
      const response = await viewApplicationEvents(ctx, {
        organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
        spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
        applicationGUID: defaultApp().metadata.guid,
        page: 1,
      });

      expect(response.body).toContain(`${defaultApp().entity.name} - Application Events`);

      expect(response.body).toContain('Displaying page 1 of 2702');
      expect(response.body).toContain('1337 total events');
      expect(response.body).toContain('<a class="govuk-link" disabled>Previous page</a>');
      expect(response.body).not.toContain('<a class="govuk-link" disabled>Next page</a>');
      expect(response.body).toContain('Next page');

      expect(response.body).toContain('Requested deletion of the application');
      expect(response.body).toContain('Restaged the application');
      expect(response.body).toContain('Updated the application');
      expect(response.body).toContain('Created the application');
      expect(response.body).toContain('<code>some unknown event type</code>');
    });
  });
});
