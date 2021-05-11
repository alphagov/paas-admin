import * as cw from '@aws-sdk/client-cloudwatch-node'
import * as rg from '@aws-sdk/client-resource-groups-tagging-api-node'
import _ from 'lodash'
import moment from 'moment'

import { IMetricDataGetter, IMetricSerie, MetricName } from '../metrics'

import { CloudWatchMetricDataGetter, ICloudWatchMetric } from './cloudwatch'

const cloudfrontMetricPropertiesById: {
  [key in MetricName]: ICloudWatchMetric;
} = {
  mRequests: {
    name: 'Requests',
    stat: 'Sum'
  },
  mBytesUploaded: {
    name: 'BytesUploaded',
    stat: 'Sum'
  },
  mBytesDownloaded: {
    name: 'BytesDownloaded',
    stat: 'Sum'
  },

  m4xxErrorRate: {
    name: '4xxErrorRate',
    stat: 'Average'
  },
  m5xxErrorRate: {
    name: '5xxErrorRate',
    stat: 'Average'
  },
  mTotalErrorRate: {
    name: 'TotalErrorRate',
    stat: 'Average'
  }
}

export const cloudfrontMetricNames = Object.keys(
  cloudfrontMetricPropertiesById
)

export class CloudFrontMetricDataGetter extends CloudWatchMetricDataGetter
  implements IMetricDataGetter {
  constructor (
    private readonly cloudwatchClient: cw.CloudWatchClient,
    private readonly resourceGroupsTaggingAPIClient: rg.ResourceGroupsTaggingAPIClient
  ) {
    super()
  }

  public async getCloudFrontDistributionId (
    serviceGUID: string
  ): Promise<string> {
    const arn = await this.resourceGroupsTaggingAPIClient
      .send(
        new rg.GetResourcesCommand({
          TagFilters: [
            {
              Key: 'ServiceInstance',
              Values: [serviceGUID]
            }
          ],
          ResourceTypeFilters: [
            'cloudfront:distribution'
          ]
        })
      )
      .then((d: rg.GetResourcesOutput) => {
        if (
          typeof d.ResourceTagMappingList === 'undefined' ||
          d.ResourceTagMappingList.length === 0
        ) {
          throw new Error(
            `Could not get tags for CloudFront distribution ${serviceGUID}`
          )
        }

        return d.ResourceTagMappingList[0].ResourceARN
      })

    if (typeof arn === 'undefined') {
      throw new Error(
        `Could not get ARN for CloudFront distribution ${serviceGUID}`
      )
    }

    const distributionIdMatches = arn.match(/(?!\/)[A-Z0-9]+$/)

    if (distributionIdMatches === null) {
      throw new Error(
        `Malformed ARN ${arn} for CloudFront distribution ${serviceGUID}`
      )
    }

    return distributionIdMatches[0]
  }

  public async getData (
    metricNames: readonly MetricName[],
    guid: string,
    period: moment.Duration,
    rangeStart: moment.Moment,
    rangeStop: moment.Moment
  ): Promise<{ [key in MetricName]: readonly IMetricSerie[] }> {
    const distributionId = await this.getCloudFrontDistributionId(guid)

    const metricDataInputs = [
      {
        MetricDataQueries: metricNames.map(metricId => ({
          Id: metricId,
          MetricStat: {
            Metric: {
              Dimensions: [
                { Name: 'DistributionId', Value: distributionId },
                { Name: 'Region', Value: 'Global' }
              ],
              MetricName: cloudfrontMetricPropertiesById[metricId].name,
              Namespace: 'AWS/CloudFront'
            },
            Period: period.asSeconds(),
            Stat: cloudfrontMetricPropertiesById[metricId].stat
          }
        })),
        StartTime: rangeStart.toDate(),
        EndTime: rangeStop.toDate()
      }
    ]

    const responses = await Promise.all(
      metricDataInputs.map(async input =>
        await this.cloudwatchClient.send(new cw.GetMetricDataCommand(input))
      )
    )

    const results = _.flatMap(
      responses,
      response => response.MetricDataResults!
    )

    return Promise.resolve(
      this.addPlaceholderData(results, period, rangeStart, rangeStop)
    )
  }
}
