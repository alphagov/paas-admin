import { format, startOfMonth } from 'date-fns';
import jwt from 'jsonwebtoken';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as billingData from '../../lib/billing/billing.test.data';
import * as data from '../../lib/cf/cf.test.data';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { createTestContext } from '../app/app.test-helpers';
import { config } from '../app/app.test.config';
import { IContext } from '../app/context';
import { CLOUD_CONTROLLER_ADMIN, Token } from '../auth';

import {
  composeCSV,
  ISortable,
  ISortableBy,
  ISortableDirection,
  order,
  sortByName,
} from './controllers';

import * as statement from '.';

const resourceTemplate = {
  orgGUID: '',
  planGUID: '',
  planName: 'app',
  price: {
    exVAT: 1.0,
    incVAT: 1.2,
  },
  resourceGUID: '',
  resourceName: 'api',
  resourceType: 'app',
  spaceGUID: '',
  spaceName: 'prod',
};

const tokenKey = 'secret';
const token = jwt.sign(
  {
    exp: 2535018460,
    origin: 'uaa',
    scope: [],
    user_id: 'uaa-id-253',
  },
  tokenKey,
);
const ctx: IContext = createTestContext({
  linkTo: (name: any, params: any) =>
    `${name}/${params ? params.rangeStart : ''}`,
  token: new Token(token, [tokenKey]),
});

const adminToken = jwt.sign(
  {
    exp: 2535018460,
    origin: 'uaa',
    scope: [CLOUD_CONTROLLER_ADMIN],
    user_id: 'uaa-id-253',
  },
  tokenKey,
);
const adminCtx: IContext = createTestContext({
  linkTo: (name: any, params: any) =>
    `${name}/${params ? params.rangeStart : ''}`,
  token: new Token(adminToken, [tokenKey]),
});

