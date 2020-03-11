import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { StatementsPage } from './views';

describe(StatementsPage, () => {
  const item = {
    resourceGUID: 'resource-guid',
    resourceName: 'resource-name',
    resourceType: 'resource-type',
    orgGUID: 'org-guid',
    spaceGUID: 'space-guid',
    spaceName: undefined,
    planGUID: 'plan-guid',
    planName: 'plan-name',
    price: {
      incVAT: 330.14,
      exVAT: 275.11,
    },
  };

  it('should parse statements page', () => {
    const markup = shallow(
      <StatementsPage
        spaces={[{ guid: 'SPACE_GUID', name: 'space name' }]}
        plans={[{ guid: 'PLAN_GUID', name: 'plan name' }]}
        currentMonth="January"
        adminFee={0.1}
        totals={{
          exVAT: 275.11,
          incVAT: 330.14,
        }}
        usdCurrencyRates={[{ validFrom: '2020-01-24', rate: 0.8 }]}
        listOfPastYearMonths={{ 20200101: 'January 2020' }}
        isCurrentMonth={true}
        csrf="qwert"
        filterMonth="2020-01-01"
        filterService={{ guid: 'service-guid', name: 'service-name' }}
        filterSpace={{ guid: 'space-guid', name: 'space-name' }}
        orderBy="name"
        orderDirection="asc"
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        items={[
          {
            resourceGUID: 'resource-guid',
            resourceName: 'resource-name',
            resourceType: 'resource-type',
            orgGUID: 'org-guid',
            spaceGUID: 'space-guid',
            spaceName: 'space-name',
            planGUID: 'plan-guid',
            planName: 'plan-name',
            price: {
              incVAT: 330.14,
              exVAT: 275.11,
            },
          },
          item,
        ]}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('#rangeStart option').length).toEqual(1);
    expect($('#rangeStart option').text()).toContain('January 2020');
    expect($('#space option').length).toEqual(1);
    expect($('#space option').text()).toContain('space name');
    expect($('#service option').length).toEqual(1);
    expect($('#service option').text()).toContain('plan name');
    expect($('input[name="_csrf"]').prop('value')).toEqual('qwert');
    expect($('input[name="sort"]').prop('value')).toEqual('name');
    expect($('input[name="order"]').prop('value')).toEqual('asc');
    expect($('th').text()).toContain(
      'Total cost for January in space-name space with service-name services',
    );
    expect($('th').text()).toContain('£302.62');
    expect($('th').text()).toContain('£363.15');
    expect($('td').text()).toContain('£27.51');
    expect($('td').text()).toContain('£33.01');
    expect($('tr').text()).toContain('Exchange rate: £1 to $1.25');
  });

  it('should parse statements page when ordering by space', () => {
    const markup = shallow(
      <StatementsPage
        spaces={[{ guid: 'SPACE_GUID', name: 'space name' }]}
        plans={[{ guid: 'PLAN_GUID', name: 'plan name' }]}
        currentMonth="January"
        adminFee={0.1}
        totals={{
          exVAT: 275.11,
          incVAT: 330.14,
        }}
        usdCurrencyRates={[{ validFrom: '2020-01-24', rate: 0.8 }]}
        listOfPastYearMonths={{ 20200101: 'January 2020' }}
        isCurrentMonth={true}
        csrf="qwert"
        filterMonth="2020-01-01"
        filterService={{ guid: 'service-guid', name: 'service-name' }}
        filterSpace={{ guid: 'space-guid', name: 'space-name' }}
        orderBy="space"
        orderDirection="desc"
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        items={[item]}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('input[name="sort"]').prop('value')).toEqual('space');
    expect($('input[name="order"]').prop('value')).toEqual('desc');
  });

  it('should parse statements page when ordering by amount', () => {
    const markup = shallow(
      <StatementsPage
        spaces={[{ guid: 'SPACE_GUID', name: 'space name' }]}
        plans={[{ guid: 'PLAN_GUID', name: 'plan name' }]}
        currentMonth="January"
        adminFee={0.1}
        totals={{
          exVAT: 275.11,
          incVAT: 330.14,
        }}
        usdCurrencyRates={[{ validFrom: '2020-01-24', rate: 0.8 }]}
        listOfPastYearMonths={{ 20200101: 'January 2020' }}
        isCurrentMonth={true}
        csrf="qwert"
        filterMonth="2020-01-01"
        filterService={{ guid: 'service-guid', name: 'service-name' }}
        filterSpace={{ guid: 'space-guid', name: 'space-name' }}
        orderBy="amount"
        orderDirection="desc"
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        items={[item]}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('input[name="sort"]').prop('value')).toEqual('amount');
    expect($('input[name="order"]').prop('value')).toEqual('desc');
  });

  it('should parse statements page when ordering by plan', () => {
    const markup = shallow(
      <StatementsPage
        spaces={[{ guid: 'SPACE_GUID', name: 'space name' }]}
        plans={[{ guid: 'PLAN_GUID', name: 'plan name' }]}
        currentMonth="January"
        adminFee={0.1}
        totals={{
          exVAT: 275.11,
          incVAT: 330.14,
        }}
        usdCurrencyRates={[{ validFrom: '2020-01-24', rate: 0.8 }]}
        listOfPastYearMonths={{ 20200101: 'January 2020' }}
        isCurrentMonth={true}
        csrf="qwert"
        filterMonth="2020-01-01"
        orderBy="plan"
        orderDirection="desc"
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        items={[item]}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('input[name="sort"]').prop('value')).toEqual('plan');
    expect($('input[name="order"]').prop('value')).toEqual('desc');
  });

  it('should parse statements page and notify tenant that there\'s no information for this month', () => {
    const markup = shallow(
      <StatementsPage
        spaces={[{ guid: 'SPACE_GUID', name: 'space name' }]}
        plans={[{ guid: 'PLAN_GUID', name: 'plan name' }]}
        currentMonth="January"
        adminFee={0.1}
        totals={{
          exVAT: 275.11,
          incVAT: 330.14,
        }}
        usdCurrencyRates={[{ validFrom: '2020-01-24', rate: 0.8 }]}
        listOfPastYearMonths={{ 20200101: 'January 2020' }}
        isCurrentMonth={true}
        csrf="qwert"
        filterMonth="2020-01-01"
        filterService={{ guid: 'service-guid', name: 'service-name' }}
        filterSpace={{ guid: 'space-guid', name: 'space-name' }}
        orderBy="plan"
        orderDirection="desc"
        linkTo={route => `__LINKS_TO__${route}`}
        organizationGUID="ORG_GUID"
        items={[]}
      />,
    );
    const $ = cheerio.load(markup.html());
    expect($('.paas-table-notification').text()).toEqual(
      'There is no record of any usage for that period.',
    );
  });
});
