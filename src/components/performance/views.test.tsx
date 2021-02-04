import { latestValue } from './views';

describe(latestValue, () => {
  it('should resolve to the latest value', () => {
    expect(latestValue({ label: 'test', metrics: [] })).toEqual(0);
    expect(latestValue({ label: 'test', metrics: [ { date: new Date(), value: 1 } ] })).toEqual(1);
    expect(latestValue({ label: 'test', metrics: [
      { date: new Date(), value: 3 },
      { date: new Date(), value: 2 },
    ] })).toEqual(2);
    expect(latestValue({ label: 'test', metrics: [
      { date: new Date(), value: 2 },
      { date: new Date(), value: 'NaN' as any as number },
      { date: new Date(), value: 1 },
    ] })).toEqual(1);
  });
});
