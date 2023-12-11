import { 
  Button,
  ErrorSummary,
  Header,
  Radios,
  SkipLink

} from 'govuk-frontend'

import Tooltip from './tooltip';

// there is ever only one header per page
var $header = document.querySelector('[data-module="govuk-header"]')
if ($header) {
  new Header($header)
}

var $buttons = document.querySelectorAll('[data-module="govuk-button"]');
if ($buttons) {
  for (var i = 0; i < $buttons.length; i++) {
    new Button($buttons[i]);
  };
}

// there is ever only one error summuary per page
var $errorSummary = document.querySelector('[data-module="govuk-error-summary"]');
if ($errorSummary) {
  new ErrorSummary($errorSummary);
}

var $radios = document.querySelectorAll('[data-module="govuk-radios"]');
if ($radios) {
  for (var i = 0; i < $radios.length; i++) {
    new Radios($radios[i]);
  };
}

var $tooltips = document.querySelectorAll('[data-module="tooltip"]');
if ($tooltips) {
  for (var i = 0; i < $tooltips.length; i++) {
    new Tooltip($tooltips[i]);
  };
}

// Find first skip link module to enhance.
var $skipLink = document.querySelector('[data-module="govuk-skip-link"]')
new SkipLink($skipLink)


var $preventMultiClickBtns = document.querySelectorAll('[data-module="preventMultiClick"]');
if ($preventMultiClickBtns) {
  for (var i = 0; i < $preventMultiClickBtns.length; i++) {
    $preventMultiClickBtns[i].addEventListener("click", function () {
      this.form.submit();
      this.setAttribute("disabled", "disabled");
      this.textContent = "Loading data...";
      this.setAttribute("aria-disabled", "true");
    });
  };
}