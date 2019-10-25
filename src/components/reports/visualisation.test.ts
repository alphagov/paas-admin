import moment from 'moment';
import nock from 'nock';
import {createTestContext} from '../app/app.test-helpers';

import {v3Org as defaultOrg} from '../../lib/cf/test-data/org';
import {wrapV3Resources} from '../../lib/cf/test-data/wrap-resources';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import * as reports from '../reports';

const defaultBillable = {
  orgName: 'default-org-name',
  orgGUID: 'default-org-guid',
  serviceGroup: 'default-service',
  exVAT: 0,
  incVAT: 0,
};

describe('html visualisation report test suite', () => {

  nock(config.cloudFoundryAPI)
    .get('/v3/organizations')
    .times(5)
    .reply(200, JSON.stringify(wrapV3Resources(defaultOrg())))
  ;

  const ctx: IContext = createTestContext();

  it('should show empty report for zero billables', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, '[]')
    ;

    const response = await reports.viewVisualisation(ctx, {rangeStart});

    expect(response.body).toContain(`No data`);
    expect(response.body).not.toContain(`<svg id="sankey"`);
  });

  it('should show non empty report for non-zero billables', async () => {
    const rangeStart = moment().startOf('month').format('YYYY-MM-DD');

    nock(config.billingAPI)
      .get('/billable_events')
      .query(true)
      .reply(200, `[{
        "event_guid":"default-event-guid",
        "event_start":"2018-04-20T14:36:09+00:00",
        "event_stop":"2018-04-20T14:45:46+00:00",
        "resource_guid":"default-resource-guid",
        "resource_name":"default-resource-name",
        "resource_type":"app",
        "org_guid":"a7aff246-5f5b-4cf8-87d8-f316053e4a20",
        "space_guid":"default-space-guid",
        "plan_guid":"default-plan-guid",
        "quota_definition_guid":"default-quota-definition-guid",
        "number_of_nodes":1,
        "memory_in_mb":64,
        "storage_in_mb":0,
        "price":{"ex_vat":0,"inc_vat":0,"details":[{
          "name":"instance",
          "start":"2018-04-20T14:36:09+00:00",
          "stop":"2018-04-20T14:45:46+00:00",
          "plan_name":"default-plan-name",
          "ex_vat":0,
          "inc_vat":0,
          "vat_rate":"0.2",
          "vat_code":"default-vat-code",
          "currency_code":"default-currency-code"
        }]}
      }]`);

    const response = await reports.viewVisualisation(ctx, {rangeStart});

    expect(response.body).toContain(`<svg id="sankey"`);
    expect(response.body).not.toContain(`No data`);
  });
});

describe('building D3 sankey input', () => {
  it('should produce empty output with empty input', () => {
    const result = reports.buildD3SankeyInput([], []);
    expect(result.nodes).toHaveLength(0);
    expect(result.links).toHaveLength(0);
  });

  it('should produce nodes and links from billables, ignoring orgs without billables', () => {
    const result = reports.buildD3SankeyInput([
      {...defaultBillable, orgName: 'org-1', serviceGroup: 'service-1', exVAT: 1},
      {...defaultBillable, orgName: 'org-2', serviceGroup: 'service-1', exVAT: 2},
      {...defaultBillable, orgName: 'org-2', serviceGroup: 'service-2', exVAT: 3},
    ], [
      {org: 'org-1', owner: 'owner-1'},
      {org: 'org-2', owner: 'owner-1'},
      {org: 'org-without-billables', owner: 'owner-2'},
    ]);
    expect(result.nodes).toEqual([
      {name: 'service-1'},
      {name: 'service-2'},
      {name: 'org-1'},
      {name: 'org-2'},
      {name: 'owner-1'},
    ]);
    expect(result.links).toEqual([
      {source: 0, target: 2, value: 1},
      {source: 0, target: 3, value: 2},
      {source: 1, target: 3, value: 3},
      {source: 2, target: 4, value: 1},
      {source: 3, target: 4, value: 5},
    ]);
  });
});
