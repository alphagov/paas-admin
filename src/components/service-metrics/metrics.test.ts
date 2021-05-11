import { bytesLabel, numberLabel, percentLabel } from './metrics'

describe(bytesLabel, () => {
  it('should correctly print out the label', () => {
    expect(bytesLabel(2048, 0)).toEqual('2.00KiB')
  })
})

describe(numberLabel, () => {
  it('should correctly print out the label', () => {
    expect(numberLabel(1, 0)).toEqual('1')
    expect(numberLabel(1000, 0)).toEqual('1.00k')
    expect(numberLabel(1234, 0)).toEqual('1.23k')
    expect(numberLabel(1000000, 0)).toEqual('1.00m')
    expect(numberLabel(1234567, 0)).toEqual('1.23m')
    expect(numberLabel(1000000000, 0)).toEqual('1.00b')
    expect(numberLabel(1234567890, 0)).toEqual('1.23b')
  })
})

describe(percentLabel, () => {
  it('should correctly print out the label', () => {
    expect(percentLabel(75, 0)).toEqual('75%')
  })
})
