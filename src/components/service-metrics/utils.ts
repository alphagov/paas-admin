import { bisectLeft } from 'd3-array';
import { differenceInSeconds, isBefore, sub } from 'date-fns';

export function getPeriod(rangeStart: Date, rangeStop: Date): number {
  const secondsDifference = differenceInSeconds(rangeStop, rangeStart);
  const desiredNumberOfPoints = 300;
  const idealPeriod = secondsDifference / desiredNumberOfPoints;

  // https://docs.aws.amazon.com/AmazonCloudWatch/latest/APIReference/API_MetricStat.html

  // The granularity, in seconds, of the returned data points. For metrics with
  // regular resolution, a period can be as short as one minute (60 seconds) and
  // must be a multiple of 60. For high-resolution metrics that are collected at
  // intervals of less than one minute, the period can be 1, 5, 10, 30, 60, or
  // any multiple of 60. High-resolution metrics are those metrics stored by a
  // PutMetricData call that includes a StorageResolution of 1 second.
  //
  //  If the StartTime parameter specifies a time stamp that is greater than 3
  //  hours ago, you must specify the period as follows or no data points in that
  //  time range is returned:
  //
  //      Start time between 3 hours and 15 days ago - Use a multiple of 60 seconds (1 minute).
  //      Start time between 15 and 63 days ago - Use a multiple of 300 seconds (5 minutes).
  //      Start time greater than 63 days ago - Use a multiple of 3600 seconds (1 hour).

  const threeHoursAgo = sub(new Date(), { hours: 3 });
  const fifteenDaysAgo = sub(new Date(), { days: 15 });
  const sixtyThreeDaysAgo = sub(new Date(), { days: 63 });

  if (isBefore(threeHoursAgo, rangeStart)) {
    const allowedPeriods = [1, 5, 10, 30, 60];
    if (idealPeriod <= 60) {
      return allowedPeriods[bisectLeft(allowedPeriods, idealPeriod)];
    }

    return Math.ceil(idealPeriod / 60) * 60;
  }
  if (isBefore(fifteenDaysAgo, rangeStart)) {
    return Math.ceil(idealPeriod / 60) * 60;
  }
  if (isBefore(sixtyThreeDaysAgo, rangeStart)) {
    return Math.ceil(idealPeriod / 300) * 300;
  }

  return Math.ceil(idealPeriod / 3600) * 3600;
}
