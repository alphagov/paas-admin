/* istanbul ignore file */

function Cookies () {
    this.cookieName = 'govuk-paas-cookie-policy'
    this.cookieDomain = 'cloud.service.gov.uk'
    this.cookieDuration = 365
    this.trackingId = 'UA-43115970-5'
    // disable tracking by default
    window['ga-disable-' + this.trackingId] = true;
}

Cookies.prototype.hasConsentForAnalytics = function () {
  var consentCookie = JSON.parse(this.getCookie(this.cookieName));
  return consentCookie ? consentCookie.analytics : false
}

Cookies.prototype.initAnalytics = function() {

  // guard against being called more than once
  if (!('GoogleAnalyticsObject' in window)) {

    window['ga-disable-' + this.trackingId] = false;

    // Load GTM
    this.loadGtmScript()
    this.setupGtm()
  }
}

Cookies.prototype.initCookieBanner = function ($module) {
  this.$module = $module

  if (!this.$module) {
    return
  }

  this.$module.hideCookieMessage = this.hideCookieMessage.bind(this)
  this.$module.showBannerConfirmationMessage = this.showBannerConfirmationMessage.bind(this)
  this.$module.setBannerCookieConsent = this.setBannerCookieConsent.bind(this)
  this.$module.cookieBannerConfirmationMessage = this.$module.querySelector('.cookie-banner__confirmation')

  this.$hideLink = this.$module.querySelector('button[data-hide-cookie-banner]');
  if (this.$hideLink) {
    this.$hideLink.addEventListener('click', this.$module.hideCookieMessage);
  }

  this.$acceptCookiesLink = this.$module.querySelector('button[data-accept-cookies=true]');
  if (this.$acceptCookiesLink) {
    this.$acceptCookiesLink.addEventListener('click', () => this.$module.setBannerCookieConsent(true));
  }

  this.$rejectCookiesLink = this.$module.querySelector('button[data-accept-cookies=false]');
  if (this.$rejectCookiesLink) {
    this.$rejectCookiesLink.addEventListener('click', () => this.$module.setBannerCookieConsent(false));
  }

  this.showCookieBanner()
}

Cookies.prototype.showCookieBanner = function () {
  // Show the cookie banner if there is no cookie set
  var hasCookiesPolicy = this.getCookie(this.cookieName)
  if (this.$module && !hasCookiesPolicy) {
    this.$module.style.display = 'block'
  }
}

Cookies.prototype.setBannerCookieConsent = function (analyticsConsent) {
  this.setCookie(this.cookieName, JSON.stringify({ 'analytics': analyticsConsent }), {days: this.cookieDuration})

  this.$module.showBannerConfirmationMessage(analyticsConsent)
  this.$module.cookieBannerConfirmationMessage.focus()

  if (analyticsConsent) { 
    this.initAnalytics()
  }
}

Cookies.prototype.hideCookieMessage = function (event) {
  if (this.$module) {
    this.$module.style.display = 'none'
  }

  if (event.target) {
    event.preventDefault()
  }
}

Cookies.prototype.showBannerConfirmationMessage = function (analyticsConsent) {
  var messagePrefix = analyticsConsent ? 'You’ve accepted analytics cookies.' : 'You told us not to use analytics cookies.';

  this.$cookieBannerMainContent = document.querySelector('.cookie-banner__wrapper')
  this.$cookieBannerConfirmationMessage = document.querySelector('.cookie-banner__confirmation-message')

  this.$cookieBannerConfirmationMessage.insertAdjacentText('afterbegin', messagePrefix)
  this.$cookieBannerMainContent.style.display = 'none'
  this.$module.cookieBannerConfirmationMessage.style.display = 'block'
};

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

Cookies.prototype.setCookie = function (name, values, options) {
  if (typeof options === 'undefined') {
    options = {}
  }

  var cookieString = name + '=' + values
  if (options.days) {
    var date = new Date()
    date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000))
    cookieString = cookieString + '; expires=' + date.toGMTString() + ';domain=' + this.cookieDomain + '; path=/'
  }

  if (document.location.protocol === 'https:') {
    cookieString = cookieString + '; Secure';
  }

  document.cookie = cookieString
}

// GA analytics functions

Cookies.prototype.setupGtm = function () {
  // Pull dimensions vals from meta ; else all script/origin combinations have to be in the CSP	
  window.dataLayer = window.dataLayer || [];	
  function gtag(){dataLayer.push(arguments);}	
  gtag('js', new Date());	

  var config = {
    cookie_expires: this.cookieDuration * 24 * 60 * 60,
    page_path: this.stripUuids(),
    // Paas-admin gets a relatively small number	
    // of visits daily, so the default site speed	
    // sample rate of 1% gives us too few data points.	
    // Settings it to 30% gives us more data.	
    siteSpeedSampleRate: 30,
    anonymize_ip: true,
    linker: {
      domains: [
        'cloud.service.gov.uk',
        'admin.cloud.service.gov.uk',
        'admin.london.cloud.service.gov.uk', 
        'docs.cloud.service.gov.uk'
      ]
    }
  };	

  var originTag = document.querySelector('meta[name="x-user-identity-origin"]')
  if (originTag && originTag.content) {	
    config['dimension1'] = originTag.content;	
  }	

  gtag('config', this.trackingId, config);
}

Cookies.prototype.loadGtmScript = function () {
  var gtmScriptTag = document.createElement("script");
  gtmScriptTag.type = "text/javascript"
  gtmScriptTag.setAttribute("async", "true")
  gtmScriptTag.setAttribute("src", "https://www.googletagmanager.com/gtag/js?id=" + this.trackingId)
  document.documentElement.firstChild.appendChild(gtmScriptTag)
}

Cookies.prototype.stripUuids = function () {
  return window.location.pathname.replace(
    /[a-f0-9]{8}-?[a-f0-9]{4}-?4[a-f0-9]{3}-?[89ab][a-f0-9]{3}-?[a-f0-9]{12}/g, '…'
  )
}

export default Cookies
