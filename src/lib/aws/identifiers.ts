import {
  GetResourcesCommand,
  GetResourcesOutput,
  ResourceGroupsTaggingAPIClient,
} from '@aws-sdk/client-resource-groups-tagging-api-node';

import base32Encode from 'base32-encode';
import fnv from 'fnv-plus';

export function getRdsDbInstanceIdentifier(serviceInstanceGUID: string): string {
  return `rdsbroker-${serviceInstanceGUID}`;
}

export function getElasticacheReplicationGroupId(serviceInstanceGUID: string): string {
  const hashHexString = fnv.hash(serviceInstanceGUID, 64).hex();
  const hashBuffer = Buffer.from(hashHexString, 'hex');
  const hashBase32String = base32Encode(hashBuffer, 'RFC4648', {padding: false});
  return `cf-${hashBase32String.toLowerCase()}`;
}

export async function getCloudFrontDistributionId(
  rg: ResourceGroupsTaggingAPIClient,
  serviceGUID: string,
): Promise<string> {
  const arn = await (
    rg
      .send(
        new GetResourcesCommand({TagFilters: [{
          Key: 'ServiceInstance',
          Values: [serviceGUID],
        }]}),
      )
      .then((d: GetResourcesOutput) => {
        if (typeof d.ResourceTagMappingList === 'undefined' || d.ResourceTagMappingList.length === 0) {
          throw new Error(`Could not get tags for CloudFront distribution ${serviceGUID}`);
        }
        return d.ResourceTagMappingList[0].ResourceARN;
      })
  );

  if (typeof arn === 'undefined') {
    throw new Error(`Could not get ARN for CloudFront distribution ${serviceGUID}`);
  }

  const distributionIdMatches = arn.match(/(?!\/)[A-Z0-9]+$/);

  if (distributionIdMatches === null) {
    throw new Error(`Malformed ARN ${arn} for CloudFront distribution ${serviceGUID}`);
  }

  return distributionIdMatches[0];
}
