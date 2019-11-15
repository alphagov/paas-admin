import * as cw from '@aws-sdk/client-cloudwatch-node';
import _ from 'lodash';
import { Duration, Moment } from 'moment';
import { IMetricGraphData, IMetricSeries } from '../../components/charts/line-graph';
import {getElasticacheReplicationGroupId, getRdsDbInstanceIdentifier} from '../../lib/aws/identifiers';

interface IMetricPropertiesById {
  readonly [key: string]: {
    name: string;
    format: string;
    units: 'Bytes' | 'Percent' | 'Number';
    title: string;
  };
}

type ServiceLabel = 'postgres' | 'mysql' | 'redis' | string;
type ServiceType = 'rds' | 'elasticache';

export interface IMetricGraphDataResponse {
  readonly graphs: ReadonlyArray<IMetricGraphData>;
  readonly serviceType: ServiceType;
}

export class CloudwatchMetricDataClient {

  constructor(private cloudWatchClient: cw.CloudWatchClient) {}

  public async getMetricGraphData(
      serviceGUID: string,
      serviceLabel: ServiceLabel,
      period: Duration,
      startTime: Moment,
      endTime: Moment,
      ): Promise<IMetricGraphDataResponse | null> {
    let getMetricDataInputs: ReadonlyArray<cw.GetMetricDataInput> | null = null;
    let serviceType: ServiceType | null = null;
    switch (serviceLabel) {
      case 'postgres':
      case 'mysql':
        serviceType = 'rds';
        getMetricDataInputs = getRdsMetricDataInput(serviceGUID, period, startTime, endTime);
        break;
      case 'redis':
        serviceType = 'elasticache';
        getMetricDataInputs = getElasticacheMetricDataInput(serviceGUID, period, startTime, endTime);
        break;
      default:
        return null;
    }

    const responses = await Promise.all(
      getMetricDataInputs.map(input =>
        this.cloudWatchClient.send(new cw.GetMetricDataCommand(input)),
      ),
    );
    const result = _.flatMap(responses, response => response.MetricDataResults!);
    const preparedData = prepareMetricData(serviceType, result, period, startTime, endTime);
    return {
      graphs: preparedData,
      serviceType,
    };
  }
}

const rdsMetricPropertiesById: IMetricPropertiesById = {
  mFreeStorageSpace: {
    name: 'FreeStorageSpace',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes of free disk space',
  },
  mCPUUtilization: {
    name: 'CPUUtilization',
    format: '.1r',
    units: 'Percent',
    title: 'percentage CPU Utilisation',
  },
  mDatabaseConnections: {
    name: 'DatabaseConnections',
    format: '.1r',
    units: 'Number',
    title: 'number of database connections',
  },
  mFreeableMemory: {
    name: 'FreeableMemory',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes of freeable memory (RAM)',
  },
  mReadIOPS: {
    name: 'ReadIOPS',
    format: '.2r',
    units: 'Number',
    title: 'number of read IOPS',
  },
  mWriteIOPS: {
    name: 'WriteIOPS',
    format: '.2r',
    units: 'Number',
    title: 'number of write IOPS',
  },
};

const elasticacheMetricPropertiesById: IMetricPropertiesById = {
  mCPUUtilization: {
    name: 'CPUUtilization',
    format: '.2r',
    units: 'Percent',
    title: 'percentage CPU Utilisation',
  },
  mBytesUsedForCache: {
    name: 'BytesUsedForCache',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes used for the cache',
  },
  mSwapUsage: {
    name: 'SwapUsage',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes used in swap memory',
  },
  mEvictions: {
    name: 'Evictions',
    format: '.2r',
    units: 'Number',
    title: 'number of keys evicted by Redis',
  },
  mCurrConnections: {
    name: 'CurrConnections',
    format: '.2r',
    units: 'Number',
    title: 'number of connections to Redis',
  },
  mCacheHits: {
    name: 'CacheHits',
    format: '.2r',
    units: 'Number',
    title: 'number of cache hits',
  },
  mCacheMisses: {
    name: 'CacheMisses',
    format: '.2r',
    units: 'Number',
    title: 'number of cache misses',
  },
  mCurrItems: {
    name: 'CurrItems',
    format: '.2r',
    units: 'Number',
    title: 'number of items in Redis',
  },
  mNetworkBytesIn: {
    name: 'NetworkBytesIn',
    format: '.2s',
    units: 'Bytes',
    title: 'number of bytes redis has read from the network',
  },
  mNetworkBytesOut: {
    name: 'NetworkBytesOut',
    format: '.2s',
    units: 'Bytes',
    title: 'number of bytes sent by redis',
  },
};

