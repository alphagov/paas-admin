import { add } from 'date-fns';

import { ElasticsearchMetricDataGetter } from './elasticsearch';

describe('Elasticsearch', () => {
  describe('getData', () => {
    it('should get data from prometheus', async () => {
      const getSeries = jest.fn();

      const rangeStart = new Date();
      const rangeStop = add(rangeStart, { days: 1 });
      const aValue = 123456.789;

      getSeries.mockReturnValue(
        Promise.resolve([
          {
            label: 'instance',
            metrics: [{ date: rangeStart, value: aValue }],
          },
        ]),
      );

      const dg = new ElasticsearchMetricDataGetter({ getSeries } as any);

      const data = await dg.getData(
        ['loadAvg'],
        'abc-def',
        { minutes: 1 },
        rangeStart,
        rangeStop,
      );

      expect(data).toHaveProperty('loadAvg');
      expect(data.loadAvg).not.toBeUndefined();
      expect(data.loadAvg.length).toEqual(1);
      expect(data.loadAvg[0].label).toEqual('instance');
      expect(data.loadAvg[0].metrics).toContainEqual({
        date: rangeStart,
        value: aValue,
      });
    });

    it('get data should filter out the results of bad queries', async () => {
      const getSeries = jest.fn();

      const rangeStart = new Date();
      const rangeStop = add(rangeStart, { days: 1 });
      const aValue = 123456.789;

      getSeries.mockReturnValueOnce(
        Promise.resolve([
          {
            label: 'instance',
            metrics: [{ date: rangeStart, value: aValue }],
          },
        ]),
      );
      getSeries.mockReturnValueOnce(Promise.resolve(undefined));

      const dg = new ElasticsearchMetricDataGetter({ getSeries } as any);

      const data = await dg.getData(
        ['loadAvg', 'diskUsed'],
        'abc-def',
        { minutes: 1 },
        rangeStart,
        rangeStop,
      );

      expect(data).not.toHaveProperty('diskUsed');

      expect(data).toHaveProperty('loadAvg');
      expect(data.loadAvg).not.toBeUndefined();
      expect(data.loadAvg.length).toEqual(1);
      expect(data.loadAvg[0].label).toEqual('instance');
      expect(data.loadAvg[0].metrics).toContainEqual({
        date: rangeStart,
        value: aValue,
      });
    });
  });
});
