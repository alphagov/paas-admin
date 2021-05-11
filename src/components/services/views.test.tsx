import cheerio from 'cheerio'
import { shallow } from 'enzyme'
import React from 'react'

import { IService, IServiceInstance, IServicePlan } from '../../lib/cf/types'

import { ServicePage, ServiceTab, ServiceLogsPage } from './views'

describe(ServiceTab, () => {
  it('should produce service tab', () => {
    const service = ({
      metadata: { guid: 'SERVICE_GUID' },
      entity: { name: 'service-name' },
      service: { entity: { label: 'postgres' } }
    } as unknown) as IServiceInstance
    const markup = shallow(
      <ServiceTab
        service={service}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'}
        organizationGUID='ORG_GUID'
        spaceGUID='SPACE_GUID'
      >
        <p>TEST</p>
      </ServiceTab>
    )
    const $ = cheerio.load(markup.html())
    expect($('h1').text()).toContain('service-name')
    expect($('section.govuk-tabs__panel').text()).toEqual('TEST')
    expect($('ul li:first-of-type a').prop('href')).toEqual(
      '__LINKS_TO__admin.organizations.spaces.services.view'
    )
    expect(
      $('ul li:first-of-type').hasClass('govuk-tabs__list-item--selected')
    ).toBe(true)
    expect($('ul li:last-of-type a').prop('href')).toEqual(
      '__LINKS_TO__admin.organizations.spaces.services.logs.view'
    )
    expect(
      $('ul li:last-of-type').hasClass('govuk-tabs__list-item--selected')
    ).toBe(false)
  })

  it('should produce service tab without logs tab', () => {
    const service = ({
      metadata: { guid: 'SERVICE_GUID' },
      entity: { name: 'service-name', type: 'not-approved' }
    } as unknown) as IServiceInstance

    const markup = shallow(
      <ServiceTab
        service={service}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'}
        organizationGUID='ORG_GUID'
        spaceGUID='SPACE_GUID'
      >
        <p>TEST</p>
      </ServiceTab>
    )

    const $ = cheerio.load(markup.html())
    expect($('h1').text()).toContain('service-name')
    expect($('section.govuk-tabs__panel').text()).toEqual('TEST')
    expect($('ul li:first-of-type a').prop('href')).toEqual('__LINKS_TO__admin.organizations.spaces.services.view')
    expect($('ul li:first-of-type').hasClass('govuk-tabs__list-item--selected')).toBe(true)
    expect($('ul li:last-of-type a').prop('href')).not.toEqual('__LINKS_TO__admin.organizations.spaces.services.logs.view')
    expect($('ul li:last-of-type').hasClass('govuk-tabs__list-item--selected')).toBe(false)
  })
})

describe(ServicePage, () => {
  it('should not display default values', () => {
    const service = ({
      metadata: { guid: 'SERVICE_GUID' },
      entity: {
        last_operation: { state: 'success' },
        name: 'service-name',
        tags: []
      }
    } as unknown) as IServiceInstance
    const markup = shallow(
      <ServicePage
        service={{
          ...service,
          service_plan: ({
            entity: { name: 'service-plan-name' }
          } as unknown) as IServicePlan,
          service: ({
            entity: { label: 'service-label' }
          } as unknown) as IService
        }}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'}
        organizationGUID='ORG_GUID'
        spaceGUID='SPACE_GUID'
      />
    )
    const $ = cheerio.load(markup.html())
    expect($('td.label').text()).toContain('service-label')
    expect($('td.plan').text()).toContain('service-plan-name')
    expect($('td.status').text()).toContain('success')
  })

  it('should fallback to default values', () => {
    const service = ({
      metadata: { guid: 'SERVICE_GUID' },
      entity: { name: 'service-name', tags: [] }
    } as unknown) as IServiceInstance
    const markup = shallow(
      <ServicePage
        service={service}
        linkTo={route => `__LINKS_TO__${route}`}
        routePartOf={route =>
          route === 'admin.organizations.spaces.services.view'}
        organizationGUID='ORG_GUID'
        spaceGUID='SPACE_GUID'
      />
    )
    const $ = cheerio.load(markup.html())
    expect($('td.label').text()).toContain('User Provided Service')
    expect($('td.plan').text()).toContain('N/A')
    expect($('td.status').text()).toContain('N/A')
  })
})

describe(ServiceLogsPage, () => {
  const files = [
    { LastWritten: 1578837540000, LogFileName: 'file-one', Size: 73728 },
    { LastWritten: 1578841140000, LogFileName: 'file-two', Size: 1488978 },
    { LastWritten: 1578844740000, LogFileName: 'file-three', Size: 0 }
  ]
  const service = ({
    entity: { name: 'service-name' },
    metadata: { guid: 'SERVICE_GUID' }
  } as unknown) as IServiceInstance

  it('should print out the list of downloadable files', () => {
    const markup = shallow(<ServiceLogsPage
      files={files}
      service={service}
      linkTo={route => `__LINKS_TO__${route}`}
      routePartOf={route => route === 'admin.organizations.spaces.services.logs.view'}
      organizationGUID='ORG_GUID'
      spaceGUID='SPACE_GUID'
                           />)

    expect(markup.render().find('li.service-log-list-item').length).toEqual(3)

    expect(markup.render().find('li.service-log-list-item').text()).toContain('file-one')
    expect(markup.render().find('li.service-log-list-item').text()).toContain('72.00 KiB')
    expect(markup.render().find('li.service-log-list-item').text()).toContain('1:59pm, 12 January 2020')

    expect(markup.render().find('li.service-log-list-item').text()).toContain('file-two')
    expect(markup.render().find('li.service-log-list-item').text()).toContain('1.42 MiB')
    expect(markup.render().find('li.service-log-list-item').text()).toContain('2:59pm, 12 January 2020')

    expect(markup.render().find('li.service-log-list-item').text()).toContain('file-three')
    expect(markup.render().find('li.service-log-list-item').text()).toContain('0 B')
    expect(markup.render().find('li.service-log-list-item').text()).toContain('3:59pm, 12 January 2020')
  })

  it('should mention that there are no files available for download', () => {
    const markup = shallow(<ServiceLogsPage
      files={[]}
      service={service}
      linkTo={route => `__LINKS_TO__${route}`}
      routePartOf={route => route === 'admin.organizations.spaces.services.logs.view'}
      organizationGUID='ORG_GUID'
      spaceGUID='SPACE_GUID'
                           />)

    expect(markup.render().find('li.service-log-list-item').length).toEqual(0)

    expect(markup.render().find('p').text())
      .toContain('There are no log files available at this time.')
  })
})
