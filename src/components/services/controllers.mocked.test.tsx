import { RDS } from 'aws-sdk';

import CloudFoundryClient from '../../lib/cf';
import { createTestContext } from '../app/app.test-helpers';
import { IContext } from '../app/context';

import { downloadServiceLogs, listServiceLogs } from './controllers';

jest.mock('aws-sdk');
jest.mock('../../lib/cf');

const mockCustomService = { metadata: { guid: 'CUSTOM_SERVICE' } };
const mockServiceInstance = { entity: { name: 'mydb' }, metadata: { guid: 'SERVICE_INSTANCE_GUID' } };
const mockServicePlan = { entity: { service_guid: 'SERVICE_GUID' } };
const mockServiceRedis = { entity: { label: 'redis' } };
const mockServicePostgres = { entity: { label: 'postgres' } };
const mockOrganization = { entity: { name: 'org-name' }, metadata: { guid: 'ORG_GUID' } };
const mockSpace = { entity: { name: 'space-name' }, metadata: { guid: 'SPACE_GUID' } };

const ctx: IContext = createTestContext();
const CFClient = CloudFoundryClient as jest.Mock;

describe(listServiceLogs, () => {
  beforeEach(() => {
    CFClient.mockClear();
    // @ts-ignore
    RDS.mockClear();
  });


  it('should throw an error if service is custom user service', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));

    await expect(
      listServiceLogs(ctx, { organizationGUID: 'ORG_GUID', serviceGUID: 'CUSTOM_SERVICE', spaceGUID: 'SPACE_GUID' }),
    ).rejects.toThrowError(/Service Logs are only available for Postgres and MySQL instances/);
  });


  it('should throw an error if service is not supporting logs', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));
    CFClient.prototype.space.mockReturnValueOnce(Promise.resolve(mockSpace));
    CFClient.prototype.organization.mockReturnValueOnce(Promise.resolve(mockOrganization));
    CFClient.prototype.serviceInstance.mockReturnValueOnce(Promise.resolve(mockServiceInstance));
    CFClient.prototype.service.mockReturnValueOnce(Promise.resolve(mockServiceRedis));

    await expect(
      listServiceLogs(ctx, {
        organizationGUID: 'ORG_GUID', serviceGUID: 'SERVICE_INSTANCE_GUID', spaceGUID: 'SPACE_GUID',
      }),
    ).rejects.toThrowError(/Service Logs are only available for Postgres and MySQL instances/);
  });

  it('should successfully list out all the files', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));
    CFClient.prototype.space.mockReturnValueOnce(Promise.resolve(mockSpace));
    CFClient.prototype.organization.mockReturnValueOnce(Promise.resolve(mockOrganization));
    CFClient.prototype.serviceInstance.mockReturnValueOnce(Promise.resolve(mockServiceInstance));
    CFClient.prototype.service.mockReturnValueOnce(Promise.resolve(mockServicePostgres));
    CFClient.prototype.servicePlan.mockReturnValueOnce(Promise.resolve(mockServicePlan));
    // @ts-ignore
    RDS.mockReturnValueOnce({
      describeDBLogFiles: () => ({
        promise: async () => await Promise.resolve({
          DescribeDBLogFiles: [ { LastWritten: 1578837540000, LogFileName: 'file-one', Size: 73728 } ],
        }),
      }),
    });

    const response = await listServiceLogs(ctx, {
      organizationGUID: 'ORG_GUID', serviceGUID: 'SERVICE_INSTANCE_GUID', spaceGUID: 'SPACE_GUID',
    });

    expect(response.body).toContain('Service mydb Logs');
    expect(response.body).toContain('file-one');
  });

  it('should display info about lack of logs', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));
    CFClient.prototype.space.mockReturnValueOnce(Promise.resolve(mockSpace));
    CFClient.prototype.organization.mockReturnValueOnce(Promise.resolve(mockOrganization));
    CFClient.prototype.serviceInstance.mockReturnValueOnce(Promise.resolve(mockServiceInstance));
    CFClient.prototype.service.mockReturnValueOnce(Promise.resolve(mockServicePostgres));
    CFClient.prototype.servicePlan.mockReturnValueOnce(Promise.resolve(mockServicePlan));
    // @ts-ignore
    RDS.mockReturnValueOnce({
      describeDBLogFiles: () => ({
        promise: async () => await Promise.resolve({}),
      }),
    });

    const response = await listServiceLogs(ctx, {
      organizationGUID: 'ORG_GUID', serviceGUID: 'SERVICE_INSTANCE_GUID', spaceGUID: 'SPACE_GUID',
    });

    expect(response.body).toContain('Service mydb Logs');
    expect(response.body).toContain('There are no log files available at this time.');
  });
});

