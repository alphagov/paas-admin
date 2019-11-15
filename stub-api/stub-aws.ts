import express from 'express';
import bodyParser from 'body-parser';
import { IStubServerPorts } from './index';
import { getStubCloudwatchMetricsData } from '../src/lib/aws/aws-cloudwatch.test.data';
import _ from 'lodash';

const red = '\x1b[31m';
const cyan = '\x1b[36m';
const reset = '\x1b[0m';

const cyanStubName = `${cyan}stub-aws-api${reset}`;
const redStubName = `${red}stub-aws-api${reset}`;

export default function mockAWS(app: express.Application, config: IStubServerPorts): express.Application {
  app.use(bodyParser.urlencoded());

  app.post('/', (req, res) =>  {
    const action = req.body.Action;
    console.log(`${cyanStubName} Action = ${action}`);
    switch(action) {
      case 'GetMetricData':
        const seriesIds = Object.keys(req.body)
          .filter(key => /^MetricDataQueries\.member\.\d+\.Id$/.test(key))
          .map(key => req.body[key]);

        res.send(getStubCloudwatchMetricsData(
          // Create two series for each ID to simulate a service with multiple instances
          _.flatMap(seriesIds, id => [
            {id, label: 'instance-001'},
            {id, label: 'instance-002'},
          ]),
        ));
        return;
      default:
        console.log(`${redStubName} ${action} is not implemented`)
        res.end('{}');
        return;
    }
  });

  return app;
}
