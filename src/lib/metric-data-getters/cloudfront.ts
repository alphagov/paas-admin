import * as cw from '@aws-sdk/client-cloudwatch';
import * as rg from '@aws-sdk/client-resource-groups-tagging-api';
import { Duration, milliseconds, millisecondsToSeconds } from 'date-fns';
import _ from 'lodash';


import { IMetricDataGetter, IMetricSerie, MetricName } from '../metrics';

import { CloudWatchMetricDataGetter, ICloudWatchMetric } from './cloudwatch';

const cloudfrontMetricPropertiesById: {
  [key in MetricName]: ICloudWatchMetric;
} = {
  mRequests: {
    name: 'Requests',
    stat: 'Sum',
  },
  mBytesUploaded: {
    name: 'BytesUploaded',
    stat: 'Sum',
  },
  mBytesDownloaded: {
    name: 'BytesDownloaded',
    stat: 'Sum',
  },

  m4xxErrorRate: {
    name: '4xxErrorRate',
    stat: 'Average',
  },
  m5xxErrorRate: {
    name: '5xxErrorRate',
    stat: 'Average',
  },
  mTotalErrorRate: {
    name: 'TotalErrorRate',
    stat: 'Average',
  },
};

export const cloudfrontMetricNames = Object.keys(
  cloudfrontMetricPropertiesById,
);

export class CloudFrontMetricDataGetter extends CloudWatchMetricDataGetter
  implements IMetricDataGetter {
  constructor(
    private readonly cloudwatchClient: cw.CloudWatchClient,
    private readonly resourceGroupsTaggingAPIClient: rg.ResourceGroupsTaggingAPIClient,
  ) {
    super();
  }

  public async getCloudFrontDistributionId(
    serviceGUID: string,
  ): Promise<string> {
    const arn = await this.resourceGroupsTaggingAPIClient
      .send(
        new rg.GetResourcesCommand({
          TagFilters: [
            {
              Key: 'ServiceInstance',
              Values: [serviceGUID],
            },
          ],
          ResourceTypeFilters: [
            'cloudfront:distribution',
          ],
        }),
      )
      .then((d: rg.GetResourcesOutput) => {
        if (
          typeof d.ResourceTagMappingList === 'undefined' ||
          d.ResourceTagMappingList.length === 0
        ) {
          throw new Error(
            `Could not get tags for CloudFront distribution ${serviceGUID}`,
          );
        }

        return d.ResourceTagMappingList[0].ResourceARN;
      });

    if (typeof arn === 'undefined') {
      throw new Error(
        `Could not get ARN for CloudFront distribution ${serviceGUID}`,
      );
    }

    const distributionIdMatches = arn.match(/(?!\/)[A-Z0-9]+$/);

    if (distributionIdMatches === null) {
      throw new Error(
        `Malformed ARN ${arn} for CloudFront distribution ${serviceGUID}`,
      );
    }

    return distributionIdMatches[0];
  }

  public async getData(
    metricNames: ReadonlyArray<MetricName>,
    guid: string,
    period: Duration,
    rangeStart: Date,
    rangeStop: Date,
  ): Promise<{ [key in MetricName]: ReadonlyArray<IMetricSerie> }> {
    const distributionId = await this.getCloudFrontDistributionId(guid);

    const metricDataInputs = [
      {
        MetricDataQueries: metricNames.map(metricId => ({
          Id: metricId,
          MetricStat: {
            Metric: {
              Dimensions: [
                { Name: 'DistributionId', Value: distributionId },
                { Name: 'Region', Value: 'Global' },
              ],
              MetricName: cloudfrontMetricPropertiesById[metricId].name,
              Namespace: 'AWS/CloudFront',
            },
            Period: millisecondsToSeconds(milliseconds(period)),
            Stat: cloudfrontMetricPropertiesById[metricId].stat,
          },
        })),
        StartTime: rangeStart,
        EndTime: rangeStop,
      },
    ];

    const responses = await Promise.all(
      metricDataInputs.map(async input =>
        await this.cloudwatchClient.send(new cw.GetMetricDataCommand(input)),
      ),
    );

    const results = _.flatMap(
      responses,
      response => response.MetricDataResults!,
    );

    return Promise.resolve(
      this.addPlaceholderData(results, period, rangeStart, rangeStop),
    );
  }
}
