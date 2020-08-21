import { shallow } from 'enzyme';
import moment from 'moment';
import React from 'react';

import { DATE_TIME } from '../../layouts';
import { IOrganization, IOrganizationUserRoles } from '../../lib/cf/types';
import { IParameters } from '../../lib/router';
import { IUaaUser } from '../../lib/uaa';

import { ConfirmAction, CreateAPIToken, ExposeSecret, ListTokens } from './views';

const linker = (route: string, params?: IParameters): string =>
  `__LINKS_TO_${route}_WITH_${new URLSearchParams(params)}`;

const organization = {
  entity: { name: 'org-name' },
  metadata: { guid: '__ORG_GUID__' },
} as IOrganization;

describe(ListTokens, () => {
  const token = {
    entity: { username: 'token-name' },
    metadata: { created_at: '2020-01-01T12:00:00', guid: '__TOKEN_GUID__' },
  } as IOrganizationUserRoles;

  it('should correctly parse the element', () => {
    const markup = shallow(<ListTokens
      linkTo={linker}
      organization={organization}
      tokens={[ token ]}
    />);

    expect(markup.find('a').first().text()).toEqual('Create a new API Token');
    expect(markup.render().find('tr').last().find('th').text()).toContain(token.entity.username);
    expect(markup.render().find('tr td').text()).toContain('Not retreivable');
    expect(markup.render().find('tr td').text()).toContain(moment(token.metadata.created_at).format(DATE_TIME));
    expect(markup.render().find('tr td').text()).toContain('Revoke');
  });
});

describe(ExposeSecret, () => {
  it('should correctly parse the element', () => {
    const markup = shallow(<ExposeSecret
      linkTo={linker}
      organization={organization}
      tokenKey="__API_TOKEN_KEY__"
      tokenSecret="__API_TOKEN_SECRET__"
      userGUID="__USER_GUID__"
    />);

    expect(markup.find('dl div').at(0).find('dd code').text()).toEqual('__API_TOKEN_KEY__');
    expect(markup.find('dl div').at(0).find('dd code').text()).toEqual('__API_TOKEN_KEY__');
    expect(markup.find('a').at(0).text()).toEqual('Manage token permissions');
  });
});

describe(ConfirmAction, () => {
  const token = { userName: 'token-name' } as IUaaUser;
  it('should correctly parse the element', () => {
    const markup = shallow(<ConfirmAction
      action="revoke"
      csrf="__CSRF_TOKEN__"
      linkTo={linker}
      organization={organization}
      token={token}
    />);

    expect(markup.render().find('input[name=_csrf]').prop('value')).toEqual('__CSRF_TOKEN__');
    expect(markup.find('h2').text()).toEqual('Are you sure you\'d like to revoke the following API Token?');
    expect(markup.find('form button').text()).toEqual('Yes, revoke API Token');
  });
});

describe(CreateAPIToken, () => {
  it('should correctly parse the element', () => {
    const markup = shallow(<CreateAPIToken
      csrf="__CSRF_TOKEN__"
      organization={organization}
    />);

    expect(markup.html()).not.toContain('error');
    expect(markup.render().find('input[name=_csrf]').prop('value')).toEqual('__CSRF_TOKEN__');
  });

  it('should correctly parse the element when there are errors', () => {
    const markup = shallow(<CreateAPIToken
      csrf="__CSRF_TOKEN__"
      error={true}
      organization={organization}
      values={{ name: '<script>alert("pwnd");</script>' }}
    />);

    expect(markup.html()).toContain('error');
    expect(markup.render().find('input[name=_csrf]').prop('value')).toEqual('__CSRF_TOKEN__');
    expect(markup.render().find('.govuk-error-message').text()).toEqual(
      'Error: API Token name needs to be a combination of lowercase alphanumeric characters separated by hyphen.',
    );
  });
});
