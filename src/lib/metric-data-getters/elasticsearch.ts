import _ from 'lodash';
import moment from 'moment';

import {
  IMetric,
  IMetricDataGetter,
  IMetricSerie,
  MetricName,
} from '../metrics';

import PromClient from '../prom';

export interface IPrometheusMetric {
  promQL: (guid: string) => string;
}

const elasticsearchMetricPropertiesById: {[key in MetricName]: IPrometheusMetric} = {
  loadAvg: {
    promQL: (guid: string) => `system_load1{service=~".*-${guid}"}`,
  },
};

export const elasticsearchMetricNames = Object.keys(elasticsearchMetricPropertiesById);

export class ElasticsearchMetricDataGetter implements IMetricDataGetter {

  constructor(
    private promClient: PromClient,
  ) {}

  public async getData(
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment, rangeStop: moment.Moment,
  ): Promise<{[key in MetricName]: ReadonlyArray<IMetricSerie>}> {

    const queryResults: ReadonlyArray<ReadonlyArray<IMetricSerie> | undefined> = await Promise.all(
      metricNames.map(metricName => this.promClient.getSeries(
        elasticsearchMetricPropertiesById[metricName].promQL(guid),
        period.asSeconds(), rangeStart.toDate(), rangeStop.toDate(),
      )),
    );

    const queriesAndResults: { [key in MetricName]: ReadonlyArray<IMetricSerie> | undefined } = _.zipObject(
      metricNames,
      queryResults,
    );

    const metricData: { [key in MetricName]: ReadonlyArray<IMetricSerie> } = {};
    _.forEach(queriesAndResults, (maybeSerie: ReadonlyArray<IMetricSerie> | undefined, metricName: MetricName) => {
      if (typeof maybeSerie !== 'undefined') {
        metricData[metricName] = maybeSerie!;
      }
    });

    const placeholderData: {[key: number]: IMetric} = {};
    for (const time = rangeStart.clone(); time.isSameOrBefore(rangeStop); time.add(period)) {
      placeholderData[+time] = {date: time.toDate(), value: NaN};
    }

    const metricDataWithPlaceholders = _.mapValues(metricData, series => {
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
    });

    return Promise.resolve(metricDataWithPlaceholders);
  }
}
