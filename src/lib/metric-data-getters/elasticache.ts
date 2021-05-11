
import * as cw from '@aws-sdk/client-cloudwatch-node'
import base32Encode from 'base32-encode' // eslint-disable-line import/default
import fnv from 'fnv-plus'
import _ from 'lodash'
import moment from 'moment'

import { IMetricDataGetter, IMetricSerie, MetricName } from '../metrics'

import { CloudWatchMetricDataGetter, ICloudWatchMetric } from './cloudwatch'

const elasticacheMetricPropertiesById: {
  [key in MetricName]: ICloudWatchMetric;
} = {
  mCPUUtilization: {
    name: 'CPUUtilization',
    stat: 'Average'
  },
  mBytesUsedForCache: {
    name: 'BytesUsedForCache',
    stat: 'Average'
  },
  mSwapUsage: {
    name: 'SwapUsage',
    stat: 'Average'
  },
  mEvictions: {
    name: 'Evictions',
    stat: 'Average'
  },
  mCurrConnections: {
    name: 'CurrConnections',
    stat: 'Average'
  },
  mCacheHits: {
    name: 'CacheHits',
    stat: 'Average'
  },
  mCacheMisses: {
    name: 'CacheMisses',
    stat: 'Average'
  },
  mCurrItems: {
    name: 'CurrItems',
    stat: 'Average'
  },
  mNetworkBytesIn: {
    name: 'NetworkBytesIn',
    stat: 'Average'
  },
  mNetworkBytesOut: {
    name: 'NetworkBytesOut',
    stat: 'Average'
  }
}

export const elasticacheMetricNames = Object.keys(
  elasticacheMetricPropertiesById
)

export class ElastiCacheMetricDataGetter extends CloudWatchMetricDataGetter
  implements IMetricDataGetter {
  constructor (private readonly cloudwatchClient: cw.CloudWatchClient) {
    super()
  }

  public getElasticacheReplicationGroupId (guid: string): string {
    const hashHexString = fnv.hash(guid, 64).hex()
    const hashBuffer = Buffer.from(hashHexString, 'hex')
    const hashBase32String = base32Encode(hashBuffer, 'RFC4648', {
      padding: false
    })

    return `cf-${hashBase32String.toLowerCase()}`
  }

  public async getData (
    metricNames: readonly MetricName[],
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment
  ): Promise<{ [key in MetricName]: readonly IMetricSerie[] }> {
    const replicationGroupId = this.getElasticacheReplicationGroupId(guid)

    // AWS won't let us make more than 5 search queries in the same request,
    // so we have to chunk them up into multiple requests.
    // In practice this means we'll be making two or three requests instead of one.
    const chunks = _.chunk(metricNames, 5)

    const metricDataInputs = chunks.map(chunk => ({
      MetricDataQueries: chunk.map(metricId => {
        const metricDimension = elasticacheMetricPropertiesById[metricId]
        const expression = `SEARCH('{AWS/ElastiCache,CacheClusterId} MetricName="${
          metricDimension.name
        }" AND ${replicationGroupId}', 'Average', ${period.asSeconds()})`

        return {
          Expression: expression,
          Id: metricId
        }
      }),
      StartTime: rangeStart.toDate(),
      EndTime: rangeStop.toDate()
    }))

    const responses = await Promise.all(
      metricDataInputs.map(async input =>
        await this.cloudwatchClient.send(new cw.GetMetricDataCommand(input))
      )
    )

    const results = _.flatMap(
      responses,
      response => response.MetricDataResults!
    )

    return Promise.resolve(
      this.addPlaceholderData(results, period, rangeStart, rangeStop)
    )
  }
}
