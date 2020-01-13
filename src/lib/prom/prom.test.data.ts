/* tslint:disable:insecure-random */

import _ from 'lodash';

import { getGappyRandomData } from '../metrics';

export function getStubPrometheusMetricsSeriesData(
  instances: ReadonlyArray<string>,
): string {
  return JSON.stringify({
    status: 'success',
    data: {
      resultType: 'series',
      result: instances.map(instance => {
        const { timestamps, values } = getGappyRandomData();
        return {
          metric: { instance },
          values: _.zip(timestamps, values),
        };
      }),
    },
  });
}
