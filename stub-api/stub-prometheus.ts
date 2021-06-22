import { add, fromUnixTime } from 'date-fns';
import express from 'express';
import lodash from 'lodash';

import { IStubServerPorts } from './index';

function mockPrometheus(
  app: express.Application,
  _config: IStubServerPorts,
): express.Application {

  app.get(
    /query_range/,
    (req, res) => {
      console.log(req.query.start);
      const historicTime = parseInt(req.query.start as string, 10);
      const instantTime = parseInt(req.query.end as string, 10);
      const step = parseInt(req.query.step as string, 10);

      const length = Math.ceil(((instantTime - historicTime)) / step);

      const response = {
        data: {
          result : [{
            values: lodash
              .range(0, length, 1)
                .map(i => {
                  return [
                    add(fromUnixTime(historicTime * 1000), { seconds: step * i }).getTime() / 1000,
                    `${Math.random() * 100}`,
                  ];
                })
            ,
          }],
        },
        status: 'success',
      };

      res.send(JSON.stringify(response));
    },
  );

  app.get(
    /query/,
    (_req, res) => {
      res.send(JSON.stringify({
        data: {
          result: [{
            value: [
              (new Date()).getTime() / 1000, `${Math.random() * 100}`,
            ],
          }],
        },
        status: 'success',
      }));
    },
  );

  return app;
}

export default mockPrometheus;
