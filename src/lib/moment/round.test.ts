import moment from 'moment'

import roundDown from './round'

describe('rounding dates down', () => {
  it('should round down the time to nearest 5min interval', () => {
    const fiveMins = moment.duration(5, 'minutes')
    expect(
      roundDown(moment('2019-11-13 09:03:00'), fiveMins).toISOString()
    ).toEqual('2019-11-13T09:00:00.000Z')
    expect(
      roundDown(moment('2019-12-13 12:34:23'), fiveMins).toISOString()
    ).toEqual('2019-12-13T12:30:00.000Z')
    expect(
      roundDown(moment('2019-11-10 14:15:00'), fiveMins).toISOString()
    ).toEqual('2019-11-10T14:15:00.000Z')
    expect(
      roundDown(moment('2019-11-09 10:00:00'), fiveMins).toISOString()
    ).toEqual('2019-11-09T10:00:00.000Z')
    expect(
      roundDown(moment('2019-11-08 16:47:00'), fiveMins).toISOString()
    ).toEqual('2019-11-08T16:45:00.000Z')
  })

  it('should round down the time to nearest day', () => {
    const oneDay = moment.duration(1, 'day')
    expect(
      roundDown(moment('2019-11-13 09:03:00'), oneDay).toISOString()
    ).toEqual('2019-11-13T00:00:00.000Z')
    expect(
      roundDown(moment('2019-12-13 12:34:23'), oneDay).toISOString()
    ).toEqual('2019-12-13T00:00:00.000Z')
    expect(
      roundDown(moment('2019-11-10 14:15:00'), oneDay).toISOString()
    ).toEqual('2019-11-10T00:00:00.000Z')
    expect(
      roundDown(moment('2019-11-09 10:00:00'), oneDay).toISOString()
    ).toEqual('2019-11-09T00:00:00.000Z')
    expect(
      roundDown(moment('2019-11-08 16:47:00'), oneDay).toISOString()
    ).toEqual('2019-11-08T00:00:00.000Z')
  })

  it('should round down the time to nearest second', () => {
    const oneSecond = moment.duration(1, 'second')
    expect(
      roundDown(moment('2019-11-13 09:03:00.123'), oneSecond).toISOString()
    ).toEqual('2019-11-13T09:03:00.000Z')
  })
})
