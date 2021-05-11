import cheerio from 'cheerio'
import { shallow } from 'enzyme'
import moment from 'moment'
import React from 'react'

import { DATE_TIME } from '../../layouts'
import { IOrganization } from '../../lib/cf/types'
import { IUaaGroup } from '../../lib/uaa'

import { PasswordResetRequest, PasswordResetSetPasswordForm, PasswordResetSuccess, UserPage } from './views'

function linker (_route: string, params: any): string {
  return params?.organizationGUID
    ? `/user/${params.organizationGUID}`
    : '/test'
}

describe(UserPage, () => {
  const orgA = ({
    metadata: { guid: 'a' },
    entity: { name: 'A' }
  } as unknown) as IOrganization
  const orgB = ({
    metadata: { guid: 'b' },
    entity: { name: 'B' }
  } as unknown) as IOrganization
  const orgC = ({
    metadata: { guid: 'c' },
    entity: { name: 'C' }
  } as unknown) as IOrganization
  const group = ({ display: 'profile' } as unknown) as IUaaGroup
  const user = {
    uuid: 'ACCOUNTS-USER-GUID',
    username: 'jeff0',
    email: 'jeff@jefferson.com'
  }
  const logon = new Date(2020, 1, 1)

  it('should display list of organizations', () => {
    const markup = shallow(
      <UserPage
        organizations={[orgA, orgB, orgC]}
        groups={[group]}
        lastLogon={logon}
        linkTo={linker}
        user={user}
        origin='google'
      />
    )
    const $ = cheerio.load(markup.html())
    expect($('dd').text()).toContain(moment(logon).format(DATE_TIME))
    expect($('p').text()).toContain('This user is a member of 3 orgs.')
    expect($('ul:last-of-type li')).toHaveLength(1)
  })

  it('should display list of organizations', () => {
    const markup = shallow(
      <UserPage
        organizations={[orgA, orgB, orgC]}
        groups={[group]}
        lastLogon={logon}
        linkTo={linker}
        user={user}
        origin='google'
      />
    )
    const $ = cheerio.load(markup.html())
    expect($('p').text()).toContain('This user is a member of 3 orgs.')
  })
})

describe(PasswordResetRequest, () => {
  it('should correctly produce the syntax', () => {
    const markup = shallow(<PasswordResetRequest csrf='CSRF_TOKEN' />)
    expect(markup.render().find('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect(markup.text()).not.toContain('Enter an email address in the correct format, like name@example.com')
  })

  it('should correctly throw an error when invalidEmail flag on', () => {
    const markup = shallow(<PasswordResetRequest
      csrf='CSRF_TOKEN'
      invalidEmail
      values={{ email: 'jeff@example.com' }}
    />)
    expect(markup.render().find('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect(markup.render().find('input[name=email]').val()).toEqual('jeff@example.com')
    expect(markup.text()).toContain('Enter an email address in the correct format, like name@example.com')
  })

  it('should correctly throw an error when invalidEmail flag on and no values passed back', () => {
    const markup = shallow(<PasswordResetRequest
      csrf='CSRF_TOKEN'
      invalidEmail
                           />)
    expect(markup.render().find('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect(markup.render().find('input[name=email]').val()).toBeUndefined()
    expect(markup.text()).toContain('Enter an email address in the correct format, like name@example.com')
  })
})

describe(PasswordResetSuccess, () => {
  it('should correctly produce the syntax', () => {
    const markup = shallow(<PasswordResetSuccess title='Success' />)
    expect(markup.find('h1').text()).toEqual('Success')
  })
})

describe(PasswordResetSetPasswordForm, () => {
  it('should correctly produce the syntax', () => {
    const markup = shallow(<PasswordResetSetPasswordForm csrf='CSRF_TOKEN' code='PASSWORD_RESET_CODE' />)
    expect(markup.render().find('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect(markup.render().find('input[name=code]').val()).toEqual('PASSWORD_RESET_CODE')
    expect(markup.text()).not.toContain('You need to type in the same password twice')
  })

  it('should correctly throw an error when passwordMismatch flag on', () => {
    const markup = shallow(<PasswordResetSetPasswordForm
      code='PASSWORD_RESET_CODE'
      csrf='CSRF_TOKEN'
      passwordMismatch
                           />)
    expect(markup.render().find('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect(markup.render().find('input[name=code]').val()).toEqual('PASSWORD_RESET_CODE')
    expect(markup.text()).toContain('You need to type in the same password twice')
  })
})
