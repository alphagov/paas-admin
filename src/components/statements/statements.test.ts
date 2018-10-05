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

const resourceTemplate = {
  resourceGUID: '',
  resourceName: 'api',
  resourceType: 'app',
  orgGUID: '',
  spaceGUID: '',
  spaceName: 'prod',
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
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').reply(200, data.organization);

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
  csrf: '',
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
      service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
    });

    expect(response.body).toContain('Statement');
    expect(response.body).toContain('batman');
  });

  it('should throw an error due to selecting middle of the month', async () => {
    await expect(statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: '2018-01-15',
      })).rejects.toThrow(/Billing Statement: expected rangeStart to be the first day of the month/);
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
      {...resourceTemplate, resourceName: 'z', planName: 'Athens', spaceName: '3'},
      {...resourceTemplate, resourceName: 'a', planName: 'Berlin', spaceName: '4'},
      {...resourceTemplate, resourceName: 'b', planName: 'Dublin', spaceName: '1'},
      {...resourceTemplate, resourceName: 'd', planName: 'Berlin', spaceName: '3'},
      {...resourceTemplate, resourceName: 'd', planName: 'Cairo', spaceName: '2'},
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
            expect(t.spaceName).toEqual(c.out[i]);
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
      {name: 'z', guid: 'z'},
      {name: 'a', guid: 'a'},
      {name: 'b', guid: 'b'},
      {name: 'd', guid: 'd'},
      {name: 'd', guid: 'd'},
    ];

    a.sort(sortByName);

    expect(a[0].name).toEqual('a');
    expect(a[1].name).toEqual('b');
    expect(a[2].name).toEqual('d');
    expect(a[3].name).toEqual('d');
    expect(a[4].name).toEqual('z');
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
