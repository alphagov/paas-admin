/* istanbul ignore file */

function EventTracking () {
  this.$bodyElement = document.querySelector('body')
  this.$mainHeading = this.$bodyElement.querySelector('h1')
 }

EventTracking.prototype.init = function() {

  this.$bodyElement.addEventListener('click', this.handleClickEvent.bind(this))
  this.checkForErrorPage(this.$mainHeading)
}

EventTracking.prototype.handleClickEvent = function (e) {
  var target = e.target,
      isLink = e.target.nodeName === 'A',
      // external link: starts with http(s) or mailto and does not contain a "service.gov" in url
      externalLinkRegex = /^(?=.*(http|mailto))(?:(?!cloud\.service\.gov\.uk).)*$/g,
      isExternalLink = isLink && externalLinkRegex.test(target.getAttribute('href')),
      // we have data tracking attributes on some elements
      isManuallyTargetedElement = target.hasAttribute('data-track-click') 
        && target.getAttribute('data-track-click').indexOf('true') > -1

  // therem ight be an edge case where a manually tagretted link could also be an external link
  // and we only wan't to fire one function in such a case
  // hence the logic below
  if (isExternalLink && isManuallyTargetedElement) {
    this.trackTargettedLinkClick(target)
  }
  
  if (!isExternalLink && isManuallyTargetedElement) {
    this.trackTargettedLinkClick(target)
  }

  if (isExternalLink && !isManuallyTargetedElement) {
    this.trackExternalLinkClick(target)
  }
}

EventTracking.prototype.trackTargettedLinkClick = function (element) {
  var eventParams = {},
    category = element.getAttribute('data-track-category'),
    action = element.getAttribute('data-track-action'),
    label = element.getAttribute('data-track-label')

  if (label) {
    eventParams.event_label = label
  }

  if (category) {
    eventParams.event_category = category
  }
  
  this.sendEvent(action, eventParams)
}

EventTracking.prototype.trackExternalLinkClick = function (element) {

  var eventParams = {},
      action = element.textContent

  eventParams.event_category = 'External Link Clicked'
  eventParams.event_label = element.getAttribute('href')
  
  this.sendEvent(action, eventParams)
}

EventTracking.prototype.errorPageEvent = function (errorStatusCode) {

  var eventParams = {},
      action = errorStatusCode

  eventParams.event_category = 'Error'
  
  this.sendEvent(action, eventParams)
}

EventTracking.prototype.sendEvent = function (action, options) {
  window.dataLayer = window.dataLayer || []
  var gtag = function () {
    dataLayer.push(arguments)
  }

  gtag('event', action, options)
}

EventTracking.prototype.checkForErrorPage = function(identifier) {
  // GA needs strings for status code as event labels
  var errorPagesArray = [
    {
      title: 'Page not authorised',
      statusCode: '403'
    },
    {
      title: 'Page not found',
      statusCode: '404'
    },
    {
      title: 'Sorry an error occurred',
      statusCode: '500'
    }
  ]
  if (!identifier) return
  
  var errorPageData  = errorPagesArray.filter(function(o){
    return o.title === identifier.textContent; 
  });
  
  errorPageData[0] ? this.errorPageEvent(errorPageData[0].statusCode) : null;
}

export default EventTracking
