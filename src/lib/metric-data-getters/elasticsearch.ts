import _ from 'lodash';
import moment from 'moment';

import {
  IMetricDataGetter,
  IMetricSerie,
  MetricName,
} from '../metrics';

const elasticsearchMetricPropertiesById: {[key in MetricName]: any} = {
  'diskIO': {},
};

export const elasticsearchMetricNames = Object.keys(elasticsearchMetricPropertiesById);

export class ElasticsearchMetricDataGetter implements IMetricDataGetter {
  constructor() {
    // no-empty-block;
  }

  public async getData(
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment, rangeStop: moment.Moment,
  ): Promise<{[key in MetricName]: ReadonlyArray<IMetricSerie>}> {
    return Promise.resolve({});
  }
}
