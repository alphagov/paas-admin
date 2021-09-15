import { GetResourcesCommand } from '@aws-sdk/client-resource-groups-tagging-api';

import { CloudFrontMetricDataGetter } from './cloudfront';

const isMock = (received: any) =>
  received != null && received._isMockFunction === true;

expect.extend({
  toBeCalledWithStringified: (received: jest.Mock, ...expected: any): jest.CustomMatcherResult => {
    if (!isMock(received)) {
      throw new Error('`toBeCalledWithStringified(received)` value needs to be mock');
    }

    const call = JSON.stringify(received.mock.calls[0]);
    const expectation = JSON.stringify(expected);

    const pass = expectation === call;

    return {
      message: () => {
        return `${pass
            ? 'The expected call input matches the received input.'
            : 'The purest stringified arguments of the mocked and expected function are not the same.'
          }\n\n` +
          `Expected: ${expectation}\n` +
          `Received: ${call}`;
      },
      pass,
    };
  },
});

describe('Cloudfront', () => {
  describe('getCloudFrontDistributionId', () => {
    it('should fetch and transform the identifier correctly', async () => {
      const send = jest.fn();

      send.mockReturnValue(
        Promise.resolve({
          ResourceTagMappingList: [
            {
              ResourceARN:
                'arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5',
            },
          ],
        }),
      );

      const dg = new CloudFrontMetricDataGetter(
        /* CloudWatch Client is unused */ {} as any,
        { send } as any,
      );

      const distributionId = await dg.getCloudFrontDistributionId(
        'a-service-guid',
      );

      expect(send).toBeCalledWithStringified(
        new GetResourcesCommand({
          ResourceTypeFilters: ['cloudfront:distribution'],
          TagFilters: [
            {
              Key: 'ServiceInstance',
              Values: ['a-service-guid'],
            },
          ],
        }),
      );

      expect(distributionId).toEqual('EDFDVBD632BHDS5');
    });

    it('should error when no useful response is returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({}));

      const dg = new CloudFrontMetricDataGetter(
        /* CloudWatch Client is unused */ {} as any,
        { send } as any,
      );

      await expect(
        dg.getCloudFrontDistributionId('a-service-guid'),
      ).rejects.toThrow(/Could not get tags for CloudFront distribution/);

      expect(send).toBeCalledWithStringified(
        new GetResourcesCommand({
          ResourceTypeFilters: ['cloudfront:distribution'],
          TagFilters: [
            {
              Key: 'ServiceInstance',
              Values: ['a-service-guid'],
            },
          ],
        }),
      );
    });

    it('should error when no distributions are returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({ ResourceTagMappingList: [] }));

      const dg = new CloudFrontMetricDataGetter(
        /* CloudWatch Client is unused */ {} as any,
        { send } as any,
      );

      await expect(
        dg.getCloudFrontDistributionId('a-service-guid'),
      ).rejects.toThrow(/Could not get tags for CloudFront distribution/);

      expect(send).toBeCalledWithStringified(
        new GetResourcesCommand({
          ResourceTypeFilters: ['cloudfront:distribution'],
          TagFilters: [
            {
              Key: 'ServiceInstance',
              Values: ['a-service-guid'],
            },
          ],
        }),
      );
    });

    it('should error when no arn is returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(Promise.resolve({ ResourceTagMappingList: [{}] }));

      const dg = new CloudFrontMetricDataGetter(
        /* CloudWatch Client is unused */ {} as any,
        { send } as any,
      );

      await expect(
        dg.getCloudFrontDistributionId('a-service-guid'),
      ).rejects.toThrow(/Could not get ARN for CloudFront distribution/);

      expect(send).toBeCalledWithStringified(
        new GetResourcesCommand({
          ResourceTypeFilters: ['cloudfront:distribution'],
          TagFilters: [
            {
              Key: 'ServiceInstance',
              Values: ['a-service-guid'],
            },
          ],
        }),
      );
    });

    it('should error when a malformed arn is returned', async () => {
      const send = jest.fn();

      send.mockReturnValue(
        Promise.resolve({
          ResourceTagMappingList: [
            {
              ResourceARN: 'arn:aws:cloudfront::123456789012:distribution',
            },
          ],
        }),
      );

      const dg = new CloudFrontMetricDataGetter(
        /* CloudWatch Client is unused */ {} as any,
        { send } as any,
      );

      await expect(
        dg.getCloudFrontDistributionId('a-service-guid'),
      ).rejects.toThrow(/Malformed ARN/);

      expect(send).toBeCalledWithStringified(
        new GetResourcesCommand({
          ResourceTypeFilters: ['cloudfront:distribution'],
          TagFilters: [
            {
              Key: 'ServiceInstance',
              Values: ['a-service-guid'],
            },
          ],
        }),
      );
    });
  });
});
