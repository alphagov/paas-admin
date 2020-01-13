import {
  _UnmarshalledMetricDataResult as CloudWatchResult,
} from '@aws-sdk/client-cloudwatch-node';

import _ from 'lodash';
import moment from 'moment';

import {
  IMetric,
  IMetricSerie,
} from '../metrics';

export class PrometheusMetricDataGetter {
  public addPlaceholderData(
    series: ReadonlyArray<IMetricSerie>,

    period: moment.Duration,
    rangeStart: moment.Moment, rangeStop: moment.Moment,
  ): ReadonlyArray<IMetricSerie> {

    const placeholderData: {[key: number]: IMetric} = {};
    for (const time = rangeStart.clone(); time.isSameOrBefore(rangeStop); time.add(period)) {
      placeholderData[+time] = {date: time.toDate(), value: NaN};
    }

    return series.map(serie => {
      const metricDataByTimestamp: {[key: number]: IMetric} = {};
      serie.metrics.forEach(metric => metricDataByTimestamp[+metric.date] = metric);

      const serieWithPlaceholders = {
        ...placeholderData,
        ...metricDataByTimestamp,
      };

      return {
        label: serie.label,
        metrics: _.map(serieWithPlaceholders, metric => ({date: metric.date, value: metric.value})),
      };
    });
  }
}
