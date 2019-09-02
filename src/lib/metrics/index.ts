export const timeOffsets: {readonly [key: string]: number} = {
  'last-15-minutes': 15 * 60,
  'last-1-hour': 60 * 60,
  'last-4-hours': 4 * 60 * 60,
  'last-12-hours': 12 * 60 * 60,
  'last-24-hours': 24 * 60 * 60,
  'last-2-days': 2 * 24 * 60 * 60,
  'last-7-days': 7 * 24 * 60 * 60,
};

export const prometheusTimeInterval = (intervalMillis: number): string => {
  const intervalSeconds = parseInt((intervalMillis / 1000).toFixed(0), 10);

  const oneMinute = 60;
  const oneHour = 60 * oneMinute;
  const twentyFourHours = 24 * oneHour;

  if (intervalSeconds < oneMinute) {
    throw new Error('Out of bounds: interval too short');
  }

  if (intervalSeconds > twentyFourHours) {
    throw new Error('Out of bounds: interval too long');
  }

  if (intervalSeconds < oneHour) {
    return `${ (intervalSeconds / oneMinute).toFixed(0) }m`;
  }

  return `${ (intervalSeconds / oneHour).toFixed(0) }h`;
};
