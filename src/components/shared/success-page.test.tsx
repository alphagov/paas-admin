import React from 'react'
import { SuccessPage } from './success-page'
import { shallow } from 'enzyme'

describe(SuccessPage, () => {
  it('should parse simple SuccessPage', () => {
    const markup = shallow(<SuccessPage heading='Success!' />)

    expect(markup.find('h1').text()).toEqual('Success!')
  })

  it('should parse rich SuccessPage', () => {
    const markup = shallow(<SuccessPage heading='Success!' text='You have passed the test.'>
      <p>Read more elsewhere!</p>
      <a href='#'>Elsewhere</a>
    </SuccessPage>)

    expect(markup.find('h1').text()).toEqual('Success!')
    expect(markup.render().find('div.govuk-panel__body').text()).toEqual('You have passed the test.')
    expect(markup.render().find('a').text()).toEqual('Elsewhere')
  })
})
