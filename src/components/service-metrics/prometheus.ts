import {map as mapObject} from 'lodash';
import moment from 'moment';

import PromClient from '../../lib/prom';

interface IMetric {
  date: Date;
  value: number;
}

interface IMetricSeries {
  metrics: ReadonlyArray<IMetric>;
  label: string;
}

interface IMetricProperties {
  format: string;
  units: 'Bytes' | 'Percent' | 'Number';
  title: string;
}

interface IMetricGraphData extends IMetricProperties {
  id: string;
  seriesArray: ReadonlyArray<IMetricSeries>;
}

type ServiceType = 'elasticsearch';

export interface IMetricGraphDataResponse {
  readonly graphs: ReadonlyArray<IMetricGraphData>;
  readonly serviceType: ServiceType;
}

interface IMetricPropertiesMap extends IMetricProperties {
  query: string;
}

interface IMetricPropertiesByID {
  readonly [key: string]: IMetricPropertiesMap;
}

function elasticsearchMetricPropertiesByID(guid: string): IMetricPropertiesByID {
  // see https://github.com/justwatchcom/elasticsearch_exporter for more metrics
  return {
    mDiskTotal: {
      query: `disk_total{service=~".*-${guid}"}`,
      format: '.2s',
      units: 'Bytes',
      title: 'available space on device in bytes',
    },
    mCPULoad: {
      query: `avg by (instance) (system_load1{service=~".*-${guid}"})`,
      format: '.2r',
      units: 'Percent',
      title: 'percent cpu used by process',
    },
    mDiskUsedBytes: {
      query: `avg by (instance) (disk_used_percent{service=~".*-${guid}"})`,
      format: '.2s',
      units: 'Bytes',
      title: 'free space on device in bytes',
    },
    mDiskReads: {
      query: `avg by (instance) (rate(diskio_reads{service=~".*-${guid}"}[5m]))`,
      format: '.2r',
      units: 'Number',
      title: 'count of disk read operations',
    },
    mDiskWrites: {
      query: `avg by (instance) (rate(diskio_writes{service=~".*-${guid}"}[5m]))`,
      format: '.2r',
      units: 'Number',
      title: 'count of disk write operations',
    },
    mMemoryUsed: {
      query: `avg by (instance) (mem_used_percent{service=~".*-${guid}"})`,
      format: '.2r',
      units: 'Percent',
      title: 'memory in use in percentage',
    },
    mNetworkIn: {
      query: `avg by (instance) (rate(net_bytes_recv{service=~".*-${guid}"}[5m]))`,
      format: '.2s',
      units: 'Bytes',
      title: 'resident memory in use by process in bytes',
    },
    mNetworkOut: {
      query: `avg by (instance) (rate(net_bytes_sent{service=~".*-${guid}"}[5m]))`,
      format: '.2s',
      units: 'Bytes',
      title: 'resident memory in use by process in bytes',
    },
  };
}

export async function getPrometheusMetricGraphData(
  client: PromClient,
  service: string, guid: string,
  period: moment.Duration, rangeStart: moment.Moment, rangeStop: moment.Moment,
): Promise<IMetricGraphDataResponse | null> {
  switch (service) {
    case 'elasticsearch':
      const graphs = await Promise.all(mapObject(elasticsearchMetricPropertiesByID(guid), async (current, id) => {
        const seriesArray = await client.getSeries(
          current.query, period.asSeconds(), rangeStart.toDate(), rangeStop.toDate(),
        );

        if (!seriesArray) {
          return null;
        }

        return {...current, id, seriesArray};
      }));

      return {
        serviceType: 'elasticsearch',
        graphs: graphs.filter(g => g !== null) as ReadonlyArray<IMetricGraphData>,
      };
    default:
      return null;
  }
}
