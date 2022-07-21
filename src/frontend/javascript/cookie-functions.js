/* eslint-disable no-var, prefer-const */
function Cookies () {
  this.cookieName = 'govuk-paas-cookie-policy'
  this.cookieDomain = 'cloud.service.gov.uk'
  this.trackingId = 'UA-43115970-5'
}

Cookies.prototype.cookieCleanup = function () {
  var isGaCookiePresent = !!(this.getCookie('_ga') && this.getCookie('_gid'))
  var isPaasCookiePolicyCookiePresent = !!(this.getCookie(this.cookieName))
  if (isGaCookiePresent) {
    var gtagCookie = '_gat_gtag_' + this.trackingId.replace(/-/g, '_')

    this.setCookie('_ga', '', { days: -1 })
    this.setCookie('_gid', '', { days: -1 })
    this.setCookie(gtagCookie, '', { days: -1 })
  }

  if (isPaasCookiePolicyCookiePresent) {
    this.setCookie(this.cookieName, '', { days: -1 })
  }
}

Cookies.prototype.setCookie = function (name, values, options) {
  /* istanbul ignore next */
  if (typeof options === 'undefined') {
    options = {}
  }

  var cookieString = name + '=' + values
  /* istanbul ignore next */
  if (options.days) {
    var date = new Date()
    date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000))
    cookieString = cookieString + '; expires=' + date.toGMTString() + ';domain=' + this.cookieDomain + '; path=/'
  }
  /* istanbul ignore next */
  if (document.location.protocol === 'https:') {
    cookieString = cookieString + '; Secure'
  }

  document.cookie = cookieString
}

Cookies.prototype.getCookie = function (name) {
  var nameEQ = name + '='
  var cookies = document.cookie.split(';')
  for (var i = 0, len = cookies.length; i < len; i++) {
    var cookie = cookies[i]
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1, cookie.length)
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length))
    }
  }
  return null
}

export default Cookies
