import moment from 'moment';

export type ElasticsearchMetricName = string;

export type CloudFrontMetricName = string;
export type ElasticacheMetricName = string;
export type RDSMetricName = string;

export type MetricName =
  ElasticsearchMetricName
  | CloudFrontMetricName | ElasticacheMetricName | RDSMetricName
;

export type ServiceLabel = 'postgres' | 'mysql' | 'redis' | string;
export type ServiceType = 'rds' | 'elasticache' | 'cloudfront';

export interface IMetric {
  date: Date;
  value: number;
}

export interface IMetricSerieSummary {
  label: string;

  average: number;
  latest: number;
  min: number;
  max: number;
}

export interface IMetricSerie {
  label: string;

  metrics: ReadonlyArray<IMetric>;
}

export interface IMetricDataGetter {
  readonly getData: (
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment,
  ) => Promise<{[key in MetricName]: ReadonlyArray<IMetricSerie>}>;
}

export interface IMetricGraphDisplayable {
  readonly summaries: ReadonlyArray<IMetricSerieSummary>;
  readonly series: ReadonlyArray<IMetricSerie>;
}
