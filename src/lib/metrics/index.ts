import { add, Duration, formatISO, sub } from 'date-fns';

import roundDown from '../moment/round';

export type ElasticsearchMetricName = string;

export type CloudFrontMetricName = string;
export type ElasticacheMetricName = string;
export type RDSMetricName = string;

export type MetricName =
  | ElasticsearchMetricName
  | CloudFrontMetricName
  | ElasticacheMetricName
  | RDSMetricName;

export interface IMetric {
  readonly date: Date;
  readonly value: number;
}

export interface IMetricSerieSummary {
  readonly label: string;

  readonly average: number;
  readonly latest: number;
  readonly min: number;
  readonly max: number;
}

export interface IMetricSerie {
  readonly label?: string;

  readonly metrics: ReadonlyArray<IMetric>;
}

export interface IMetricDataGetter {
  readonly getData: (
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: Duration,
    rangeStart: Date,
    rangeStop: Date,
  ) => Promise<{ readonly [key in MetricName]: ReadonlyArray<IMetricSerie> }>;
}

export interface IMetricGraphDisplayable {
  readonly summaries: ReadonlyArray<IMetricSerieSummary>;
  readonly series: ReadonlyArray<IMetricSerie>;
}

/* istanbul ignore next */
export function getGappyRandomData(): {
  readonly timestamps: ReadonlyArray<string>;
  readonly values: ReadonlyArray<number>;
} {
  const minutesInADay = 24 * 60;
  const timestamps: Array<string> = [];
  const values: Array<number> = [];

  const startTime = roundDown(sub(new Date(), { days: 1 }), { minutes: 5 });
  for (let i = 0; i < minutesInADay; i += 5) {
    if (
      i < minutesInADay * 0.2 ||
      (i > minutesInADay * 0.8 && i < minutesInADay * 0.9)
    ) {
      // do nothing - empty piece of the graph
    } else {
      const timestamp = formatISO(add(startTime, { minutes: i }));

      let value = 0;
      if (values.length === 0) {
        value = Math.random() * 105;
      } else {
        value = values[values.length - 1] + 10 * (Math.random() - 0.5);
        value = value > 0 ? value : 0;
      }

      timestamps.push(timestamp);
      values.push(value);
    }
  }

  return { timestamps, values };
}
