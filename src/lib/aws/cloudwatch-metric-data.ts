import * as cw from '@aws-sdk/client-cloudwatch-node';
import * as rg from '@aws-sdk/client-resource-groups-tagging-api-node';

import _ from 'lodash';
import { Duration, Moment } from 'moment';
import {
  IMetricGraphData,
  IMetricGraphDataResponse,
  IMetricPropertiesById,
  IMetricSeries,

  ServiceLabel, ServiceType,
} from '../charts';

import {
  getCloudFrontDistributionId,
  getElasticacheReplicationGroupId,
  getRdsDbInstanceIdentifier,
} from '../../lib/aws/identifiers';

export class CloudwatchMetricDataClient {

  constructor(
    private cloudWatchClient: cw.CloudWatchClient,
    private cloudFrontCloudWatchClient: cw.CloudWatchClient,
    private resourceGroupsTaggingAPIClient: rg.ResourceGroupsTaggingAPIClient,
  ) {}

  public async getMetricGraphData(
      serviceGUID: string,
      serviceLabel: ServiceLabel,
      period: Duration,
      startTime: Moment,
      endTime: Moment,
      ): Promise<IMetricGraphDataResponse | null> {
    let getMetricDataInputs: ReadonlyArray<cw.GetMetricDataInput> | null = null;
    let serviceType: ServiceType | null = null;

    let cloudWatchClient: cw.CloudWatchClient = this.cloudWatchClient;

    switch (serviceLabel) {
      case 'cdn-route':
        serviceType = 'cloudfront';

        const distributionId = await getCloudFrontDistributionId(
          this.resourceGroupsTaggingAPIClient,
          serviceGUID,
        );

        getMetricDataInputs = getCloudFrontMetricDataInput(distributionId, period, startTime, endTime);
        cloudWatchClient = this.cloudFrontCloudWatchClient;
        break;
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
      getMetricDataInputs
      .map(input => cloudWatchClient.send(new cw.GetMetricDataCommand(input))),
    );

    const result = _.flatMap(responses, response => response.MetricDataResults!);

    return {
      graphs: prepareMetricData(serviceType, result, period, startTime, endTime),
      serviceType,
    };
  }
}

const rdsMetricPropertiesById: IMetricPropertiesById = {
  mFreeStorageSpace: {
    name: 'FreeStorageSpace',
    stat: 'Average',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes of free disk space',
  },
  mCPUUtilization: {
    name: 'CPUUtilization',
    stat: 'Average',
    format: '.1r',
    units: 'Percent',
    title: 'percentage CPU Utilisation',
  },
  mDatabaseConnections: {
    name: 'DatabaseConnections',
    stat: 'Average',
    format: '.1r',
    units: 'Number',
    title: 'number of database connections',
  },
  mFreeableMemory: {
    name: 'FreeableMemory',
    stat: 'Average',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes of freeable memory (RAM)',
  },
  mReadIOPS: {
    name: 'ReadIOPS',
    stat: 'Average',
    format: '.2r',
    units: 'Number',
    title: 'number of read IOPS',
  },
  mWriteIOPS: {
    name: 'WriteIOPS',
    stat: 'Average',
    format: '.2r',
    units: 'Number',
    title: 'number of write IOPS',
  },
};

const elasticacheMetricPropertiesById: IMetricPropertiesById = {
  mCPUUtilization: {
    name: 'CPUUtilization',
    stat: 'Average',
    format: '.2r',
    units: 'Percent',
    title: 'percentage CPU Utilisation',
  },
  mBytesUsedForCache: {
    name: 'BytesUsedForCache',
    stat: 'Average',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes used for the cache',
  },
  mSwapUsage: {
    name: 'SwapUsage',
    stat: 'Average',
    format: '.2s',
    units: 'Bytes',
    title: 'bytes used in swap memory',
  },
  mEvictions: {
    name: 'Evictions',
    stat: 'Average',
    format: '.2s',
    units: 'Number',
    title: 'number of keys evicted by Redis',
  },
  mCurrConnections: {
    name: 'CurrConnections',
    stat: 'Average',
    format: '.2r',
    units: 'Number',
    title: 'number of connections to Redis',
  },
  mCacheHits: {
    name: 'CacheHits',
    stat: 'Average',
    format: '.2s',
    units: 'Number',
    title: 'number of cache hits',
  },
  mCacheMisses: {
    name: 'CacheMisses',
    stat: 'Average',
    format: '.2s',
    units: 'Number',
    title: 'number of cache misses',
  },
  mCurrItems: {
    name: 'CurrItems',
    stat: 'Average',
    format: '.2s',
    units: 'Number',
    title: 'number of items in Redis',
  },
  mNetworkBytesIn: {
    name: 'NetworkBytesIn',
    stat: 'Average',
    format: '.2s',
    units: 'Bytes',
    title: 'number of bytes redis has read from the network',
  },
  mNetworkBytesOut: {
    name: 'NetworkBytesOut',
    stat: 'Average',
    format: '.2s',
    units: 'Bytes',
    title: 'number of bytes sent by redis',
  },
};

const cloudfrontMetricPropertiesById: IMetricPropertiesById = {
  mRequests: {
    name: 'Requests',
    stat: 'Sum',
    format: '.2s',
    units: 'Number',
    title: 'HTTP requests',
  },
  mBytesUploaded: {
    name: 'BytesUploaded',
    stat: 'Sum',
    format: '.2s',
    units: 'Bytes',
    title: 'number of bytes sent to the origin',
  },
  mBytesDownloaded: {
    name: 'BytesDownloaded',
    stat: 'Sum',
    format: '.2s',
    units: 'Bytes',
    title: 'number of bytes received from the origin',
  },

  m4xxErrorRate: {
    name: '4xxErrorRate',
    stat: 'Average',
    format: '.1s',
    units: 'Percent',
    title: 'percentage of HTTP requests with a 4XX status code',
  },
  m5xxErrorRate: {
    name: '5xxErrorRate',
    stat: 'Average',
    format: '.1s',
    units: 'Percent',
    title: 'percentage of HTTP requests with a 5XX status code',
  },
  mTotalErrorRate: {
    name: 'TotalErrorRate',
    stat: 'Average',
    format: '.1s',
    units: 'Percent',
    title: 'percentage of HTTP requests with either a 4XX or 5XX status code',
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
        Stat: rdsMetricPropertiesById[metricId].stat,
      },
    })),
    StartTime: startTime.toDate(),
    EndTime: endTime.toDate(),
  }];
}

export function getCloudFrontMetricDataInput(
    distributionId: string,
    period: Duration,
    startTime: Moment,
    endTime: Moment): readonly cw.GetMetricDataInput[] {

  return [{
    MetricDataQueries: Object.keys(cloudfrontMetricPropertiesById).map(metricId => ({
      Id: metricId,
      MetricStat: {
        Metric: {
          Namespace: 'AWS/CloudFront',
          MetricName: cloudfrontMetricPropertiesById[metricId].name,
          Dimensions: [
            { Name: 'DistributionId', Value: distributionId },
            { Name: 'Region',         Value: 'Global' },
          ],
        },
        Period: period.asSeconds(),
        Stat: cloudfrontMetricPropertiesById[metricId].stat,
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
      serviceType: 'rds' | 'elasticache' | 'cloudfront',
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

  const serviceMetricPropertiesById = {
    cloudfront: cloudfrontMetricPropertiesById,
    elasticache: elasticacheMetricPropertiesById,
    rds: rdsMetricPropertiesById,
  }[serviceType];

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
