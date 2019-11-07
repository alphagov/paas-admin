import {getElasticacheReplicationGroupId, getRdsDbInstanceIdentifier} from './identifiers';

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

});
