import jwt from 'jsonwebtoken';
import moment from 'moment';
import nock from 'nock';
import pino from 'pino';

import * as billingData from '../../lib/billing/billing.test.data';
import * as data from '../../lib/cf/cf.test.data';

import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { Token } from '../auth';

import * as statement from '.';
import { composeCSV, ISortable, ISortableBy, ISortableDirection, order, sortByName } from './statements';

const spaceTemplate = {
  entity: {
    allow_ssh: false,
    app_events_url: '',
    apps_url: '',
    auditors_url: '',
    developers_url: '',
    domains_url: '',
    events_url: '',
    managers_url: '',
    name: 'prod',
    organization_guid: '',
    organization_url: '',
    routes_url: '',
    security_groups_url: '',
    service_instances_url: '',
    space_quota_definition_guid: null,
    staging_security_groups_url: '',
  },
  metadata: {
    guid: '',
    url: '',
    created_at: '',
    updated_at: '',
  },
};

const resourceTemplate = {
  resourceGUID: '',
  resourceName: 'api',
  resourceType: 'app',
  orgGUID: '',
  spaceGUID: '',
  space: spaceTemplate,
  planGUID: '',
  planName: 'app',
  price: {
    exVAT: 1.0,
    incVAT: 1.2,
  },
};

// tslint:disable:max-line-length
nock(config.cloudFoundryAPI).persist()
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').reply(200, data.userRolesForOrg)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(200, data.organization)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/spaces').reply(200, data.spaces)
  .get('/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles').reply(200, data.users)
  .get('/v2/quota_definitions/dcb680a9-b190-4838-a3d2-b84aa17517a6').reply(200, data.organizationQuota)
  .get('/v2/spaces/5489e195-c42b-4e61-bf30-323c331ecc01/summary').reply(200, data.spaceSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/summary').reply(200, data.spaceSummary)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').reply(200, data.organization)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3/apps').reply(200, data.apps)
  .get('/v2/apps/cd897c8c-3171-456d-b5d7-3c87feeabbd1/summary').reply(200, data.appSummary)
  .get('/v2/apps/efd23111-72d1-481e-8168-d5395e0ea5f0/summary').reply(200, data.appSummary)
  .get('/v2/spaces/bc8d3381-390d-4bd7-8c71-25309900a2e3').reply(200, data.space)
  .get('/v2/space_quota_definitions/a9097bc8-c6cf-4a8f-bc47-623fa22e8019').reply(200, data.spaceQuota);

nock(config.billingAPI)
  .get('/billable_events?range_start=2018-01-01&range_stop=2018-02-01&org_guid=a7aff246-5f5b-4cf8-87d8-f316053e4a20').reply(200, billingData.billableEvents);
// tslint:enable:max-line-length

const tokenKey = 'secret';
const token = jwt.sign({
  user_id: 'uaa-id-253',
  scope: [],
  exp: 2535018460,
}, tokenKey);
const ctx: IContext = {
  app: config,
  routePartOf: () => false,
  linkTo: (name, params) => `${name}/${params ? params.rangeStart : ''}`,
  log: pino({level: 'silent'}),
  token: new Token(token, [tokenKey]),
};

