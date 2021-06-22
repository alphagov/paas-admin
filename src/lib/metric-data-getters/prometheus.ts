import { add, Duration, isBefore, isEqual, milliseconds, millisecondsToSeconds } from 'date-fns';
import _ from 'lodash';

import { IMetric, IMetricSerie, MetricName } from '../metrics';
import PromClient from '../prom';

export class PrometheusMetricDataGetter {
  constructor(private readonly promClient: PromClient) {}

  public addPlaceholderData(
    series: ReadonlyArray<IMetricSerie>,

    period: Duration,
    rangeStart: Date,
    rangeStop: Date,
  ): ReadonlyArray<IMetricSerie> {
    const placeholderData: { [key: number]: IMetric } = {};
    for (
      let time = new Date(rangeStart);
      isEqual(time, rangeStop) || isBefore(time, rangeStop);
      time = add(time, period)
    ) {
      placeholderData[+time] = { date: time, value: NaN };
    }

    return series.map(serie => {
      const metricDataByTimestamp: { [key: number]: IMetric } = {};
      serie.metrics.forEach(
        metric => (metricDataByTimestamp[+metric.date] = metric),
      );

      const serieWithPlaceholders = {
        ...placeholderData,
        ...metricDataByTimestamp,
      };

      return {
        label: serie.label,
        metrics: _.map(serieWithPlaceholders, metric => ({
          date: metric.date,
          value: metric.value,
        })),
      };
    });
  }

  public async getDataFromPrometheus(
    metricNames: ReadonlyArray<MetricName>,
    queries: ReadonlyArray<string>,
    period: Duration,
    rangeStart: Date,
    rangeStop: Date,
  ): Promise<{ [key in MetricName]: ReadonlyArray<IMetricSerie> }> {
    const queryResults: ReadonlyArray<
      ReadonlyArray<IMetricSerie> | undefined
    > = await Promise.all(
      queries.map(async query =>
        await this.promClient.getSeries(
          query,
          millisecondsToSeconds(milliseconds(period)),
          rangeStart,
          rangeStop,
        ),
      ),
    );

    const queriesAndResults: {
      [key in MetricName]: ReadonlyArray<IMetricSerie> | undefined;
    } = _.zipObject(metricNames, queryResults);

    const metricData: { [key in MetricName]: ReadonlyArray<IMetricSerie> } = {};
    _.forEach(
      queriesAndResults,
      (
        maybeSerie: ReadonlyArray<IMetricSerie> | undefined,
        metricName: MetricName,
      ) => {
        if (typeof maybeSerie !== 'undefined') {
          metricData[metricName] = maybeSerie!;
        }
      },
    );

    return metricData;
  }
}
