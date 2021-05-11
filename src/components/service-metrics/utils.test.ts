import moment from 'moment'

import { getPeriod } from './utils'

describe('getPeriod', () => {
  describe('looking at times < 3 hours ago', () => {
    const rangeStart = moment().subtract(2, 'hours')
    it('should return one second period when asked for <= 300 seconds', () => {
      expect(getPeriod(rangeStart, rangeStart.clone().add(0, 'seconds'))).toBe(
        1
      )
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(299, 'seconds'))
      ).toBe(1)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(300, 'seconds'))
      ).toBe(1)
    })

    it('should return five second period when asked for > 300 <= 1500 seconds', () => {
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(301, 'seconds'))
      ).toBe(5)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(1499, 'seconds'))
      ).toBe(5)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(1500, 'seconds'))
      ).toBe(5)
    })

    it('should return ten second period when asked for > 1500 <= 3000 seconds', () => {
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(1501, 'seconds'))
      ).toBe(10)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(2999, 'seconds'))
      ).toBe(10)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(3000, 'seconds'))
      ).toBe(10)
    })

    it('should return 120 second period when asked for > 18000 < 36000 seconds', () => {
      // Note - this is a bit of a weird test, because rangeStart is only two hours ago
      // and we're asking for 5 - 10 hours of data. This situation shouldn't really
      // occur, but it seems reasonable to return a number anyway.
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(18001, 'seconds'))
      ).toBe(120)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(35999, 'seconds'))
      ).toBe(120)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(36000, 'seconds'))
      ).toBe(120)
    })
  })

  describe('looking at times > 3 hours ago < 15 days ago', () => {
    // Start time between 3 hours and 15 days ago - Use a multiple of 60 seconds (1 minute).
    const rangeStart = moment().subtract(10, 'days')

    it('should return sixty second period when asked for > 3000 <= 9000 seconds', () => {
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(3001, 'seconds'))
      ).toBe(60)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(8999, 'seconds'))
      ).toBe(60)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(9000, 'seconds'))
      ).toBe(60)
    })

    it('should return sixty second period when asked for > 9000 <= 18000 seconds', () => {
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(9001, 'seconds'))
      ).toBe(60)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(17999, 'seconds'))
      ).toBe(60)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(18000, 'seconds'))
      ).toBe(60)
    })

    it('should return 120 second period when asked for > 18000 < 36000 seconds', () => {
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(18001, 'seconds'))
      ).toBe(120)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(35999, 'seconds'))
      ).toBe(120)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(36000, 'seconds'))
      ).toBe(120)
    })

    it('should return 180 second period when asked for > 36000 < 54000 seconds', () => {
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(36001, 'seconds'))
      ).toBe(180)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(53999, 'seconds'))
      ).toBe(180)
      expect(
        getPeriod(rangeStart, rangeStart.clone().add(54000, 'seconds'))
      ).toBe(180)
    })
  })
  describe('looking at times > 15 days ago < 63 days ago', () => {
    // Start time between 15 and 63 days ago - Use a multiple of 300 seconds (5 minutes).
    const rangeStart = moment().subtract(30, 'days')

    it('should return 290 minute period when asked for ~60 day duration', () => {
      expect(
        getPeriod(
          rangeStart,
          rangeStart.clone().add(60 * 24 * 3600, 'seconds')
        )
      ).toBe(290 * 60)
      expect(
        getPeriod(
          rangeStart,
          rangeStart.clone().add(60 * 24 * 3600 + 100, 'seconds')
        )
      ).toBe(290 * 60)
      expect(
        getPeriod(
          rangeStart,
          rangeStart.clone().add(60 * 24 * 3600 - 100, 'seconds')
        )
      ).toBe(290 * 60)
    })
  })

  describe('looking at times > 63 days ago', () => {
    // Start time greater than 63 days ago - Use a multiple of 3600 seconds (1 hour).
    const rangeStart = moment().subtract(100, 'days')
    const oneYearInSeconds = 365 * 24 * 60 * 60

    it('should return 30 hour period when asked for one year', () => {
      expect(
        getPeriod(
          rangeStart,
          rangeStart.clone().add(oneYearInSeconds, 'seconds')
        )
      ).toBe(30 * 3600)
    })
  })
})
