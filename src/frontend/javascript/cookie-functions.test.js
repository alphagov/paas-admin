/**
 * @jest-environment jsdom
 */
import Cookies from './cookie-functions'
const cookies = new Cookies()

const paasPolicyCookie = 'govuk-paas-cookie-policy'
const randomOtherCookie = 'myCookie'

describe("cookie clenaup function", () => {

  afterEach(() => {
    // reset cookies after each test
    cookies.setCookie(paasPolicyCookie, '', { days: -1 })
    cookies.setCookie(randomOtherCookie, '', { days: -1 })
  })

  it('if a govuk-paas-cookie-policy cookie exists, it should be deleted', () => {
    cookies.cookieDomain = '' // to be able to set a cookie in test env
    cookies.setCookie(paasPolicyCookie, 'no', { days: 1 })
    cookies.cookieCleanup()

    expect(document.cookie).not.toContain(paasPolicyCookie)
  })

  it('if a non govuk-paas-cookie-policy cookie exists, it should not be deleted', () => {
    cookies.cookieDomain = '' // to be able to set a cookie in test env
    cookies.setCookie(randomOtherCookie, 'test', { days: 1 })
    cookies.cookieCleanup()

    expect(document.cookie).toContain(randomOtherCookie)
    expect(document.cookie).not.toContain(paasPolicyCookie)
  })

  it('if GA cookies exists, they should be deleted', () => {
    cookies.cookieDomain = '' // to be able to set a cookie in test env
    cookies.setCookie('_ga', 'test', { days: 1 })
    cookies.setCookie('_gid', 'test', { days: 1 })
    cookies.cookieCleanup()

    expect(document.cookie).toBe('')
  })
})
