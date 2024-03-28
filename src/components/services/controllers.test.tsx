import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { spacesMissingAroundInlineElements } from '../../layouts/react-spacing.test';
import * as data from '../../lib/cf/cf.test.data';
import { org as defaultOrg } from '../../lib/cf/test-data/org';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { viewService } from './controllers';
const handlers = [
  http.get('https://example.com/api', () => {
    return new HttpResponse('');
  }),
  http.get('https://example.com/api/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9/user_roles', () => {
    return new HttpResponse(data.userRolesForOrg);
  }),
  http.get('https://example.com/api/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92', () => {
    return new HttpResponse(data.serviceInstance);
  }),
  http.get('https://example.com/api/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92/shared_from', () => {
    return new HttpResponse('{}');
  }),
  http.get('https://example.com/api/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92/shared_to', () => {
    return new HttpResponse('{}');
  }),
  http.get('https://example.com/api/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1', () => {
    return new HttpResponse(data.servicePlan);
  }),
  http.get('https://example.com/api/v2/services/a00cacc0-0ca6-422e-91d3-6b22bcd33450', () => {
    return new HttpResponse(data.serviceString);
  }),
  http.get('https://example.com/api/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139', () => {
    return new HttpResponse(data.space);
  }),
  http.get('https://example.com/api/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9', () => {
    return HttpResponse.json(defaultOrg());
  }),
  http.get('https://example.com/api/v2/user_provided_service_instances', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');
    if (q === 'space_guid:38511660-89d9-4a6e-a889-c32c7e94f139') {
      return new HttpResponse(data.userServices);
    }
  }),
  http.get('https://example.com/api/v2/user_provided_service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee', () => {
    return new HttpResponse(data.userServiceInstance);
  }),
  http.get('https://example.com/api/v2/service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee/shared_from', () => {
    return new HttpResponse('{}');
  }),
  http.get('https://example.com/api/v2/service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee/shared_to', () => {
    return new HttpResponse('{}');
  }),
];
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
beforeEach(() => server.resetHandlers());
afterAll(() => server.close());

const ctx: IContext = createTestContext();

describe('services test suite', () => {
  it('should show the service overview page', async () => {
    const response = await viewService(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain('Service name-1508 Overview');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });

  it('should show the user provided service overview page', async () => {
    const response = await viewService(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).toContain('Service name-1700 Overview');
    expect(
      spacesMissingAroundInlineElements(response.body as string),
    ).toHaveLength(0);
  });
});