export function getElasticacheMetricDataInput(
    serviceGUID: string,
    period: Duration,
    startTime: Moment,
    endTime: Moment): readonly cw.GetMetricDataInput[] {
  const replicationGroupId = getElasticacheReplicationGroupId(serviceGUID);

  // AWS won't let us make more than 5 search queries in the same request,
  // so we have to chunk them up into multiple requests.
  // In practice this means we'll be making two or three requests instead of one.
  const chunks = _.chunk(Object.keys(elasticacheMetricPropertiesById), 5);

  return chunks.map(chunk => ({
    MetricDataQueries: chunk.map(metricId => {
      const metricDimension = elasticacheMetricPropertiesById[metricId];
      const expression = `SEARCH('{AWS/ElastiCache,CacheClusterId} MetricName="${metricDimension.name}" AND ${replicationGroupId}', 'Average', ${period.asSeconds()})`;
      return {
        Id: metricId,
        Expression: expression,
      };
    }),
    StartTime: startTime.toDate(),
    EndTime: endTime.toDate(),
  }));
}

export function getRdsMetricDataInput(
    serviceGUID: string,
    period: Duration,
    startTime: Moment,
    endTime: Moment): readonly cw.GetMetricDataInput[] {
  return [{
    MetricDataQueries: Object.keys(rdsMetricPropertiesById).map(metricId => ({
      Id: metricId,
      MetricStat: {
        Metric: {
          Namespace: 'AWS/RDS',
          MetricName: rdsMetricPropertiesById[metricId].name,
          Dimensions: [{Name: 'DBInstanceIdentifier', Value: getRdsDbInstanceIdentifier(serviceGUID)}],
        },
        Period: period.asSeconds(),
        Stat: 'Average',
      },
    })),
    StartTime: startTime.toDate(),
    EndTime: endTime.toDate(),
  }];
}

interface IDataKeyedByEpoch {
  // tslint:disable:readonly-keyword
  [epoch: number]: {
    date: Date;
    value: number;
  };
}

export function prepareMetricData(
      serviceType: 'rds' | 'elasticache',
      metricDataResults: ReadonlyArray<cw._UnmarshalledMetricDataResult>,
      period: Duration,
      startTime: Moment,
      endTime: Moment,
    ): readonly IMetricGraphData[] {

  if (startTime === endTime) {
    throw new Error('Start time cannot be the same as end time');
  }

  const placeholderData: IDataKeyedByEpoch = {};
  for (const time = startTime.clone(); time.isSameOrBefore(endTime); time.add(period)) {
    placeholderData[+time] = {date: time.toDate(), value: NaN};
  }
  const serviceMetricPropertiesById = serviceType === 'rds'
    ? rdsMetricPropertiesById
    : elasticacheMetricPropertiesById;

  return _.chain(metricDataResults)
    .groupBy(x => x.Id!)
    .flatMap(group => {
      const id = group[0].Id!;
      const metricProperties = serviceMetricPropertiesById[id];
      if (!metricProperties) {
        throw new Error(`Couldn't find metric properties for id ${id}, properties were ${Object.keys(serviceMetricPropertiesById)}`);
      }
      const seriesArray: IMetricSeries[] = group.map(x => {
        const dataByEpoch: IDataKeyedByEpoch = _.zip(x.Timestamps!, x.Values!)
          .reduce((acc, [timestamp, value]) => {
            /* istanbul ignore if */
            if (!timestamp || value === null || typeof value === 'undefined') {
              throw new Error(`failed to match timestamp (${typeof timestamp}) with value (${typeof value})`);
            }
            return {...acc, [+timestamp]: {date: timestamp, value}};
          }, {});

        const dataWithPlaceholders = {...placeholderData, ...dataByEpoch};
        return {
          metrics: Object.values(dataWithPlaceholders),
          label: x.Label!,
        };
      });
      return {
        seriesArray,
        format: metricProperties.format,
        units: metricProperties.units,
        title: metricProperties.title,
        id,
      };
    })
    .value();
}
