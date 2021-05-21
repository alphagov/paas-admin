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
var $headerMenuButton = document.querySelector('[data-module="govuk-header"]');
var GOVUKHeader = window.GOVUKFrontend.Header;
if ($headerMenuButton) {
  new GOVUKHeader($headerMenuButton).init();
}

var $buttons = document.querySelectorAll('[data-module="govuk-button"]');
var GOVUKButton = window.GOVUKFrontend.Button;
if ($buttons) {
  for (var i = 0; i < $buttons.length; i++) {
    new GOVUKButton($buttons[i]).init();
  };
}

var $details = document.querySelectorAll('[data-module="govuk-details"]');
var GOVUKDetails = window.GOVUKFrontend.Details;
if ($details) {
  for (var i = 0; i < $details.length; i++) {
    new GOVUKDetails($details[i]).init();
  };
}

// there is ever only one error summuary per page
var $errorSummary = document.querySelector('[data-module="govuk-error-summary"]');
var GOVUKErrorSummary = window.GOVUKFrontend.ErrorSummary;
if ($errorSummary) {
  new GOVUKErrorSummary($errorSummary).init();
}

var $radios = document.querySelectorAll('[data-module="govuk-radios"]');
var GOVUKRadios = window.GOVUKFrontend.Radios;
if ($radios) {
  for (var i = 0; i < $radios.length; i++) {
    new GOVUKRadios($radios[i]).init();
  };
}

var $tooltips = document.querySelectorAll('[data-module="tooltip"]');
if ($tooltips) {
  for (var i = 0; i < $tooltips.length; i++) {
    new Tooltip($tooltips[i]).init();
  };
}
