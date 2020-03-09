import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import moment from 'moment';
import React from 'react';

import { DATE_TIME } from '../../layouts';
import { IUserSummaryOrganization } from '../../lib/cf/types';
import { IUaaGroup } from '../../lib/uaa';

import { UserPage } from './views';

function linker(_route: string, params: any): string {
  return params?.organizationGUID
    ? `/user/${params.organizationGUID}`
    : '/test';
}

describe(UserPage, () => {
  const orgA = ({
    metadata: { guid: 'a' },
    entity: { name: 'A' },
  } as unknown) as IUserSummaryOrganization;
  const orgB = ({
    metadata: { guid: 'b' },
    entity: { name: 'B' },
  } as unknown) as IUserSummaryOrganization;
  const orgC = ({
    metadata: { guid: 'c' },
    entity: { name: 'C' },
  } as unknown) as IUserSummaryOrganization;
  const group = ({ display: 'profile' } as unknown) as IUaaGroup;
  const user = {
    uuid: 'ACCOUNTS-USER-GUID',
    username: 'jeff0',
    email: 'jeff@jefferson.com',
  };
  const logon = new Date(2020, 1, 1);

  it('should display list of organizations', () => {
    const markup = shallow(
      <UserPage
        organizations={[orgA, orgB, orgC]}
        managedOrganizations={[orgA]}
        groups={[group]}
        lastLogon={logon}
        linkTo={linker}
        user={user}
        origin="google"
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('dd').text()).toContain(moment(logon).format(DATE_TIME));
    expect($('p').text()).toContain('This user is a member of 3 orgs.');
    expect($('p').text()).toContain('This user manages 1 org.');
    expect($('ul:last-of-type li')).toHaveLength(1);
  });

  it('should display list of organizations', () => {
    const markup = shallow(
      <UserPage
        organizations={[orgB]}
        managedOrganizations={[orgA, orgC]}
        groups={[group]}
        lastLogon={logon}
        linkTo={linker}
        user={user}
        origin="google"
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('p').text()).toContain('This user is a member of 1 org.');
    expect($('p').text()).toContain('This user manages 2 orgs.');
  });
});
