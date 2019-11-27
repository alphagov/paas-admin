import {getPeriod} from './utils';

describe('getPeriod', () => {

  it('should return one second period when asked for <= 300 seconds', () => {
    expect(getPeriod(0)).toBe(1);
    expect(getPeriod(299)).toBe(1);
    expect(getPeriod(300)).toBe(1);
  });

  it('should return five second period when asked for > 300 <= 1500 seconds', () => {
    expect(getPeriod(301)).toBe(5);
    expect(getPeriod(1499)).toBe(5);
    expect(getPeriod(1500)).toBe(5);
  });

  it('should return ten second period when asked for > 1500 <= 3000 seconds', () => {
    expect(getPeriod(1501)).toBe(10);
    expect(getPeriod(2999)).toBe(10);
    expect(getPeriod(3000)).toBe(10);
  });

  it('should return thirty second period when asked for > 3000 <= 9000 seconds', () => {
    expect(getPeriod(3001)).toBe(30);
    expect(getPeriod(8999)).toBe(30);
    expect(getPeriod(9000)).toBe(30);
  });

  it('should return thirty second period when asked for > 9000 <= 18000 seconds', () => {
    expect(getPeriod(9001)).toBe(60);
    expect(getPeriod(17999)).toBe(60);
    expect(getPeriod(18000)).toBe(60);
  });

  it('should return sixty second period when asked for > 18000 < 36000 seconds', () => {
    expect(getPeriod(18001)).toBe(60);
    expect(getPeriod(35999)).toBe(60);
    expect(getPeriod(36000)).toBe(120);
  });

  it('should return 120 second period when asked for > 36000 < 54000 seconds', () => {
    expect(getPeriod(36001)).toBe(120);
    expect(getPeriod(53999)).toBe(120);
    expect(getPeriod(54000)).toBe(180);
  });

  const oneYearInSeconds = 365 * 24 * 60 * 60;
  it(`should return ~= 1 day period when asked for one year`, () => {
    expect(getPeriod(oneYearInSeconds)).toBe(105120); // 29.2 hours, so ~= 1 day
  });
});
