import moment from 'moment';
import { CloudwatchMetricDataClient, getRdsMetricDataInput, prepareMetricData } from './cloudwatch-metric-data';

describe('CloudwatchMetricDataClient', () => {
  it('should return null for unrecognised services', async () => {
    const send = jest.fn();
    const client = new CloudwatchMetricDataClient({ send } as any);
    const result = await client.getMetricGraphData(
      'some-service-guid',
      'User provided service',
      moment.duration(1, 'minute'),
      moment(new Date(2019, 1, 1)),
      moment(new Date(2019, 1, 2)),
    );

    expect(send).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should get RDS metrics for postgres', async () => {
    const send = jest.fn();
    send.mockReturnValue({MetricDataResults: []});
    const client = new CloudwatchMetricDataClient({ send } as any);
    const result = await client.getMetricGraphData(
      'some-service-guid',
      'postgres',
      moment.duration(1, 'minute'),
      moment(new Date(2019, 1, 1)),
      moment(new Date(2019, 1, 2)),
    );

    expect(result).not.toBeNull();
    expect(result!.serviceType).toBe('rds');
    expect(send).toHaveBeenCalled();
  });

  it('should get ElastiCache metrics for redis', async () => {
    const send = jest.fn();
    send.mockReturnValue({MetricDataResults: []});
    const client = new CloudwatchMetricDataClient({ send } as any);
    const result = await client.getMetricGraphData(
      'some-service-guid',
      'redis',
      moment.duration(1, 'minute'),
      moment(new Date(2019, 1, 1)),
      moment(new Date(2019, 1, 2)),
    );

    expect(result).not.toBeNull();
    expect(result!.serviceType).toBe('elasticache');
    expect(send).toHaveBeenCalled();
  });
});

describe('getMetricDataCommand', () => {
  it('gets metric data for each of the RDS metric names', () => {
    const result = getRdsMetricDataInput(
      'some-guid',
      moment.duration(1, 'second'),
      moment(new Date(2019, 1, 1)),
      moment(new Date(2019, 1, 2)),
    )[0];

    expect(result.StartTime).toEqual(new Date(2019, 1, 1));
    expect(result.EndTime).toEqual(new Date(2019, 1, 2));
    expect(result.MetricDataQueries).toHaveLength(6);
    expect((result.MetricDataQueries as any[])[0]).toEqual({
      Id: `mFreeStorageSpace`,
      MetricStat: {
        Metric: {
          Namespace: 'AWS/RDS',
          MetricName: 'FreeStorageSpace',
          Dimensions: [{Name: 'DBInstanceIdentifier', Value: 'rdsbroker-some-guid'}],
        },
        Period: 1,
        Stat: 'Average',
      },
    });
  });
});

describe('prepareMetricData', () => {
  it('should return no datapoints if asked for a zero time range', () => {
    const period = moment.duration(1, 'second');
    const startTime =  moment(new Date(2019, 1, 1));
    const endTime = startTime.subtract(1, 'second');
    const metricDataResults: any[] = [];
    expect(() => prepareMetricData('rds', metricDataResults, period, startTime, endTime)).toThrowError(/Start time cannot be the same as end time/);
  });

  it('should error if given an unrecognized id', () => {
    const period = moment.duration(1, 'hour');
    const startTime =  moment(new Date(2019, 1, 1, 0));
    const endTime = moment(new Date(2019, 1, 1, 3));
    const metricDataResults = [
      {
        Timestamps: [new Date(2019, 1, 1, 0)],
        Values: [0],
        Id: 'NO_SUCH_METRIC_ID',
      },
    ];
    expect(() => prepareMetricData('rds', metricDataResults, period, startTime, endTime)).toThrowError(/Couldn't find metric properties for id NO_SUCH_METRIC_ID/);
  });

  it('should match up timestamps and values', () => {
    const period = moment.duration(1, 'hour');
    const startTime =  moment(new Date(2019, 1, 1, 0));
    const endTime = moment(new Date(2019, 1, 1, 3));
    const metricDataResults = [
      {
        Timestamps: [
          new Date(2019, 1, 1, 0),
          new Date(2019, 1, 1, 1),
          new Date(2019, 1, 1, 2),
          new Date(2019, 1, 1, 3),
        ],
        Values: [0, 1, 2, 3],
        Id: 'mFreeStorageSpace',
      },
    ];
    const result = prepareMetricData('rds', metricDataResults, period, startTime, endTime);

    expect(result).toEqual([{
      id: 'mFreeStorageSpace',
      format: '.2s',
      units: 'Bytes',
      title: 'bytes of free disk space',
      seriesArray: [{
        metrics: [
          {date: new Date(2019, 1, 1, 0), value: 0},
          {date: new Date(2019, 1, 1, 1), value: 1},
          {date: new Date(2019, 1, 1, 2), value: 2},
          {date: new Date(2019, 1, 1, 3), value: 3},
        ],
      }],
    }]);

  });

  it('should pad gaps in the range with NaN values', () => {
    const period = moment.duration(1, 'hour');
    const startTime =  moment(new Date(2019, 1, 1, 0));
    const endTime = moment(new Date(2019, 1, 1, 3));
    const metricDataResults = [
      {
        Timestamps: [new Date(2019, 1, 1, 0), new Date(2019, 1, 1, 3)],
        Values: [0, 3],
        Id: 'mFreeStorageSpace',
      },
    ];
    const result = prepareMetricData('rds', metricDataResults, period, startTime, endTime);

    expect(result).toEqual([{
      id: 'mFreeStorageSpace',
      format: '.2s',
      units: 'Bytes',
      title: 'bytes of free disk space',
      seriesArray: [{
        metrics: [
          {date: new Date(2019, 1, 1, 0), value: 0},
          {date: new Date(2019, 1, 1, 1), value: NaN},
          {date: new Date(2019, 1, 1, 2), value: NaN},
          {date: new Date(2019, 1, 1, 3), value: 3},
        ],
      }],
    }]);
  });
});
