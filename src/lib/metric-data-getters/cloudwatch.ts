import {
  _UnmarshalledMetricDataResult as CloudWatchResult,
} from '@aws-sdk/client-cloudwatch-node';

import _ from 'lodash';
import moment from 'moment';

import {
  IMetric,
  MetricName,
} from '../metrics';

export interface ICloudWatchMetric {
  name: string;
  stat: string;
}

export class CloudWatchMetricDataGetter {
  public transformCloudWatchMetrics(
    /* tslint:disable readonly-array */
    results: CloudWatchResult[], /* tslint:enable readonly-array */

    period: moment.Duration,
    rangeStart: moment.Moment, rangeStop: moment.Moment,
  ) {

    const placeholderData: {[key: number]: IMetric} = {};
    for (const time = rangeStart.clone(); time.isSameOrBefore(rangeStop); time.add(period)) {
      placeholderData[+time] = {date: time.toDate(), value: NaN};
    }

    return _
      .chain(results)
      .groupBy(result => result.Id! as MetricName)
      .mapValues(series => {
        return series.map(serie => {
          const label = serie.Label!;

          const metricPairs = _.zip(serie.Timestamps!, serie.Values!);

          const dataWithoutPlaceholders: {[key: number]: IMetric} = _
            .chain(metricPairs)
            .keyBy((p) => +p[0]!)
            .mapValues(p => ({ date: p[0]!, value: p[1]! }))
            .value()
          ;

          const metrics: ReadonlyArray<IMetric> = Object.values({
            ...placeholderData, ...dataWithoutPlaceholders,
          });

          return {label, metrics};
        });
      })
      .value()
    ;
  }
}
