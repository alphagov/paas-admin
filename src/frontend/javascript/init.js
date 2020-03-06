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
    new GOVUKButton($button).init();
  };
}

var $details = document.querySelectorAll('[data-module="govuk-details"]');
var GOVUKDetails = window.GOVUKFrontend.Details;
if ($details) {
  for (var i = 0; i < $details.length; i++) {
    new GOVUKDetails($detail).init();
  };
}

// there is ever only one error summuary per page
var $errorSummary = document.querySelector('[data-module="govuk-error-summary"]');
var GOVUKErrorSummary = window.GOVUKFrontend.ErrorSummary;
if ($errorSummary) {
  new GOVUKErrorSummary($errorSummary).init();
}
