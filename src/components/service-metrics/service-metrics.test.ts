import nock from 'nock';

import {resolveServiceMetrics, viewServiceMetrics} from '.';

import moment from 'moment';
import querystring from 'querystring';

import { getStubCloudwatchMetricsData } from '../../lib/aws/aws-cloudwatch.test.data';
import * as data from '../../lib/cf/cf.test.data';
import {org as defaultOrg} from '../../lib/cf/test-data/org';
import {createTestContext} from '../app/app.test-helpers';
import {IContext} from '../app/context';

const ctx: IContext = createTestContext();

describe('service metrics test suite', () => {
  let oldEnv: any;
  beforeEach(() => {
    nock.cleanAll();
    oldEnv = {...process.env};

    process.env.AWS_ACCESS_KEY_ID = 'some-key-id';
    process.env.AWS_SECRET_ACCESS_KEY = 'some-secret-key';

    // tslint:disable:max-line-length
    nock('https://example.com/api')
      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9/user_roles').times(5).reply(200, data.userRolesForOrg)
      .get('/v2/service_instances/0d632575-bb06-4ea5-bb19-a451a9644d92').times(1).reply(200, data.serviceInstance)
      .get('/v2/service_plans/779d2df0-9cdd-48e8-9781-ea05301cedb1').times(1).reply(200, data.servicePlan)
      .get('/v2/spaces/38511660-89d9-4a6e-a889-c32c7e94f139').times(1).reply(200, data.space)
      .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, defaultOrg())
      .get('/v2/user_provided_service_instances?q=space_guid:38511660-89d9-4a6e-a889-c32c7e94f139').times(1).reply(200, data.userServices)
      .get('/v2/user_provided_service_instances/54e4c645-7d20-4271-8c27-8cc904e1e7ee').times(1).reply(200, data.userServiceInstance);
    // tslint:enable:max-line-length
  });

  function mockService(service: object) {
    nock('https://example.com/api')
      .get('/v2/services/a14baddf-1ccc-5299-0152-ab9s49de4422').times(1).reply(200, JSON.stringify(service));
  }

  afterEach(() => {
    process.env = {...oldEnv};
  });

  it('should show the service metrics page', async () => {
    nock('https://aws.example.com/')
      .post('/').times(1).reply(200, getStubCloudwatchMetricsData([
        {id: 'mFreeStorageSpace', label: ''},
        {id: 'mCPUUtilization', label: ''},
      ]));

    mockService(data.serviceObj);

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'hour').format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('name-1508 - Service Metrics');
  });

  it('should show the service metrics page for prometheus', async () => {
    nock('https://example.com/prom')
      .get(/api.v1.query_range\??/).times(8).reply(200, {
        status: 'success',
        data: {
          result: [{
            metric: {
              instance: '001',
            },
            values: [
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
              [
                moment().unix(),
                `${Math.random() * 100}`, // tslint:disable-line:insecure-random
              ],
            ],
        }],
      },
    });

    mockService({...data.serviceObj, entity: {...data.serviceObj.entity, label: 'elasticsearch'}});

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'hour').format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('name-1508 - Service Metrics');
  });

  it('should show the service metrics page when asking JUST for over one year of metrics', async () => {
    nock('https://aws.example.com/')
      .post('/').times(1).reply(200, getStubCloudwatchMetricsData([
        {id: 'mFreeStorageSpace', label: ''},
        {id: 'mCPUUtilization', label: ''},
      ]));

    mockService(data.serviceObj);

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'year').subtract(2, 'days').format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('name-1508 - Service Metrics');
  });

  it('should return cloudwatch metrics for a postgres backing service', async () => {
    nock('https://aws.example.com/')
      .post('/').times(1).reply(200, getStubCloudwatchMetricsData([
        {id: 'mFreeStorageSpace', label: 'some-label'},
        {id: 'mCPUUtilization', label: ''},
      ]));

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'postgres',
      },
    });
    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'hour').format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Database Connections');
  });

  it('should return cloudwatch metrics for a redis backing service', async () => {
    nock('https://aws.example.com/')
      .post('/').times(2).reply(200, getStubCloudwatchMetricsData([
        {id: 'mCacheHits', label: ''},
        {id: 'mCacheMisses', label: ''},
      ]));

    mockService({
      ...data.serviceObj,
      entity: {
        ...data.serviceObj.entity,
        label: 'redis',
      },
    });

    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '0d632575-bb06-4ea5-bb19-a451a9644d92',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'hour').format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).toContain('Cache hits');
  });

  it('should not return metrics for a user provided service', async () => {
    const userProvidedServiceGUID = '54e4c645-7d20-4271-8c27-8cc904e1e7ee';
    const response = await viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: userProvidedServiceGUID,
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'hour').format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
    });

    expect(response.status).not.toEqual(302);
    expect(response.body).not.toContain('Database Connections');
    expect(response.body).not.toContain('Cache hits');
    expect(response.body).toContain('Metrics are not available for this service yet.');
  });

  it('should redirect if no range provided', async () => {
    const response = await viewServiceMetrics({
      ...ctx,
      linkTo: (_name, params) => querystring.stringify(params),
    }, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
    });

    expect(response.body).not.toBeDefined();
    expect(response.status).toEqual(302);
    expect(response.redirect).toContain('rangeStart');
    expect(response.redirect).toContain('rangeStop');
  });

  it('should redirect if resolver has been accessed', async () => {
    const response = await resolveServiceMetrics({
      ...ctx,
      linkTo: (_name, params) => querystring.stringify(params),
    }, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      offset: '3h',
    });

    expect(response.body).not.toBeDefined();
    expect(response.status).toEqual(302);
    expect(response.redirect).toContain('rangeStart');
    expect(response.redirect).toContain('rangeStop');
  });

  it('should redirect if resolver has been accessed with an invalid offset', async () => {
    const response = await resolveServiceMetrics({
      ...ctx,
      linkTo: (_name, params) => querystring.stringify(params),
    }, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      offset: '9999999h',
    });

    expect(response.body).not.toBeDefined();
    expect(response.status).toEqual(302);
    expect(response.redirect).toContain('rangeStart');
    expect(response.redirect).toContain('rangeStop');
  });

  it('should throw an error if rangeStop is sooner than rangeStart', async () => {
    await expect(viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().subtract(1, 'hour').format('YYYY-MM-DD[T]HH:mm'),
    })).rejects.toThrow(/Invalid time range provided/);
  });

  it('should throw an error if asking for more than a year of metrics', async () => {
    await expect(viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'year').subtract(2, 'weeks').format('YYYY-MM-DD[T]HH:mm'),
      rangeStop: moment().format('YYYY-MM-DD[T]HH:mm'),
    })).rejects.toThrow('Cannot handle more than a year of metrics');
  });

  it('should throw an error if providing non-ISO format', async () => {
    await expect(viewServiceMetrics(ctx, {
      organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
      serviceGUID: '54e4c645-7d20-4271-8c27-8cc904e1e7ee',
      spaceGUID: '38511660-89d9-4a6e-a889-c32c7e94f139',
      rangeStart: moment().subtract(1, 'week').unix(),
      rangeStop: moment().unix(),
    })).rejects.toThrow('Cannot handle over a year old metrics');
  });
});
