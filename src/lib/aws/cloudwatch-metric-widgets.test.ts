import { getMetricWidget } from './cloudwatch-metric-widgets';

describe('getMetricWidget', () => {
  it('should get an RDS metric widget for postgres', () => {
    const widget = getMetricWidget('postgres', 'CPUUtilization', 'some-service-instance-guid');
    expect(widget.metrics).toStrictEqual([[
      'AWS/RDS', 'CPUUtilization', 'DBInstanceIdentifier', 'rdsbroker-some-service-instance-guid',
    ]]);
    expect(widget.legend).toStrictEqual({position: 'hidden'});
  });

  it('should get an RDS metric widget for mysql', () => {
    const widget = getMetricWidget('mysql', 'FreeableMemory', 'some-service-instance-guid');
    expect(widget.metrics).toStrictEqual([[
      'AWS/RDS', 'FreeableMemory', 'DBInstanceIdentifier', 'rdsbroker-some-service-instance-guid',
    ]]);
    expect(widget.legend).toStrictEqual({position: 'hidden'});
  });

  it('should get an ElastiCache metric widget for redis', () => {
    const widget = getMetricWidget('redis', 'BytesUsedForCache', 'some-service-instance-guid');
    expect(widget.metrics).toStrictEqual([[{
      expression: `SEARCH('{AWS/ElastiCache,CacheClusterId} MetricName="BytesUsedForCache" AND cf-th3c2nitfdqoc', 'Average', 300)`,
      label: '',
    }]]);
    expect(widget.legend).toStrictEqual({position: 'bottom'});
  });

  it('should error if asked for an unsupported service', () => {
    expect(() => getMetricWidget('oracle-db', 'CPUUtilization', 'some-service-instance-guid'))
      .toThrowError(/not supported for service type oracle-db/);
  });

  it('should error if asked for an unsupported metric dimension', () => {
    expect(() => getMetricWidget('postgres', 'That\'s no moon!', 'some-service-instance-guid'))
      .toThrowError(/metric dimension That's no moon! is not supported/);
    expect(() => getMetricWidget('mysql', 'That\'s no moon!', 'some-service-instance-guid'))
      .toThrowError(/metric dimension That's no moon! is not supported/);
    expect(() => getMetricWidget('redis', 'That\'s no moon!', 'some-service-instance-guid'))
      .toThrowError(/metric dimension That's no moon! is not supported/);
  });
});
