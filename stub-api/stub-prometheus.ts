import express from 'express';
import lodash from 'lodash';
import moment from 'moment';

import {IStubServerPorts} from './index';

function mockPrometheus(
  app: express.Application,
  _config: IStubServerPorts,
): express.Application {

  app.get(
    /query_range/,
    (req, res) => {
      const historicTime = parseInt(req.query.start, 10);
      const instantTime = parseInt(req.query.end, 10);
      const step = parseInt(req.query.step, 10);

      const length = Math.ceil(((instantTime - historicTime)) / step);

      const response = {
        status: 'success',
        data: {
          result : [{
            values: lodash
              .range(0, length, 1)
                .map(i => {
                  return [
                    moment(historicTime * 1000)
                      .add(step * i, 'seconds')
                      .toDate().getTime() / 1000
                    ,
                    `${Math.random() * 100}`,
                  ];
                })
            ,
          }],
        },
      };

      res.send(JSON.stringify(response));
    },
  );

  app.get(
    /query/,
    (_req, res) => {
      res.send(JSON.stringify({
        status: 'success',
        data: {
          result: [{
            value: [
              moment().toDate().getTime() / 1000, `${Math.random() * 100}`,
            ],
          }],
        },
      }));
    },
  );

  return app;
}

export default mockPrometheus;
