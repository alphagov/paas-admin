/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react';
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
    const { container } = render(
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
    expect(container.querySelectorAll('#rangeStart option')).toHaveLength(1);
    expect(container.querySelector('#rangeStart option')).toHaveTextContent('January 2020');
    expect(container.querySelectorAll('#space option')).toHaveLength(1);
    expect(container.querySelector('#space option')).toHaveTextContent('space name');
    expect(container.querySelectorAll('#service option')).toHaveLength(1);
    expect(container.querySelector('#service option')).toHaveTextContent('plan name');
    expect(container.querySelector('input[name="_csrf"]')).toHaveValue('qwert');
    expect(container.querySelector('input[name="sort"]')).toHaveValue('name');
    expect(container.querySelector('input[name="order"]')).toHaveValue('asc');
    expect(container.querySelector('.cost-summary-table tbody tr:first-child th')).toHaveTextContent(
      'Total cost for January in space-name space with service-name services',
    );
    expect(container.querySelectorAll('.cost-summary-table tbody tr:first-child td')[0]).toHaveTextContent('£302.62');
    expect(container.querySelectorAll('.cost-summary-table tbody tr:first-child td')[1]).toHaveTextContent('£363.15');
    expect(container.querySelectorAll('.cost-summary-table tbody tr:nth-child(2) td')[0]).toHaveTextContent('£27.51');
    expect(container.querySelectorAll('.cost-summary-table tbody tr:nth-child(2) td')[1]).toHaveTextContent('£33.01');
    expect(container.querySelector('.exchange-rate')).toHaveTextContent('Exchange rate: £1 to $1.25');
    expect(container.querySelector('.paas-table-billing-statement caption')).toHaveTextContent(
      'Cost itemisation for January in space-name space with service-name services sorted by name column in ascending order',
    );
    expect(container
          .querySelector('.paas-table-billing-statement th:first-child'))
          .toHaveAttribute('aria-sort', expect.stringContaining('ascending'));
  });

  it('should parse statements page when ordering by space', () => {
    const { container } = render(
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
    expect(container.querySelector('input[name="sort"]')).toHaveValue('space');
    expect(container.querySelector('input[name="order"]')).toHaveValue('desc');

    expect(container
      .querySelector('.paas-table-billing-statement caption'))
      .toHaveTextContent(
      'Cost itemisation for January in space-name space with service-name services sorted by space column in descending order',
    );
    expect(container
      .querySelector('.paas-table-billing-statement th:nth-child(2)'))
      .toHaveAttribute('aria-sort', expect.stringContaining('descending'));
  });

  it('should parse statements page when ordering by amount', () => {
    const { container } = render(
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
    expect(container.querySelector('input[name="sort"]')).toHaveValue('amount');
    expect(container.querySelector('input[name="order"]')).toHaveValue('desc');

    expect(container
      .querySelector('.paas-table-billing-statement caption'))
      .toHaveTextContent(
      'Cost itemisation for January in space-name space with service-name services sorted by Inc VAT column in descending order',
    );
    expect(container
      .querySelector('.paas-table-billing-statement th:nth-child(5)'))
      .toHaveAttribute('aria-sort', expect.stringContaining('descending'));
  });

  it('should parse statements page when ordering by plan', () => {
    const { container } = render(
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
    expect(container.querySelector('input[name="sort"]')).toHaveValue('plan');
    expect(container.querySelector('input[name="order"]')).toHaveValue('desc');
    expect(container
      .querySelector('.paas-table-billing-statement th:nth-child(3)'))
      .toHaveAttribute('aria-sort', expect.stringContaining('descending'));
  });

  it('should parse statements page and notify tenant that there\'s no information for this month', () => {
    const { container } = render(
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
    expect(container.querySelector('.paas-table-notification')).toHaveTextContent(
      'There is no record of any usage for that period.',
    );
  });

  describe('statement column header sort order', () => {
    it('where NAME column header should have an aria-sort="descending" label when sorted with "descending order"', () => {
      const { container} = render(
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
          orderDirection="desc"
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
      expect(container
        .querySelector('.paas-table-billing-statement th:first-child'))
        .toHaveAttribute('aria-sort', expect.stringContaining('descending'));
    });

    it('where SPACE column header should have an aria-sort="ascending" label when sorted with "ascending order"', () => {
      const { container } = render(
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
      expect(container
        .querySelector('.paas-table-billing-statement th:nth-child(2)'))
        .toHaveAttribute('aria-sort', expect.stringContaining('ascending'));
    })

    it('where PLAN column header should have an aria-sort="ascending" label when sorted with "ascending order"', () => {
      const { container } = render(
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
      expect(container
        .querySelector('.paas-table-billing-statement th:nth-child(3)'))
        .toHaveAttribute('aria-sort', expect.stringContaining('ascending'));
    })

    it('where Inc VAT column header should have an aria-sort="ascending" label when sorted with "ascending order"', () => {
      const { container } = render(
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
      expect(container
        .querySelector('.paas-table-billing-statement th:nth-child(5)'))
        .toHaveAttribute('aria-sort', expect.stringContaining('ascending'));
    })
  })
});
