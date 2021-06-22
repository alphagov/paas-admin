import { add, sub } from 'date-fns';

import { getPeriod } from './utils';

describe('getPeriod', () => {
  describe('looking at times < 3 hours ago', () => {
    const rangeStart = sub(new Date(), { hours: 2 });
    it('should return one second period when asked for <= 300 seconds', () => {
      expect(getPeriod(rangeStart, rangeStart)).toBe(
        1,
      );
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 299 })),
      ).toBe(1);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 300 })),
      ).toBe(1);
    });

    it('should return five second period when asked for > 300 <= 1500 seconds', () => {
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 301 })),
      ).toBe(5);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 1499 })),
      ).toBe(5);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 1500 })),
      ).toBe(5);
    });

    it('should return ten second period when asked for > 1500 <= 3000 seconds', () => {
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 1501 })),
      ).toBe(10);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 2999 })),
      ).toBe(10);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 3000 })),
      ).toBe(10);
    });

    it('should return 120 second period when asked for > 18000 < 36000 seconds', () => {
      // Note - this is a bit of a weird test, because rangeStart is only two hours ago
      // and we're asking for 5 - 10 hours of data. This situation shouldn't really
      // occur, but it seems reasonable to return a number anyway.
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 18001 })),
      ).toBe(120);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 35999 })),
      ).toBe(120);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 36000 })),
      ).toBe(120);
    });
  });

  describe('looking at times > 3 hours ago < 15 days ago', () => {
    // Start time between 3 hours and 15 days ago - Use a multiple of 60 seconds (1 minute).
    const rangeStart = sub(new Date(), { days: 10 });

    it('should return sixty second period when asked for > 3000 <= 9000 seconds', () => {
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 3001 })),
      ).toBe(60);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 8999 })),
      ).toBe(60);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 9000 })),
      ).toBe(60);
    });

    it('should return sixty second period when asked for > 9000 <= 18000 seconds', () => {
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 9001 })),
      ).toBe(60);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 17999 })),
      ).toBe(60);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 18000 })),
      ).toBe(60);
    });

    it('should return 120 second period when asked for > 18000 < 36000 seconds', () => {
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 18001 })),
      ).toBe(120);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 35999 })),
      ).toBe(120);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 36000 })),
      ).toBe(120);
    });

    it('should return 180 second period when asked for > 36000 < 54000 seconds', () => {
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 36001 })),
      ).toBe(180);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 53999 })),
      ).toBe(180);
      expect(
        getPeriod(rangeStart, add(rangeStart, { seconds: 54000 })),
      ).toBe(180);
    });
  });
  describe('looking at times > 15 days ago < 63 days ago', () => {
    // Start time between 15 and 63 days ago - Use a multiple of 300 seconds (5 minutes).
    const rangeStart = sub(new Date(), { days: 30 });

    it('should return 290 minute period when asked for ~60 day duration', () => {
      expect(
        getPeriod(
          rangeStart,
          add(rangeStart, { seconds: 60 * 24 * 3600 }),
        ),
      ).toBe(290 * 60);
      expect(
        getPeriod(
          rangeStart,
          add(rangeStart, { seconds: 60 * 24 * 3600 + 100 }),
        ),
      ).toBe(290 * 60);
      expect(
        getPeriod(
          rangeStart,
          add(rangeStart, { seconds: 60 * 24 * 3600 - 100 }),
        ),
      ).toBe(290 * 60);
    });
  });

  describe('looking at times > 63 days ago', () => {
    // Start time greater than 63 days ago - Use a multiple of 3600 seconds (1 hour).
    const rangeStart = sub(new Date(), { days: 100 });
    const oneYearInSeconds = 365 * 24 * 60 * 60;

    it('should return 30 hour period when asked for one year', () => {
      expect(
        getPeriod(
          rangeStart,
          add(rangeStart, { seconds: oneYearInSeconds }),
        ),
      ).toBe(30 * 3600);
    });
  });
});
