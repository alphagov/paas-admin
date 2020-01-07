export type ServiceLabel = 'postgres' | 'mysql' | 'redis' | string;
export type ServiceType = 'rds' | 'elasticache' | 'cloudfront';

export interface IMetricPropertiesById {
  readonly [key: string]: {
    name: string;
    stat: 'Average' | 'Sum',
    format: string;
    units: 'Bytes' | 'Percent' | 'Number' | 'Milliseconds';
    title: string;
  };
}

export interface IMetricGraphDataResponse {
  readonly graphs: ReadonlyArray<IMetricGraphData>;
  readonly serviceType: ServiceType;
}

export interface IMetricSeries {
  metrics: ReadonlyArray<IMetric>;
  label: string;
}

export interface IMetricGraphData {
  seriesArray: ReadonlyArray<IMetricSeries>;
  id: string;
  format: string;
  units: string;
  title: string;
}

export interface IMetric {
  date: Date;
  value: number;
}

export interface IGraphSummary {
  average: number;
  label: string;
  latest: number;
  min: number;
  max: number;
}

export interface IGraphByID {
  readonly [id: string]: {
    id: string,
    graph: string;
    seriesSummaries: ReadonlyArray<IGraphSummary>;
  };
}
