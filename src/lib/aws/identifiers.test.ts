import {
  GetResourcesCommand,
} from '@aws-sdk/client-resource-groups-tagging-api-node';

import {
  getCloudFrontDistributionId,
  getElasticacheReplicationGroupId,
  getRdsDbInstanceIdentifier,
} from './identifiers';

describe('AWS identifiers', () => {

  it('should prepend rdsbroker- to RDS service guids', () => {
    expect(getRdsDbInstanceIdentifier('some-guid')).toBe('rdsbroker-some-guid');
    expect(getRdsDbInstanceIdentifier('some-other-guid')).toBe('rdsbroker-some-other-guid');
  });

  it('should hash Elasticache service guids with FNV-1a and prepend cf-', () => {
    // These golden values were generated using `paas-elasticache-broker/cache-cluster-name-generator`
    expect(getElasticacheReplicationGroupId('guid-1')).toBe('cf-ux4xkdjccy5em');
    expect(getElasticacheReplicationGroupId('guid-2')).toBe('cf-ux4xidjccy4jg');
    expect(getElasticacheReplicationGroupId('guid-3')).toBe('cf-ux4xgdjccy3oa');
    expect(getElasticacheReplicationGroupId('guid-4')).toBe('cf-ux4xudjcczbmk');
    expect(getElasticacheReplicationGroupId('guid-5')).toBe('cf-ux4xsdjcczare');
    expect(getElasticacheReplicationGroupId('guid-6')).toBe('cf-ux4xqdjccy7v6');
    expect(getElasticacheReplicationGroupId('guid-7')).toBe('cf-ux4xodjccy62y');
    expect(getElasticacheReplicationGroupId('guid-8')).toBe('cf-ux4x4djcczezc');
    expect(getElasticacheReplicationGroupId('guid-9')).toBe('cf-ux4x2djcczd54');
    expect(getElasticacheReplicationGroupId('guid-10')).toBe('cf-duofwuhlyvlie');
    expect(getElasticacheReplicationGroupId('guid-11')).toBe('cf-duofyuhlyvmdk');
    expect(getElasticacheReplicationGroupId('guid-12')).toBe('cf-duofsuhlyvjry');
    expect(getElasticacheReplicationGroupId('guid-13')).toBe('cf-duofuuhlyvkm6');
    expect(getElasticacheReplicationGroupId('guid-14')).toBe('cf-duofouhlyvh3m');
    expect(getElasticacheReplicationGroupId('guid-15')).toBe('cf-duofquhlyviws');
  });

  describe('identifiers from tags', () => {
    it('should fetch and transform the identifier correctly', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({
        ResourceTagMappingList: [{
          ResourceARN: 'arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5',
        }],
      }));

      const distributionId = await getCloudFrontDistributionId({ send } as any, 'a-service-guid');

      expect(send).toBeCalledWith(new GetResourcesCommand({TagFilters: [{
        Key: 'ServiceInstance',
        Values: ['a-service-guid'],
      }]}));

      expect(distributionId).toEqual('EDFDVBD632BHDS5');
    });

    it('should error when no useful response is returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({}));

      await expect(getCloudFrontDistributionId({ send } as any, 'a-service-guid'))
        .rejects
        .toThrow(/Could not get tags for CloudFront distribution/)
      ;

      expect(send).toBeCalledWith(new GetResourcesCommand({TagFilters: [{
        Key: 'ServiceInstance',
        Values: ['a-service-guid'],
      }]}));
    });

    it('should error when no distributions are returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({ ResourceTagMappingList: [] }));

      await expect(getCloudFrontDistributionId({ send } as any, 'a-service-guid'))
        .rejects
        .toThrow(/Could not get tags for CloudFront distribution/)
      ;

      expect(send).toBeCalledWith(new GetResourcesCommand({TagFilters: [{
        Key: 'ServiceInstance',
        Values: ['a-service-guid'],
      }]}));
    });

    it('should error when no arn is returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({ ResourceTagMappingList: [{}] }));

      await expect(getCloudFrontDistributionId({ send } as any, 'a-service-guid'))
        .rejects
        .toThrow(/Could not get ARN for CloudFront distribution/)
      ;

      expect(send).toBeCalledWith(new GetResourcesCommand({TagFilters: [{
        Key: 'ServiceInstance',
        Values: ['a-service-guid'],
      }]}));
    });

    it('should error when a malformed arn is returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({ ResourceTagMappingList: [{
        ResourceARN: 'arn:aws:cloudfront::123456789012:distribution',
      }] }));

      await expect(getCloudFrontDistributionId({ send } as any, 'a-service-guid'))
        .rejects
        .toThrow(/Malformed ARN/)
      ;

      expect(send).toBeCalledWith(new GetResourcesCommand({TagFilters: [{
        Key: 'ServiceInstance',
        Values: ['a-service-guid'],
      }]}));
    });
  });
});
