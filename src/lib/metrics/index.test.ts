import {prometheusTimeInterval} from '.';

describe('prometheusTimeInterval', () => {
  it('should fail when given a negative interval', () => {
    expect(() => {
      prometheusTimeInterval(-1);
    }).toThrow(/Out of bounds: interval too short/);
  });

  it('should fail when given an interval less than a minute', () => {
    expect(() => {
      prometheusTimeInterval(59 * 1000);
    }).toThrow(/Out of bounds: interval too short/);
  });

  it('should fail when given an interval greater than 24 hours', () => {
    expect(() => {
      prometheusTimeInterval(25 * 60 * 60 * 1000);
    }).toThrow(/Out of bounds: interval too long/);
  });

  it.each([
    ['1m',  61 * 1000],
    ['5m',  5 * 61 * 1000],
    ['59m', 59 * 60 * 1000],

    ['1h',  60 * 61 * 1000],
    ['5h',  5 * 60 * 61 * 1000],
    ['24h', 24 * 60 * 60 * 1000],
  ])('should return %s when given %sms', (exp, inp) => {
    expect(() => prometheusTimeInterval(inp as number)).not.toThrow();

    expect(prometheusTimeInterval(inp as number)).toEqual(exp as string);
  });
});
