import * as cw from '@aws-sdk/client-cloudwatch-node'
import _ from 'lodash'
import moment from 'moment'

import { IMetricDataGetter, IMetricSerie, MetricName } from '../metrics'

import { CloudWatchMetricDataGetter, ICloudWatchMetric } from './cloudwatch'

const rdsMetricPropertiesById: { [key in MetricName]: ICloudWatchMetric } = {
  mFreeStorageSpace: {
    name: 'FreeStorageSpace',
    stat: 'Average'
  },
  mCPUUtilization: {
    name: 'CPUUtilization',
    stat: 'Average'
  },
  mDatabaseConnections: {
    name: 'DatabaseConnections',
    stat: 'Average'
  },
  mFreeableMemory: {
    name: 'FreeableMemory',
    stat: 'Average'
  },
  mReadIOPS: {
    name: 'ReadIOPS',
    stat: 'Average'
  },
  mWriteIOPS: {
    name: 'WriteIOPS',
    stat: 'Average'
  }
}

export const rdsMetricNames = Object.keys(rdsMetricPropertiesById)

export class RDSMetricDataGetter extends CloudWatchMetricDataGetter
  implements IMetricDataGetter {
  constructor (private readonly cloudwatchClient: cw.CloudWatchClient) {
    super()
  }

  public getRdsDbInstanceIdentifier (guid: string): string {
    return `rdsbroker-${guid}`
  }

  public async getData (
    metricNames: readonly MetricName[],
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment
  ): Promise<{ [key in MetricName]: readonly IMetricSerie[] }> {
    const instanceId = this.getRdsDbInstanceIdentifier(guid)

    const metricDataInputs = [
      {
        MetricDataQueries: metricNames.map(metricId => ({
          Id: metricId,
          MetricStat: {
            Metric: {
              Dimensions: [{ Name: 'DBInstanceIdentifier', Value: instanceId }],
              MetricName: rdsMetricPropertiesById[metricId].name,
              Namespace: 'AWS/RDS'
            },
            Period: period.asSeconds(),
            Stat: rdsMetricPropertiesById[metricId].stat
          }
        })),
        StartTime: rangeStart.toDate(),
        EndTime: rangeStop.toDate()
      }
    ]

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
