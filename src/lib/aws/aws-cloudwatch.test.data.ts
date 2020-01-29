import { getGappyRandomData } from '../metrics';

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

  const members = metricSeriesLabelsAndIds
    .map(({ label, id }) => {
      const { timestamps, values } = getGappyRandomData();

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
    })
    .join('\n');

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
