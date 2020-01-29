import { RDSMetricDataGetter } from './rds';

describe('RDS', () => {
  describe('getRdsDbInstanceIdentifier', () => {
    it('should prepend rdsbroker- to RDS service guids', () => {
      const dg = new RDSMetricDataGetter({} as any);

      expect(dg.getRdsDbInstanceIdentifier('some-guid')).toBe(
        'rdsbroker-some-guid',
      );
      expect(dg.getRdsDbInstanceIdentifier('some-other-guid')).toBe(
        'rdsbroker-some-other-guid',
      );
    });
  });
});