describe('statements test suite', () => {
  const handlers = [
    http.get(`${config.cloudFoundryAPI}`, () => {
      return new HttpResponse('');
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => server.resetHandlers());
  afterAll(() => server.close());


  it('should require a valid rangeStart param', async () => {
    await expect(
      statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: 'not-a-date',
      }),
    ).rejects.toThrow(/invalid rangeStart provided/);
  });

  it('should show the statement page', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q2 = url.searchParams.get('range_stop');
        if (q === '2018-01-01' && q2 === '2018-02-01') {
          return new HttpResponse('[]');
        }
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(billingData.billableEvents);
        }
      }),
    );

    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    expect(response.body).toContain('Organisation the-system_domain-org-name Monthly billing statement');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should error for non-admins when the org is deleted', async () => {
    server.use(
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            null,
            { status:404 },
          );
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q2 = url.searchParams.get('range_stop');
        if (q === '2018-01-01' && q2 === '2018-02-01') {
          return new HttpResponse(
            null,
            { status:404 },
          );
        }
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          null,
          { status:404 },
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          null,
          { status:404 },
        );
      }),
    );

    await expect(
      statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: '2018-01-01',
      }),
    ).rejects.toThrow(/status 404/);
  });

  it('should show the statement page to admins for a deleted org', async () => {
    server.use(
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q2 = url.searchParams.get('range_stop');
        if (q === '2018-01-01' && q2 === '2018-02-01') {
          return new HttpResponse('[]');
        }
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            billingData.billableEvents,
          );
        }
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          null,
          { status: 404 },
        );
      }),
    );

    const response = await statement.viewStatement(adminCtx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    expect(response.body).toContain('Organisation deleted-org Monthly billing statement');
    expect(response.body).toContain('deleted-org');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should prepare statement to download', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            billingData.billableEvents,
          );
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q2 = url.searchParams.get('range_stop');
        if (q === '2018-01-01' && q2 === '2018-02-01') {
          return new HttpResponse('[]');
        }
      }),
    );

    const response = await statement.downloadCSV(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
    });

    const filename = response.download ? response.download.name : '__FAIL__';

    expect(filename).toEqual('statement-2018-02-01.csv');
  });

  it('should be able to use filters', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(billingData.billableEvents);
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(billingData.currencyRates);
        }
      }),
    );

    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
      service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
      space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    expect(response.body).toContain('Organisation the-system_domain-org-name Monthly billing statement');
    expect(response.body).toContain('batman');
  });

  it('should be reflect the selected filters in the main heading', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(billingData.billableEvents);
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(billingData.currencyRates);
        }
      }),
    );

    const response = await statement.viewStatement(ctx, {
      order: 'desc',
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
      service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
      sort: 'amount',
      space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    expect(response.body).toContain('sorted by Inc VAT column');
    expect(response.body).toContain('in descending order');
  });

  it('populates filter dropdowns with all spaces / services', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            billingData.billableEvents,
          );
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
         return new HttpResponse(billingData.currencyRates);
        }
      }),
    );

    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
      service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
      space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    // Spaces
    expect(response.body).toContain('All spaces</option>');
    expect(response.body).toContain('pretty-face</option>');
    expect(response.body).toContain('real-hero</option>');

    // Services and apps
    expect(response.body).toContain('All Services</option>');
    expect(response.body).toContain('app</option>');
    expect(response.body).toContain('staging</option>');
  });

  it('does not outputs USD rate if not known', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            billingData.billableEvents,
          );
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse('[]');
        }
      }),
    );

    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
      service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
      space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    expect(response.body).not.toContain('Exchange rate');
  });

  it('outputs a single USD rate if there is only one', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            billingData.billableEvents,
          );
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return HttpResponse.json([{ code: 'USD', rate: 0.8, valid_from: '2017-01-01' }]);
        }
      }),
    );


    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
      service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
      space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    expect(response.body).toContain('£1 to $1.25');
    expect(response.body).not.toContain('£1 to $1.25 after');
  });

  it('outputs multiple USD rates if there are multiple this month', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            billingData.billableEvents,
          );
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return HttpResponse.json(
            [
              { code: 'USD', rate: 0.8, valid_from: '2017-01-01' },
              { code: 'USD', rate: 0.5, valid_from: '2017-01-15' },
            ],
          );
        }
      }),
    );

    const response = await statement.viewStatement(ctx, {
      organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
      rangeStart: '2018-01-01',
      service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
      space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
    });

    expect(response.body).toContain('Exchange rate:');
    expect(response.body).toContain('£1 to $1.25 from January 1st 2017');
    expect(response.body).toContain('£1 to $2.00 from January 15th 2017');
  });

  it('should throw an error due to selecting middle of the month', async () => {
    await expect(
      statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: '2018-01-15',
      }),
    ).rejects.toThrow(
      /Billing Statement: expected rangeStart to be the first day of the month/,
    );
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
    const currentMonth = format(startOfMonth(new Date()), 'yyyy-MM-dd');

    expect(response.redirect).toContain(`/${currentMonth}`);
  });

  it('should sort by different fields correctly', () => {
    const a = [
      {
        ...resourceTemplate,
        planName: 'Athens',
        price: { exVAT: 0, incVAT: 1 },
        resourceName: 'z',
        spaceName: '3',
      },
      {
        ...resourceTemplate,
        planName: 'Berlin',
        price: { exVAT: 0, incVAT: 2 },
        resourceName: 'a',
        spaceName: '4',
      },
      {
        ...resourceTemplate,
        planName: 'Dublin',
        price: { exVAT: 0, incVAT: 3 },
        resourceName: 'b',
        spaceName: '1',
      },
      {
        ...resourceTemplate,
        planName: 'Berlin',
        price: { exVAT: 0, incVAT: 4 },
        resourceName: 'd',
        spaceName: '3',
      },
      {
        ...resourceTemplate,
        planName: 'Cairo',
        price: { exVAT: 0, incVAT: 5 },
        resourceName: 'd',
        spaceName: '2',
      },
    ];

    const cases = [
      { order: 'asc', out: ['a', 'b', 'd', 'd', 'z'], sort: 'name' },
      { order: 'asc', out: ['1', '2', '3', '3', '4'], sort: 'space' },
      {
        order: 'asc',
        out: ['Athens', 'Berlin', 'Berlin', 'Cairo', 'Dublin'],
        sort: 'plan',
      },
      { order: 'desc', out: ['z', 'd', 'd', 'b', 'a'], sort: 'name' },
      { order: 'desc', out: ['4', '3', '3', '2', '1'], sort: 'space' },
      {
        order: 'desc',
        out: ['Dublin', 'Cairo', 'Berlin', 'Berlin', 'Athens'],
        sort: 'plan',
      },
      { order: 'desc', out: [5, 4, 3, 2, 1], sort: 'amount' },
      { order: 'asc', out: [1, 2, 3, 4, 5], sort: 'amount' },
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
          case 'amount':
            expect(t.price.incVAT).toEqual(c.out[i]);
            break;
          default:
            fail(`Unexpected sort: ${c.sort}`);
        }
      });
    }
  });

  it('should sort by entity name correctly', () => {
    const a = [
      { guid: 'z', name: 'z' },
      { guid: 'a', name: 'a' },
      { guid: 'b', name: 'b' },
      { guid: 'd', name: 'd' },
      { guid: 'd', name: 'd' },
    ];

    a.sort(sortByName);

    expect(a[0].name).toEqual('a');
    expect(a[1].name).toEqual('b');
    expect(a[2].name).toEqual('d');
    expect(a[3].name).toEqual('d');
    expect(a[4].name).toEqual('z');
  });

  it('should throw an error due to selecting invalid sort column', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
      http.get(`${config.billingAPI}/billable_events`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(
            billingData.billableEvents,
          );
        }
      }),
      http.get(`${config.billingAPI}/currency_rates`, ({ request }) => {
        const url = new URL(request.url);
        const q = url.searchParams.get('range_start');
        const q1 = url.searchParams.get('range_stop');
        if (q=== '2018-01-01' && q1 === '2018-02-01') {
          return new HttpResponse(billingData.currencyRates);
        }
      }),
    );

    await expect(
      statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: '2018-01-01',
        service: 'f4d4b95a-f55e-4593-8d54-3364c25798c4',
        sort: 'invalid',
        space: 'bc8d3381-390d-4bd7-8c71-25309900a2e3',
      }),
    ).rejects.toThrow(
      /Billing Statement: invalid sort column provided/,
    );
  });

  it('should compose csv content correctly', () => {
    const adminFee = 0.1;
    const content = composeCSV([resourceTemplate], adminFee);

    expect(content).toContain('Name,Space,Plan,Ex VAT,Inc VAT');
    expect(content).toContain('api,prod,app,1.00,1.20');
    expect(content).toContain('10% Administration fees,,,0.10,0.12');
    expect(content).toContain('Total,,,1.10,1.32');
  });

  it('should show error if billing API unavailable', async () => {
    server.use(
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275`, () => {
        return new HttpResponse(
          JSON.stringify(defaultOrg()),
        );
      }),
      http.get(`${config.cloudFoundryAPI}/v2/organizations/3deb9f04-b449-4f94-b3dd-c73cefe5b275/user_roles`, () => {
        return new HttpResponse(
          data.userRolesForOrg,
        );
      }),
    );

    await expect(
      statement.viewStatement(ctx, {
        organizationGUID: '3deb9f04-b449-4f94-b3dd-c73cefe5b275',
        rangeStart: '2018-01-01',
      }),
    ).rejects.toThrow(
      /Billing is currently unavailable, please try again later./,
    );
  });
});