describe('statements test suite', () => {

  //tslint:disable:max-line-length
  nock(config.billingAPI)
    .get('/billable_events?range_start=2018-01-01&range_stop=2018-02-01&org_guid=a7aff246-5f5b-4cf8-87d8-f316053e4a20').reply(200, `[]`);
  //tslint:enable:max-line-length

  it('should require a valid rangeStart param', async () => {
    await expect(statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: 'not-a-date',
      })).rejects.toThrow(/invalid rangeStart provided/);
  });

  it('should show the statement page', async () => {
    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    expect(response.body).toContain('Statement');
  });

  it('should prepare statement to download', async () => {
    const response = await statement.downloadCSV(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    const filename = response.download ? response.download.name : '__FAIL__';

    expect(filename).toEqual('statement-2018-02-01.csv');
  });

  it ('should be able to use filters', async () => {
    // tslint:disable:max-line-length
    nock(config.billingAPI)
      .get('/billable_events?range_start=2018-01-01&range_stop=2018-02-01&org_guid=a7aff246-5f5b-4cf8-87d8-f316053e4a20').reply(200, billingData.billableEvents);
    // tslint:enable:max-line-length

    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
      space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
      service: '9d071c77-7a68-4346-9981-e8dafac95b6f',
    });

    expect(response.body).toContain('Statement');
    expect(response.body).toContain('batman');
  });

  it('should throw an error due to selecting middle of the month', async () => {
    await expect(statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: '2018-01-15',
      })).rejects.toThrow(/expected rangeStart to be the first of the month/);
  });

  it('should redirect to correct statement', async () => {
    const response = await statement.statementRedirection(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    expect(response.redirect).toContain('/2018-01-01');
  });

  it('should redirect to current statement', async () => {
    const response = await statement.statementRedirection(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
    });
    const currentMonth = moment().startOf('month').format('YYYY-MM-DD');

    expect(response.redirect).toContain(`/${currentMonth}`);
  });

  it('should sort by different fields correctly', async () => {
    const a = [
      {...resourceTemplate, resourceName: 'z', planName: 'Athens', space: {
        ...spaceTemplate,
        entity: {...spaceTemplate.entity, name: '3'},
      }},
      {...resourceTemplate, resourceName: 'a', planName: 'Berlin', space: {
        ...spaceTemplate,
        entity: {...spaceTemplate.entity, name: '4'},
      }},
      {...resourceTemplate, resourceName: 'b', planName: 'Dublin', space: {
        ...spaceTemplate,
        entity: {...spaceTemplate.entity, name: '1'},
      }},
      {...resourceTemplate, resourceName: 'd', planName: 'Berlin', space: {
        ...spaceTemplate,
        entity: {...spaceTemplate.entity, name: '3'},
      }},
      {...resourceTemplate, resourceName: 'd', planName: 'Cairo', space: {
        ...spaceTemplate,
        entity: {...spaceTemplate.entity, name: '2'},
      }},
    ];

    const cases = [
      {sort: 'name', order: 'asc', out: ['a', 'b', 'd', 'd', 'z']},
      {sort: 'space', order: 'asc', out: ['1', '2', '3', '3', '4']},
      {sort: 'plan', order: 'asc', out: ['Athens', 'Berlin', 'Berlin', 'Cairo', 'Dublin']},
      {sort: 'name', order: 'desc', out: ['z', 'd', 'd', 'b', 'a']},
      {sort: 'space', order: 'desc', out: ['4', '3', '3', '2', '1']},
      {sort: 'plan', order: 'desc', out: ['Dublin', 'Cairo', 'Berlin', 'Berlin', 'Athens']},
    ];

    for (const c of cases) {
      const sortable: ISortable = {
        order: c.order as ISortableDirection,
        sort: c.sort as ISortableBy,
      };

      const z = order([...a], sortable);

      z.forEach((t, i) => {
        switch (c.sort) {
          case 'name':
            expect(t.resourceName).toEqual(c.out[i]);
            break;
          case 'space':
            expect(t.space.entity.name).toEqual(c.out[i]);
            break;
          case 'plan':
            expect(t.planName).toEqual(c.out[i]);
            break;
        }
      });
    }
  });

  it('should sort by entity name correctly', async () => {
    const a = [
      {entity: {name: 'z'}, metadata: {guid: 'z'}},
      {entity: {name: 'a'}, metadata: {guid: 'a'}},
      {entity: {name: 'b'}, metadata: {guid: 'b'}},
      {entity: {name: 'd'}, metadata: {guid: 'd'}},
      {entity: {name: 'd'}, metadata: {guid: 'd'}},
    ];

    a.sort(sortByName);

    expect(a[0].entity.name).toEqual('a');
    expect(a[1].entity.name).toEqual('b');
    expect(a[2].entity.name).toEqual('d');
    expect(a[3].entity.name).toEqual('d');
    expect(a[4].entity.name).toEqual('z');
  });

  it('should compose csv content correctly', async () => {
    const content = composeCSV([resourceTemplate]);

    expect(content).toContain('Name,Space,Plan,Ex VAT,Inc VAT');
    expect(content).toContain('api,prod,app,1.00,1.20');
    expect(content).toContain('10% Administration fees,,,0.10,0.12');
    expect(content).toContain('Total,,,1.10,1.32');
  });

  //tslint:disable:max-line-length
  nock(config.billingAPI)
    .get('/billable_events?range_start=2018-01-01&range_stop=2018-02-01&org_guid=3deb9f04-b449-4f94-b3dd-c73cefe5b275').reply(500, `[]`);
  //tslint:enable:max-line-length

  it('should show error if billing API unavailable', async () => {
    await expect(statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    })).rejects.toThrow(/Billing is currently unavailable, please try again later./);
  });
});
