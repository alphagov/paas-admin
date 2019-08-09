import express from 'express';
import lodash from 'lodash';
import moment from 'moment';

import {IStubServerPorts} from './index';

const queryResponse = {
  status: 'success',
  data: {
    result: [{
      value: [moment().toDate().getTime() / 1000, `${Math.random() * 100}`],
    }],
  },
};

const queryRangeResponse = {
  status: 'success',
  data: {
    result : [{
      values: lodash
                .range(0, 300, 1)
                .map(i => [
                  moment()
                    .subtract(15 * i, 'seconds')
                    .toDate().getTime() / 1000,
                  `${Math.random() * 100}`,
                ])
              ,
    }],
  },
};

function mockPrometheus(
  app: express.Application,
  _config: IStubServerPorts,
): express.Application {

  app.get(
    /query_range/,
    (_req, res) => res.send(JSON.stringify(queryRangeResponse)),
  );

  app.get(
    /query/,
    (_req, res) => res.send(JSON.stringify(queryResponse)),
  );

  return app;
}

export default mockPrometheus;
