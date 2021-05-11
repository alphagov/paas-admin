import { parseURL } from './views'

describe(parseURL, () => {
  it('should correctly prepare URL', () => {
    expect(parseURL('/test', { a: 'test' })).not.toContain('//')
    expect(parseURL('/test', { a: 'test', b: 'success' })).toEqual('/test?a=test&b=success')
    expect(parseURL('/test?d=good&c=old', { a: 'test', b: 'success', c: 'new' }))
      .toEqual('/test?d=good&c=new&a=test&b=success')
  })
})