describe(downloadServiceLogs, () => {
  beforeEach(() => {
    CFClient.mockClear();
    // @ts-ignore
    RDS.mockClear();
  });

  it('should throw an error if filename is not defined', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));

    await expect(
      downloadServiceLogs(ctx, {}),
    ).rejects.toThrowError(/The `filename` parameter needs to be provided/);
  });

  it('should throw an error if service is custom user service', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));

    await expect(
      downloadServiceLogs(ctx, {
        filename: 'error/test',
        organizationGUID: 'ORG_GUID',
        serviceGUID: 'CUSTOM_SERVICE',
        spaceGUID: 'SPACE_GUID',
      }),
    ).rejects.toThrowError(/Service Logs are only available for Postgres and MySQL instances/);
  });


  it('should throw an error if service is not supporting logs', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));
    CFClient.prototype.space.mockReturnValueOnce(Promise.resolve(mockSpace));
    CFClient.prototype.organization.mockReturnValueOnce(Promise.resolve(mockOrganization));
    CFClient.prototype.serviceInstance.mockReturnValueOnce(Promise.resolve(mockServiceInstance));
    CFClient.prototype.service.mockReturnValueOnce(Promise.resolve(mockServiceRedis));

    await expect(
      downloadServiceLogs(ctx, {
        filename: 'error/test',
        organizationGUID: 'ORG_GUID',
        serviceGUID: 'SERVICE_INSTANCE_GUID',
        spaceGUID: 'SPACE_GUID',
      }),
    ).rejects.toThrowError(/Service Logs are only available for Postgres and MySQL instances/);
  });

  it('should successfully download file', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));
    CFClient.prototype.space.mockReturnValueOnce(Promise.resolve(mockSpace));
    CFClient.prototype.organization.mockReturnValueOnce(Promise.resolve(mockOrganization));
    CFClient.prototype.serviceInstance.mockReturnValueOnce(Promise.resolve(mockServiceInstance));
    CFClient.prototype.service.mockReturnValueOnce(Promise.resolve(mockServicePostgres));
    // @ts-ignore
    RDS.mockReturnValueOnce({
      downloadDBLogFilePortion: () => ({
        promise: async () => await Promise.resolve({
          LogFileData: '[TIMESTAMP] INFO: Log line\n[TIMESTAMP] ERROR: Another log line',
        }),
      }),
    });

    const response = await downloadServiceLogs(ctx, {
      filename: 'error/test',
      organizationGUID: 'ORG_GUID',
      serviceGUID: 'SERVICE_INSTANCE_GUID',
      spaceGUID: 'SPACE_GUID',
    });

    expect(response.download).toBeDefined();
    expect(response.download!.data).toContain('[TIMESTAMP] ERROR: Another log line');
    expect(response.download!.name).toEqual('db-SERVICE_INSTANCE_GUID-error-test.log');
    expect(response.mimeType).toEqual('text/plain');
  });

  it('should successfully download an empty file if AWS returns undefined', async () => {
    CFClient.prototype.userServices.mockReturnValueOnce(Promise.resolve([ mockCustomService ]));
    CFClient.prototype.space.mockReturnValueOnce(Promise.resolve(mockSpace));
    CFClient.prototype.organization.mockReturnValueOnce(Promise.resolve(mockOrganization));
    CFClient.prototype.serviceInstance.mockReturnValueOnce(Promise.resolve(mockServiceInstance));
    CFClient.prototype.service.mockReturnValueOnce(Promise.resolve(mockServicePostgres));
    // @ts-ignore
    RDS.mockReturnValueOnce({
      downloadDBLogFilePortion: () => ({
        promise: async () => await Promise.resolve({}),
      }),
    });

    const response = await downloadServiceLogs(ctx, {
      filename: 'error/test',
      organizationGUID: 'ORG_GUID',
      serviceGUID: 'SERVICE_INSTANCE_GUID',
      spaceGUID: 'SPACE_GUID',
    });

    expect(response.download).toBeDefined();
    expect(response.download!.data).toEqual('\n');
    expect(response.download!.name).toEqual('db-SERVICE_INSTANCE_GUID-error-test.log');
    expect(response.mimeType).toEqual('text/plain');
  });
});
