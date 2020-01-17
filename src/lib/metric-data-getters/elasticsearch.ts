import _ from 'lodash';
import moment from 'moment';

import {
  IMetricDataGetter,
  IMetricSerie,
  MetricName,
} from '../metrics';

import PromClient from '../prom';

import { PrometheusMetricDataGetter } from './prometheus';

export interface IPrometheusMetric {
  promQL: (guid: string) => string;
}

const elasticsearchMetricPropertiesById: {[key in MetricName]: IPrometheusMetric} = {
  loadAvg: {
    promQL: (guid: string) => `avg by (instance) (system_load1{service=~".*-${guid}"})`,
  },
  diskUsed: {
    promQL: (guid: string) => `avg by (instance) (disk_used_percent{service=~".*-${guid}"})`,
  },
  diskReads: {
    promQL: (guid: string) => `avg by (instance) (rate(diskio_reads{service=~".*-${guid}"}[5m]))`,
  },
  diskWrites: {
    promQL: (guid: string) => `avg by (instance) (rate(diskio_writes{service=~".*-${guid}"}[5m]))`,
  },
  memoryUsed: {
    promQL: (guid: string) => `avg by (instance) (mem_used_percent{service=~".*-${guid}"})`,
  },
  networkIn: {
    promQL: (guid: string) => `avg by (instance) (rate(net_bytes_recv{service=~".*-${guid}"}[5m]))`,
  },
  networkOut: {
    promQL: (guid: string) => `avg by (instance) (rate(net_bytes_sent{service=~".*-${guid}"}[5m]))`,
  },
  elasticsearchIndicesCount: {
    promQL: (guid: string) => `avg by (instance) (elasticsearch_clusterstats_indices_count{service=~".*-${guid}"})`,
  },
};

export const elasticsearchMetricNames = Object.keys(elasticsearchMetricPropertiesById);

export class ElasticsearchMetricDataGetter extends PrometheusMetricDataGetter implements IMetricDataGetter {
  constructor(promClient: PromClient) {
    super(promClient);
  }

  public async getData(
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment, rangeStop: moment.Moment,
  ): Promise<{[key in MetricName]: ReadonlyArray<IMetricSerie>}> {

    const queries = metricNames.map(metricName => elasticsearchMetricPropertiesById[metricName].promQL(guid));

    const metricData = await this.getDataFromPrometheus(
      metricNames, queries,
      period, rangeStart, rangeStop,
    );

    return _.mapValues(
      metricData,
      series => this.addPlaceholderData(series, period, rangeStart, rangeStop),
    );
  }
}
