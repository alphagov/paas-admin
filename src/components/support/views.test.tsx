import cheerio from 'cheerio'
import { shallow } from 'enzyme'
import React from 'react'

import {
  ContactUsPage,
  FindOutMorePage,
  HelpUsingPaasPage,
  SignUpPage,
  SomethingWrongWithServicePage,
  SupportConfirmationPage,
  SupportSelectionPage
} from './views'

describe(SupportSelectionPage, () => {
  it('should correctly render the form', () => {
    const markup = shallow(<SupportSelectionPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
    />)
    const $ = cheerio.load(markup.html())
    expect($('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect($('.govuk-radios')).toHaveLength(1)
    expect($('.govuk-error-summary')).toHaveLength(0)
    expect($('.govuk-error-message')).toHaveLength(0)
  })

  it('should display error messages if form has missing data', () => {
    const markup = shallow(<SupportSelectionPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
      errors={[
        {
          field: 'support_type',
          message: 'Select which type of support your require'
        }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-radios input:checked')).toHaveLength(0)
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(1)
    expect($('.govuk-error-message')).toHaveLength(1)
    expect($('.govuk-error-message').text()).toContain('Select which type of support your require')
  })
})

describe(SomethingWrongWithServicePage, () => {
  it('should correctly render the form', () => {
    const markup = shallow(<SomethingWrongWithServicePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
    />)

    const $ = cheerio.load(markup.html())
    expect($('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect($('.govuk-input')).toHaveLength(3)
    expect($('.govuk-textarea')).toHaveLength(1)
    expect($('.govuk-radios')).toHaveLength(1)
    expect($('.govuk-error-summary')).toHaveLength(0)
    expect($('.govuk-error-message')).toHaveLength(0)
  })

  it('should display error messages if form has missing data', () => {
    const markup = shallow(<SomethingWrongWithServicePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
      errors={[
        {
          field: 'name',
          message: 'Enter your full name'
        },
        {
          field: 'email',
          message: 'Enter an email address in the correct format, like name@example.com'
        },
        {
          field: 'affected_paas_organisation',
          message: 'Enter the name of the affected organisation'
        },
        {
          field: 'impact_severity',
          message: 'Select the severity of the impact'
        },
        {
          field: 'message',
          message: 'Enter your message'
        }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(5)
    expect($('.govuk-radios input:checked')).toHaveLength(0)
    expect($('.govuk-error-message')).toHaveLength(5)
    expect($('#name-error').text()).toContain('Enter your full name')
    expect($('#email-error').text()).toContain('Enter an email address in the correct format, like name@example.com')
    expect($('#affected_paas_organisation-error').text()).toContain('Enter the name of the affected organisation')
    expect($('#impact_severity-error').text()).toContain('Select the severity of the impact')
    expect($('#message-error').text()).toContain('Enter your message')
  })
})

describe(HelpUsingPaasPage, () => {
  it('should correctly render the form', () => {
    const markup = shallow(<HelpUsingPaasPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
    />)
    const $ = cheerio.load(markup.html())
    expect($('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect($('.govuk-error-summary')).toHaveLength(0)
    expect($('.govuk-error-message')).toHaveLength(0)
    expect($('.govuk-input')).toHaveLength(3)
    expect($('.govuk-textarea')).toHaveLength(1)
  })

  it('should display error messages if form has missing data', () => {
    const markup = shallow(<HelpUsingPaasPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{
        paas_organisation_name: 'test paas org'
      } as any}
      errors={[{
        field: 'name',
        message: 'Enter your full name'
      },
      {
        field: 'email',
        message: 'Enter an email address in the correct format, like name@example.com'
      },
      {
        field: 'message',
        message: 'Enter your message'
      }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(3)
    expect($('.govuk-error-message')).toHaveLength(3)
    expect($('#paas_organisation_name').val()).toContain('test paas org')
    expect($('#name-error').text()).toContain('Enter your full name')
    expect($('#email-error').text()).toContain('Enter an email address in the correct format, like name@example.com')
    expect($('#message-error').text()).toContain('Enter your message')
  })
})

describe(FindOutMorePage, () => {
  it('should correctly render the form', () => {
    const markup = shallow(<FindOutMorePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
    />)

    const $ = cheerio.load(markup.html())
    expect($('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect($('.govuk-input')).toHaveLength(3)
    expect($('.govuk-textarea')).toHaveLength(1)
    expect($('.govuk-error-summary')).toHaveLength(0)
    expect($('.govuk-error-message')).toHaveLength(0)
  })

  it('should display error messages if form has missing data', () => {
    const markup = shallow(<FindOutMorePage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
      errors={[
        {
          field: 'name',
          message: 'Enter your full name'
        },
        {
          field: 'email',
          message: 'Enter an email address in the correct format, like name@example.com'
        },
        {
          field: 'gov_organisation_name',
          message: 'Enter your government organisation’s name'
        },
        {
          field: 'message',
          message: 'Enter your message'
        }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(4)
    expect($('.govuk-error-message')).toHaveLength(4)
    expect($('#name-error').text()).toContain('Enter your full name')
    expect($('#email-error').text()).toContain('Enter an email address in the correct format, like name@example.com')
    expect($('#gov_organisation_name-error').text()).toContain('Enter your government organisation’s name')
    expect($('#message-error').text()).toContain('Enter your message')
  })
})

describe(ContactUsPage, () => {
  it('should correctly render the form', () => {
    const markup = shallow(<ContactUsPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
    />)
    const $ = cheerio.load(markup.html())
    expect($('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect($('.govuk-error-summary')).toHaveLength(0)
    expect($('.govuk-error-message')).toHaveLength(0)
    expect($('.govuk-input')).toHaveLength(4)
    expect($('.govuk-textarea')).toHaveLength(1)
  })

  it('should display error messages if form has missing data', () => {
    const markup = shallow(<ContactUsPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
      errors={[{
        field: 'name',
        message: 'Enter your full name'
      },
      {
        field: 'email',
        message: 'Enter an email address in the correct format, like name@example.com'
      },
      {
        field: 'message',
        message: 'Enter your message'
      },
      {
        field: 'department_agency',
        message: 'Enter your department or agency'
      },
      {
        field: 'service_team',
        message: 'Enter your service or team'
      }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(5)
    expect($('.govuk-error-message')).toHaveLength(5)
    expect($('#name-error').text()).toContain('Enter your full name')
    expect($('#email-error').text()).toContain('Enter an email address in the correct format, like name@example.com')
    expect($('#department_agency-error').text()).toContain('Enter your department or agency')
    expect($('#service_team-error').text()).toContain('Enter your service or team')
    expect($('#message-error').text()).toContain('Enter your message')
  })
})

describe(SignUpPage, () => {
  it('should correctly render the form', () => {
    const markup = shallow(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
    />)

    const $ = cheerio.load(markup.html())
    expect($('input[name=_csrf]').val()).toEqual('CSRF_TOKEN')
    expect($('.govuk-input')).toHaveLength(7)
    expect($('.govuk-radios')).toHaveLength(2)
    expect($('.govuk-error-summary')).toHaveLength(0)
    expect($('.govuk-radios__conditional .govuk-input')).toHaveLength(3)
  })

  it('should display error messages if form has missing data', () => {
    const markup = shallow(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{} as any}
      errors={[{
        field: 'name',
        message: 'Enter your full name'
      },
      {
        field: 'email',
        message: 'Enter an email address in the correct format, like name@example.com'
      },
      {
        field: 'department_agency',
        message: 'Enter your department or agency'
      },
      {
        field: 'service_team',
        message: 'Enter your service or team'
      },
      {
        field: 'person_is_manager',
        message: 'Select the appropriate option for an org manager'
      },
      {
        field: 'invite_users',
        message: 'Select "Yes" if you would like to invite users to your organisation'
      }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(6)
    expect($('.govuk-radios input:checked')).toHaveLength(0)
    expect($('.govuk-error-message')).toHaveLength(6)
    expect($('#name-error').text()).toContain('Enter your full name')
    expect($('#email-error').text()).toContain('Enter an email address in the correct format, like name@example.com')
    expect($('#department_agency-error').text()).toContain('Enter your department or agency')
    expect($('#service_team-error').text()).toContain('Enter your service or team')
    expect($('#person_is_manager-error').text()).toContain('Select the appropriate option for an org manager')
    expect($('#invite_users-error').text()).toContain('Select "Yes" if you would like to invite users to your organisation')
  })

  it('should display error messages for non-allowed email address', () => {
    const markup = shallow(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{
        email: 'test@test.co.uk',
        invite_users: 'yes',
        person_is_manager: 'yes',
        additional_users: undefined
      } as any}
      errors={[{
        field: 'email',
        message: 'We only accept .gov.uk, .mod.uk, nhs.net, nhs.uk, .police.uk or police.uk email addresses',
        messageExtra: 'If you work for a government organisation or public body with a different email address, please contact us on <a class="govuk-link" href="mailto:gov-uk-paas-support@digital.cabinet-office.gov.uk">gov-uk-paas-support@digital.cabinet-office.gov.uk</a>'
      }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(1)
    expect($('.govuk-error-summary li:first-child').text()).toContain('We only accept .gov.uk, .mod.uk, nhs.net, nhs.uk, .police.uk or police.uk email addresses')
    expect($('#email-error span:last-child').html()).toContain('If you work for a government organisation or public body with a different email address, please contact us on <a class="govuk-link" href="mailto:gov-uk-paas-support@digital.cabinet-office.gov.uk">gov-uk-paas-support@digital.cabinet-office.gov.uk</a>')
    expect($('input#person_is_manager:checked')).toHaveLength(1)
    expect($('input#invite_users:checked')).toHaveLength(1)
  })

  it('should not display errror if additional users details are not entered', () => {
    const markup = shallow(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{
        additional_users: undefined
      } as any}
      errors={[]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(0)
    expect($('input[type="text"][name^="additional_users[0][email]"]').val()).toBeUndefined()
    expect($('input[type="text"][name^="additional_users[1][email]"]').val()).toBeUndefined()
    expect($('input[type="text"][name^="additional_users[2][email]"]').val()).toBeUndefined()
    expect($('input[type="checkbox"][name^="additional_users[0][person_is_manager]"]').attr('checked')).toBeUndefined()
    expect($('input[type="checkbox"][name^="additional_users[1][person_is_manager]"]').attr('checked')).toBeUndefined()
    expect($('input[type="checkbox"][name^="additional_users[2][person_is_manager]"]').attr('checked')).toBeUndefined()
  })

  it('should display error messages if additional users email addresses are invalid', () => {
    const markup = shallow(<SignUpPage
      linkTo={route => `__LINKS_TO__${route}`}
      csrf='CSRF_TOKEN'
      values={{
        additional_users: [
          {
            email: 'user1',
            person_is_manager: 'yes'
          },
          {
            email: 'user2',
            person_is_manager: 'yes'
          },
          {
            email: 'user3',
            person_is_manager: 'yes'
          }
        ]
      } as any}
      errors={[
        {
          field: 'additional_users-0',
          message: 'Enter additional user 1 email address in the correct format, like name@example.com'
        },
        {
          field: 'additional_users-1',
          message: 'Enter additional user 2 email address in the correct format, like name@example.com'
        },
        {
          field: 'additional_users-2',
          message: 'Enter additional user 3 email address in the correct format, like name@example.com'
        }
      ]}
    />)
    const $ = cheerio.load(markup.html())
    expect($('.govuk-error-summary')).toHaveLength(1)
    expect($('.govuk-error-summary li')).toHaveLength(3)
    expect($('#additional_users-0-error').text()).toContain('Enter additional user 1 email address in the correct format, like name@example.com')
    expect($('#additional_users-1-error').text()).toContain('Enter additional user 2 email address in the correct format, like name@example.com')
    expect($('#additional_users-2-error').text()).toContain('Enter additional user 3 email address in the correct format, like name@example.com')
    expect($('input[type="text"][name^="additional_users[0][email]"]').val()).toEqual('user1')
    expect($('input[type="text"][name^="additional_users[1][email]"]').val()).toEqual('user2')
    expect($('input[type="text"][name^="additional_users[2][email]"]').val()).toEqual('user3')
    expect($('input[type="checkbox"][name^="additional_users[0][person_is_manager]"]').attr('checked')).toBe('checked')
    expect($('input[type="checkbox"][name^="additional_users[1][person_is_manager]"]').attr('checked')).toBe('checked')
    expect($('input[type="checkbox"][name^="additional_users[2][person_is_manager]"]').attr('checked')).toBe('checked')
  })
})

describe(SupportConfirmationPage, () => {
  const markup = shallow(
    <SupportConfirmationPage
      linkTo={route => `__LINKS_TO__${route}`}
      heading='confirmation panel heading'
      text='confirmation panel text'
    >
      children text
    </SupportConfirmationPage>
  )

  it('should have a confirmation panel title', () => {
    const $ = cheerio.load(markup.html())
    expect($('.govuk-panel__title').text()).toContain('confirmation panel heading')
  })

  it('should have a confirmation panel text', () => {
    const $ = cheerio.load(markup.html())
    expect($('.govuk-panel__body').text()).toContain('confirmation panel text')
  })

  it('should have props children text if provided', () => {
    const $ = cheerio.load(markup.html())
    expect($('.govuk-body').text()).toContain('children text')
  })

  it('should NOT have props children text if not provided', () => {
    const markup = shallow(
      <SupportConfirmationPage
        linkTo={route => `__LINKS_TO__${route}`}
        heading='confirmation panel heading'
        text='confirmation panel text'
      />
    )
    const $ = cheerio.load(markup.html())
    expect($('.govuk-body').text()).toContain('')
  })
})
