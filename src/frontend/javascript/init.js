import { Header } from 'govuk-frontend'
var $header = document.querySelector('[data-module="govuk-header"]')
if ($header) {
  new Header($header).init()
}