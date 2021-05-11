import _ from 'lodash'
import moment from 'moment'

import { IMetric, IMetricSerie, MetricName } from '../metrics'
import PromClient from '../prom'

export class PrometheusMetricDataGetter {
  constructor (private readonly promClient: PromClient) {}

  public addPlaceholderData (
    series: readonly IMetricSerie[],

    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment
  ): readonly IMetricSerie[] {
    const placeholderData: { [key: number]: IMetric } = {}
    for (
      const time = rangeStart.clone();
      time.isSameOrBefore(rangeStop);
      time.add(period)
    ) {
      placeholderData[+time] = { date: time.toDate(), value: NaN }
    }

    return series.map(serie => {
      const metricDataByTimestamp: { [key: number]: IMetric } = {}
      serie.metrics.forEach(
        metric => (metricDataByTimestamp[+metric.date] = metric)
      )

      const serieWithPlaceholders = {
        ...placeholderData,
        ...metricDataByTimestamp
      }

      return {
        label: serie.label,
        metrics: _.map(serieWithPlaceholders, metric => ({
          date: metric.date,
          value: metric.value
        }))
      }
    })
  }

  public async getDataFromPrometheus (
    metricNames: readonly MetricName[],
    queries: readonly string[],
    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment
  ): Promise<{ [key in MetricName]: readonly IMetricSerie[] }> {
    const queryResults: ReadonlyArray<
    readonly IMetricSerie[] | undefined
    > = await Promise.all(
      queries.map(async query =>
        await this.promClient.getSeries(
          query,
          period.asSeconds(),
          rangeStart.toDate(),
          rangeStop.toDate()
        )
      )
    )

    const queriesAndResults: {
      [key in MetricName]: readonly IMetricSerie[] | undefined;
    } = _.zipObject(metricNames, queryResults)

    const metricData: { [key in MetricName]: readonly IMetricSerie[] } = {}
    _.forEach(
      queriesAndResults,
      (
        maybeSerie: readonly IMetricSerie[] | undefined,
        metricName: MetricName
      ) => {
        if (typeof maybeSerie !== 'undefined') {
          metricData[metricName] = maybeSerie!
        }
      }
    )

    return metricData
  }
}
