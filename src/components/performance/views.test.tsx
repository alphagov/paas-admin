import cheerio from 'cheerio';
import { shallow } from 'enzyme';
import React from 'react';

import { IMetricSerie } from '../../lib/metrics';

import { period } from './scraper';
import { latestValue, MetricPage } from './views';

describe(latestValue, () => {
  it('should resolve to the latest value', () => {
    expect(latestValue({ label: 'test', metrics: [] })).toEqual(0);
    expect(latestValue({ label: 'test', metrics: [ { date: new Date(), value: 1 } ] })).toEqual(1);
    expect(latestValue({ label: 'test', metrics: [
      { date: new Date(), value: 3 },
      { date: new Date(), value: 2 },
    ] })).toEqual(2);
    expect(latestValue({ label: 'test', metrics: [
      { date: new Date(), value: 2 },
      { date: new Date(), value: 'NaN' as any as number },
      { date: new Date(), value: 1 },
    ] })).toEqual(1);
  });
});

describe(MetricPage, () => {
  it('should render tables with service, application and org counts', () => {
    const applicationCount = {
      'label': 'applications',
      'metrics': [
        { 'date': new Date('2020-02-24T16:32:03.000Z'), 'value': 1420 },
        { 'date': new Date('2020-03-02T16:32:03.000Z'), 'value': 1430 },
        { 'date': new Date('2020-03-23T16:32:03.000Z'), 'value': 1425 },
      ],
    } as unknown as IMetricSerie;
    const serviceCount = {
      'label': 'services',
      'metrics': [
        { 'date': new Date('2020-02-24T16:32:03.000Z'), 'value': 420 },
        { 'date': new Date('2020-03-02T16:32:03.000Z'), 'value': 430 },
        { 'date': new Date('2020-03-23T16:32:03.000Z'), 'value': 425 },
      ],
    } as unknown as IMetricSerie;
    const orgs = [
        {
          'metrics': [
            { 'date': new Date('2020-02-24T16:32:03.000Z'), 'value': 20 },
            { 'date': new Date('2020-03-02T16:32:03.000Z'), 'value': 30 },
            { 'date': new Date('2020-03-23T16:32:03.000Z'), 'value': 25 },
          ],
        },
        {
          'metrics': [
            { 'date': new Date('2020-02-24T16:32:03.000Z'), 'value': 2 },
            { 'date': new Date('2020-03-02T16:32:03.000Z'), 'value': 3 },
            { 'date': new Date('2020-03-23T16:32:03.000Z'), 'value': 5 },
          ],
        },
      ] as unknown as ReadonlyArray<IMetricSerie>;
    const markup = shallow(
      <MetricPage
        linkTo={route => `__LINKS_TO__${route}`}
        period={period}
        region="London"
        uptime={99.99}
        serviceCount={[serviceCount]}
        applicationCount={[applicationCount]}
        organizations={orgs}
      />,
    );
    const $ = cheerio.load(markup.html());
    // org data spans 2 months
    expect($('.govuk-table').eq(0).find('tbody').children('tr')).toHaveLength(2);
    // org table has entries for both billable and trial orgs
    expect($('.govuk-table').eq(0).find('tbody td')).toHaveLength(4);
    // let's check first and last month entries for applications are as expected
    expect($('.govuk-table').eq(1).find('tbody th:first-child').text()).toContain('February 2020')
    expect($('.govuk-table').eq(1).find('tbody tr:nth-child(2) th:first-child').text()).toContain('March 2020');
    // let's check values for backing services in each month are as expected
    expect($('.govuk-table').eq(2).find('tbody tr td:last-child').text()).toContain('420');
    expect($('.govuk-table').eq(2).find('tbody tr:nth-child(2) td:last-child').text()).toContain('430');
  });
});
