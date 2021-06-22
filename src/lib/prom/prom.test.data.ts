import _ from 'lodash';

import { getGappyRandomData } from '../metrics';

export function getStubPrometheusMetricsSeriesData(
  instances: ReadonlyArray<string>,
): string {
  return JSON.stringify({
    data: {
      result: instances.map(instance => {
        const { timestamps, values } = getGappyRandomData();

        return {
          metric: { instance },
          values: _.zip(timestamps, values),
        };
      }),
      resultType: 'series',
    },
    status: 'success',
  });
}
