import { bisectLeft } from 'd3-array';

export function getPeriod(secondsDifference: number): number {
  const desiredNumberOfPoints = 300;
  const idealPeriod = secondsDifference / desiredNumberOfPoints;
  const allowedPeriods = [1, 5, 10, 30, 60];

  return idealPeriod > 60 ?
    Math.floor(idealPeriod / 60) * 60 :
    allowedPeriods[bisectLeft(allowedPeriods, idealPeriod)];
}
