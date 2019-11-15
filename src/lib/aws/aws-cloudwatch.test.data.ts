/* tslint:disable:insecure-random */

import moment from 'moment';
import roundDown from '../../lib/moment/round';

interface IServiceIdAndLabel {
  readonly id: string;
  readonly label: string;
}

export function getStubCloudwatchMetricsData(
    metricSeriesLabelsAndIds: ReadonlyArray<IServiceIdAndLabel>,
  ): string {
  // Creates a response with one days worth of data (with some gaps to test the charts can handle that)
  // Something like:
  //
  //     +                                                                               X
  //     |                                                                               X
  //     |                        X                                                     X
  //     |                       XX                                                    X
  //     |                       X X                                                   X
  //     |                                                                             X
  //     |                          X                                                 X
  //     |                     X    X                                                 X
  //     |                           X      X                                        X
  //     |                                  XX         X                            X
  //     |                           X       X        XXX                           X
  //     |                  X        X      XX       XX X  XX                      X
  //     |                           X        X     X   XXXXXX                    X
  //     |                 X          X     X  X   XX    XX   XX
  //     |                            X         X  X                             X
  //     |                X           XX    X    XX                              X
  //     |                X            XX   X
  //     |                              XX XX
  //     |                               X X
  //     |                               XXX
  //     +----------------------------------------------------------------------------------+
  //

  const members = metricSeriesLabelsAndIds.map(({label, id}) => {
    const {timestamps, values} = getGappyRandomData();
    return `<member>
      <Timestamps>
        ${timestamps.map(t => `<member>${t}</member>`).join('\n')}
      </Timestamps>
      <Values>
        ${values.map(v => `<member>${v}</member>`).join('\n')}
      </Values>
      <Label>${label}</Label>
      <Id>${id}</Id>
      <StatusCode>Complete</StatusCode>
    </member>`;
  }).join('\n');

  return `<GetMetricDataResponse xmlns="http://monitoring.amazonaws.com/doc/2010-08-01/">
    <GetMetricDataResult>
      <MetricDataResults>
        ${members}
      </MetricDataResults>
      <Messages/>
    </GetMetricDataResult>
    <ResponseMetadata>
      <RequestId>ff5e1b9b-675d-44e3-9909-13d0d9d83648</RequestId>
    </ResponseMetadata>
  </GetMetricDataResponse>`;
}

/* istanbul ignore next */
function getGappyRandomData(): {readonly timestamps: ReadonlyArray<string>, readonly values: ReadonlyArray<number>} {
  const minutesInADay = 24 * 60;
  const timestamps: string[] = [];
  const values: number[] = [];

  const startTime = roundDown(moment().subtract(1, 'day'), moment.duration(5, 'minutes'));
  for (let i = 0; i < minutesInADay; i += 5) {
    if (i < minutesInADay * 0.2 || i > minutesInADay * 0.8 && i < minutesInADay * 0.9) {
      // do nothing - empty piece of the graph
    } else {
      timestamps.push(startTime.clone().add(i, 'minutes').toISOString());
      let value = 0;
      if (values.length === 0) {
        value = Math.random() * 105;
      } else {
        value = values[values.length - 1] + 10 * (Math.random() - 0.5);
        value = value > 0 ? value : 0;
      }
      values.push(value);
    }
  }
  return { timestamps, values };
}
