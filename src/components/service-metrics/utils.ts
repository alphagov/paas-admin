import { bisectLeft } from 'd3-array';
import moment, { Moment } from 'moment';

export function getPeriod(rangeStart: Moment, rangeStop: Moment): number {
  const secondsDifference = rangeStop.diff(rangeStart) / 1000;
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

  const threeHoursAgo = moment().subtract(3, 'hours');
  const fifteenDaysAgo = moment().subtract(15, 'days');
  const sixtyThreeDaysAgo = moment().subtract(63, 'days');

  if (threeHoursAgo.isBefore(rangeStart)) {
    const allowedPeriods = [1, 5, 10, 30, 60];
    if (idealPeriod <= 60) {
      return allowedPeriods[bisectLeft(allowedPeriods, idealPeriod)];
    }
    return Math.ceil(idealPeriod / 60) * 60;
  }
  if (fifteenDaysAgo.isBefore(rangeStart)) {
    return Math.ceil(idealPeriod / 60) * 60;
  }
  if (sixtyThreeDaysAgo.isBefore(rangeStart)) {
    return Math.ceil(idealPeriod / 300) * 300;
  }
  return Math.ceil(idealPeriod / 3600) * 3600;
}
