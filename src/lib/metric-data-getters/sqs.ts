import * as cw from '@aws-sdk/client-cloudwatch-node';
import _ from 'lodash';
import moment from 'moment';


import { IMetricDataGetter, IMetricSerie, MetricName } from '../metrics';

import { CloudWatchMetricDataGetter, ICloudWatchMetric } from './cloudwatch';

const sqsMetricPropertiesById: { [key in MetricName]: ICloudWatchMetric } = {
  mNumberOfMessagesReceived: {
    name: 'NumberOfMessagesReceived',
    stat: 'Average',
  },
  mNumberOfMessagesSent: {
    name: 'NumberOfMessagesSent',
    stat: 'Average',
  },
};

export const sqsMetricNames = Object.keys(sqsMetricPropertiesById);

export class SQSMetricDataGetter extends CloudWatchMetricDataGetter
  implements IMetricDataGetter {

  constructor(private readonly cloudwatchClient: cw.CloudWatchClient) {
    super();
  }

  public getSQSQueueName(guid: string): string {
    return `paas-sqs-broker-${guid}-pri`;
  }

  public async getData(
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment,
  ): Promise<{ [key in MetricName]: ReadonlyArray<IMetricSerie> }> {

    const metricDataInputs = [
      {
        MetricDataQueries: metricNames.map(metricId => ({
          Id: metricId,
          MetricStat: {
            Metric: {
              Dimensions: [{
                Name: 'QueueName',
                Value: this.getSQSQueueName(guid),
              }],
              MetricName: sqsMetricPropertiesById[metricId].name,
              Namespace: 'AWS/SQS',
            },
            Period: period.asSeconds(),
            Stat: sqsMetricPropertiesById[metricId].stat,
          },
        })),
        StartTime: rangeStart.toDate(),
        EndTime: rangeStop.toDate(),
      },
    ];

    const responses = await Promise.all(
      metricDataInputs.map(async input =>
        await this.cloudwatchClient.send(new cw.GetMetricDataCommand(input)),
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
