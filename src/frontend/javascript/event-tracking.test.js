/**
 * @jest-environment jsdom
 */

import EventTracking from './event-tracking'

const eventTracking = new EventTracking()

describe("link event tracking", () => {
  beforeEach(() => {
    global.dataLayer = []
    eventTracking.init()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it("if a link has data tracking attributes, those values should be used in push to dataLayer", () => {

    document.body.innerHTML = `
    <a href="/test"
      data-testid="data-attribute-tracking"
      data-track-click="true" 
      data-track-category="Test category 1" 
      data-track-action="Test action 1" 
      data-track-label="Test label 1">
        Link with data tracking attributes
    </a>
    `
    document.querySelector('[data-testid="data-attribute-tracking"').click()
    
    expect(global.dataLayer[0]).toEqual(
      expect.objectContaining({
        '0': 'event',
        '1': 'Test action 1',
        '2': { event_label: 'Test label 1', event_category: 'Test category 1' }
      })
    )
  })

  it("if a link has data tracking attributes but is also an external link, data attribute values should be used in push to dataLayer", () => {

    document.body.innerHTML = `
    <a href="https://example.com"
      data-testid="external-with-data-attribute-tracking"
      data-track-click="true" 
      data-track-category="Test category 2" 
      data-track-action="Test action 2" 
      data-track-label="Test label 2">
        External link with data tracking attributes
    </a>
    `

    document.querySelector('[data-testid="external-with-data-attribute-tracking"]').click()

    expect(global.dataLayer[0]).toEqual(
      expect.objectContaining({
        '0': 'event',
        '1': 'Test action 2',
        '2': { event_label: 'Test label 2', event_category: 'Test category 2' }
      })
    )
  })

  it("if a link is an external link only, values set in 'trackExternalLinkClick' function should be used in push to dataLayer", () => {

    document.body.innerHTML = `<a href="https://www.example.com" data-testid="external">External link</a>`

    document.querySelector('[data-testid="external"]').click()

    expect(global.dataLayer[0]).toEqual(
      expect.objectContaining({
        '0': 'event',
        '1': 'External link',
        '2': { event_category: 'External Link Clicked', event_label: 'https://www.example.com' }
      })
    )
  })
})

describe("page events", () => {
  it("if a page is a 403 page, values set in the 'errorPageEvent' function should be used in push to dataLayer", () => {
    document.body.innerHTML = `
      <h1>Page not authorised</h1>
    `
    global.dataLayer = []
    const eventTracking = new EventTracking()
    eventTracking.init()
    
    expect(global.dataLayer[0]).toEqual(
      expect.objectContaining({
        '0': 'event',
        '1': '403',
        '2': { event_category: 'Error' }
      })
    )
  })

  it("if a page is a 404 page, values set in the 'errorPageEvent' function should be used in push to dataLayer", () => {
    document.body.innerHTML = `
      <h1>Sorry an error occurred</h1>
    `
    global.dataLayer = []
    const eventTracking = new EventTracking()
    eventTracking.init()
    
    expect(global.dataLayer[0]).toEqual(
      expect.objectContaining({
        '0': 'event',
        '1': '500',
        '2': { event_category: 'Error' }
      })
    )
  })
  it("if a page is a 4500 page, values set in the 'errorPageEvent' function should be used in push to dataLayer", () => {
    document.body.innerHTML = `
      <h1>Page not found</h1>
    `
    global.dataLayer = []
    const eventTracking = new EventTracking()
    eventTracking.init()
    
    expect(global.dataLayer[0]).toEqual(
      expect.objectContaining({
        '0': 'event',
        '1': '404',
        '2': { event_category: 'Error' }
      })
    )
  })
})
