import { ElastiCacheMetricDataGetter } from './elasticache';

describe('ElastiCache', () => {
  describe('getElasticacheReplicationGroupId', () => {
    it('should hash Elasticache service guids with FNV-1a and prepend cf-', () => {
      const dg = new ElastiCacheMetricDataGetter({} as any);

      // These golden values were generated using `paas-elasticache-broker/cache-cluster-name-generator`
      expect(dg.getElasticacheReplicationGroupId('guid-1')).toBe('cf-ux4xkdjccy5em');
      expect(dg.getElasticacheReplicationGroupId('guid-2')).toBe('cf-ux4xidjccy4jg');
      expect(dg.getElasticacheReplicationGroupId('guid-3')).toBe('cf-ux4xgdjccy3oa');
      expect(dg.getElasticacheReplicationGroupId('guid-4')).toBe('cf-ux4xudjcczbmk');
      expect(dg.getElasticacheReplicationGroupId('guid-5')).toBe('cf-ux4xsdjcczare');
      expect(dg.getElasticacheReplicationGroupId('guid-6')).toBe('cf-ux4xqdjccy7v6');
      expect(dg.getElasticacheReplicationGroupId('guid-7')).toBe('cf-ux4xodjccy62y');
      expect(dg.getElasticacheReplicationGroupId('guid-8')).toBe('cf-ux4x4djcczezc');
      expect(dg.getElasticacheReplicationGroupId('guid-9')).toBe('cf-ux4x2djcczd54');
      expect(dg.getElasticacheReplicationGroupId('guid-10')).toBe('cf-duofwuhlyvlie');
      expect(dg.getElasticacheReplicationGroupId('guid-11')).toBe('cf-duofyuhlyvmdk');
      expect(dg.getElasticacheReplicationGroupId('guid-12')).toBe('cf-duofsuhlyvjry');
      expect(dg.getElasticacheReplicationGroupId('guid-13')).toBe('cf-duofuuhlyvkm6');
      expect(dg.getElasticacheReplicationGroupId('guid-14')).toBe('cf-duofouhlyvh3m');
      expect(dg.getElasticacheReplicationGroupId('guid-15')).toBe('cf-duofquhlyviws');
    });
  });
});
