import { _UnmarshalledMetricDataResult as CloudWatchResult } from '@aws-sdk/client-cloudwatch-node';
import { add, Duration, isBefore, isEqual } from 'date-fns';
import _ from 'lodash';

import { IMetric, MetricName } from '../metrics';

export interface ICloudWatchMetric {
  readonly name: string;
  readonly stat: string;
}

export class CloudWatchMetricDataGetter {
  public addPlaceholderData(
    results: ReadonlyArray<CloudWatchResult>,

    period: Duration,
    rangeStart: Date,
    rangeStop: Date,
  ) {
    const placeholderData: { [key: number]: IMetric } = {};
    for (
      let time = new Date(rangeStart);
      isEqual(time, rangeStop) || isBefore(time, rangeStop);
      time = add(time, period)
    ) {
      placeholderData[+time] = { date: time, value: NaN };
    }

    return _.chain(results)
      .groupBy(result => result.Id! as MetricName)
      .mapValues(series => {
        return series.map(serie => {
          const label = serie.Label!;

          const metricPairs = _.zip(serie.Timestamps!, serie.Values!);

          const dataWithoutPlaceholders: { readonly [key: number]: IMetric } = _.chain(
            metricPairs,
          )
            .keyBy(p => +p[0]!)
            .mapValues(p => ({ date: p[0]!, value: p[1]! }))
            .value();

          const metrics: ReadonlyArray<IMetric> = Object.values({
            ...placeholderData,
            ...dataWithoutPlaceholders,
          });

          return { label, metrics };
        });
      })
      .value();
  }
}
