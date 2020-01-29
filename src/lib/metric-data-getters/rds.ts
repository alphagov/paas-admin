import _ from 'lodash';
import moment from 'moment';

import * as cw from '@aws-sdk/client-cloudwatch-node';

import { IMetricDataGetter, IMetricSerie, MetricName } from '../metrics';

import { CloudWatchMetricDataGetter, ICloudWatchMetric } from './cloudwatch';

const rdsMetricPropertiesById: { [key in MetricName]: ICloudWatchMetric } = {
  mFreeStorageSpace: {
    name: 'FreeStorageSpace',
    stat: 'Average',
  },
  mCPUUtilization: {
    name: 'CPUUtilization',
    stat: 'Average',
  },
  mDatabaseConnections: {
    name: 'DatabaseConnections',
    stat: 'Average',
  },
  mFreeableMemory: {
    name: 'FreeableMemory',
    stat: 'Average',
  },
  mReadIOPS: {
    name: 'ReadIOPS',
    stat: 'Average',
  },
  mWriteIOPS: {
    name: 'WriteIOPS',
    stat: 'Average',
  },
};

export const rdsMetricNames = Object.keys(rdsMetricPropertiesById);

export class RDSMetricDataGetter extends CloudWatchMetricDataGetter
  implements IMetricDataGetter {
  constructor(private readonly cloudwatchClient: cw.CloudWatchClient) {
    super();
  }

  public getRdsDbInstanceIdentifier(guid: string): string {
    return `rdsbroker-${guid}`;
  }

  public async getData(
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment,
  ): Promise<{ [key in MetricName]: ReadonlyArray<IMetricSerie> }> {
    const instanceId = this.getRdsDbInstanceIdentifier(guid);

    const metricDataInputs = [
      {
        MetricDataQueries: metricNames.map(metricId => ({
          Id: metricId,
          MetricStat: {
            Metric: {
              Namespace: 'AWS/RDS',
              MetricName: rdsMetricPropertiesById[metricId].name,
              Dimensions: [{ Name: 'DBInstanceIdentifier', Value: instanceId }],
            },
            Period: period.asSeconds(),
            Stat: rdsMetricPropertiesById[metricId].stat,
          },
        })),
        StartTime: rangeStart.toDate(),
        EndTime: rangeStop.toDate(),
      },
    ];

    const responses = await Promise.all(
      metricDataInputs.map(input =>
        this.cloudwatchClient.send(new cw.GetMetricDataCommand(input)),
      ),
    );

    const results = _.flatMap(
      responses,
      response => response.MetricDataResults!,
    );

    return Promise.resolve(
      this.addPlaceholderData(results, period, rangeStart, rangeStop),
    );
  }
}
