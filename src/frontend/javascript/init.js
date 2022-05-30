import { 
  Button,
  Details,
  ErrorSummary,
  Header,
  Radios,
  SkipLink

} from 'govuk-frontend'

import Tooltip from './tooltip';
import Cookies from './cookie-functions'
import EventTracking from './event-tracking'

var cookies = new Cookies()
var eventTracking = new EventTracking()

if (cookies.hasConsentForAnalytics()) {
  cookies.initAnalytics()
  eventTracking.init()
}

var $cookieBanner = document.querySelector('[data-module="govuk-cookie-banner"]')
if ($cookieBanner) {
  cookies.initCookieBanner($cookieBanner)
}

// there is ever only one header per page
var $header = document.querySelector('[data-module="govuk-header"]')
if ($header) {
  new Header($header).init()
}

var $buttons = document.querySelectorAll('[data-module="govuk-button"]');
if ($buttons) {
  for (var i = 0; i < $buttons.length; i++) {
    new Button($buttons[i]).init();
  };
}

var $details = document.querySelectorAll('[data-module="govuk-details"]');
if ($details) {
  for (var i = 0; i < $details.length; i++) {
    new Details($details[i]).init();
  };
}

// there is ever only one error summuary per page
var $errorSummary = document.querySelector('[data-module="govuk-error-summary"]');
if ($errorSummary) {
  new ErrorSummary($errorSummary).init();
}

var $radios = document.querySelectorAll('[data-module="govuk-radios"]');
if ($radios) {
  for (var i = 0; i < $radios.length; i++) {
    new Radios($radios[i]).init();
  };
}

var $tooltips = document.querySelectorAll('[data-module="tooltip"]');
if ($tooltips) {
  for (var i = 0; i < $tooltips.length; i++) {
    new Tooltip($tooltips[i]).init();
  };
}

// Find first skip link module to enhance.
var $skipLink = document.querySelector('[data-module="govuk-skip-link"]')
new SkipLink($skipLink).init()