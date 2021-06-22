import axios from 'axios';
import { formatISO } from 'date-fns';
import React from 'react';

import { Template } from '../../layouts';
import { IMetric, IMetricSerie } from '../../lib/metrics';
import { IParameters, IResponse, NotFoundError } from '../../lib/router';
import { IContext } from '../app';

import { IScrapedData, period } from './scraper';
import { MetricPage } from './views';

export function formatDate(input:Date, options?: Record<string, unknown>): string {
  const opts = typeof options === 'undefined' ? { month: 'long', year: 'numeric' } : options;

  return new Intl.DateTimeFormat('en-GB', opts).format(new Date(input));
}

function extractData(data: ReadonlyArray<IMetricSerie> | undefined): ReadonlyArray<ReadonlyArray<string>> {
  const defaultData: ReadonlyArray<{ readonly metrics: ReadonlyArray<IMetric>}> = [{ metrics: [] }];
  const metrics = (data || defaultData)[0].metrics;

  return metrics.map(metric => [
    formatISO(new Date(metric.date)),
    metric.value.toString(),
  ]);
}

export function exportMaxPerMonthDataValues(data: IMetricSerie): ReadonlyArray<IMetric> {
  const metrics = data.metrics;

return [...metrics.concat() // so that we con't modify the original array
    // 1. sort by value property so we get highest entry in each month to the highest index in array
    .sort((a, b) => b.value - a.value)
    // 2. remove any duplicates for given month, as we've already brought the needed values to the top of array
    // we're using actual month+year name as values are weekly in datetiem format
    .reduce((acc: ReadonlyArray<IMetric>, current: IMetric) => {
      const entry = acc.find((item: IMetric) => formatDate(item.date) === formatDate(current.date));
      // filter out current month
      const currentMonth = formatDate(new Date());

      return (!entry && formatDate(current.date) !== currentMonth) ? acc.concat([current]) : acc;
    }, [])]
    // 3. once we only have one entry per month, let's sort the months back to ascending order
    .sort((a: IMetric, b: IMetric) => a.date.getTime() - b.date.getTime());
}

interface ICombinedMetrics {
  readonly billable: number;
  readonly date: string;
  readonly trial: number;
}

export function combineMetrics(array1: IMetricSerie, array2: IMetricSerie): ReadonlyArray<ICombinedMetrics> {
  const filteredArray1 = [...exportMaxPerMonthDataValues(array1)];
  const filteredArray2 = [...exportMaxPerMonthDataValues(array2)];
  // as we've already picked out the max value for each month, we're not concerned about individual datetime stamps -
  // both of them belong to the same month
  const combinedArray = filteredArray1.map((metric, index) => ({
    billable: metric.value,
    date: formatDate(metric.date),
    trial: filteredArray2[index].value,
  }));

  return combinedArray;
}

function extractOrgData(data: ReadonlyArray<IMetricSerie> | undefined): ReadonlyArray<ReadonlyArray<string>> {
  const defaultData: ReadonlyArray<{ readonly metrics: ReadonlyArray<IMetric>}> = [{ metrics: [] }, { metrics: [] }];
  const billable = (data || defaultData)[0].metrics;
  const trial = (data || defaultData)[1].metrics;

  return billable.map((metric, index) => [
    formatISO(new Date(metric.date)),
    metric.value.toString(),
    trial[index].value.toString(),
  ]);
}

function objectifyMetrics(data: ReadonlyArray<IMetricSerie> | undefined): ReadonlyArray<IMetricSerie> | undefined {
  return data ? data.map(serie => ({
    label: serie.label,
    metrics: serie.metrics.map(metric => ({ date: new Date(metric.date), value: metric.value })),
  })) : undefined;
}

export async function viewDashboard(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const metrics = await axios.get<IScrapedData>(`${ctx.app.platformMetricsEndpoint}/metrics.json`);
  const { applications, organizations, services, uptime } = metrics.data;

  const template = new Template(ctx.viewContext, 'GOV.UK Platform as a Service Performance dashboard');
  template.breadcrumbs = [
    {
      href: 'https://www.gov.uk/service-toolkit#gov-uk-services',
      text: 'GOV.UK services',
    },
    {
      href: 'https://www.cloud.service.gov.uk/',
      text: 'GOV.UK PaaS',
    },
    { text: 'Performance dashboard' },
  ];

  return {
    body: template.render(
      <MetricPage
        applicationCount={objectifyMetrics(applications)}
        linkTo={ctx.linkTo}
        organizations={objectifyMetrics(organizations)}
        period={period}
        region={ctx.app.location}
        serviceCount={objectifyMetrics(services)}
        uptime={uptime}
      />,
    ),
  };
}

export async function downloadPerformanceData(ctx: IContext, params: IParameters): Promise<IResponse> {
  const metrics = await axios.get<IScrapedData>(`${ctx.app.platformMetricsEndpoint}/metrics.json`);
  const { applications, organizations, services } = metrics.data;

  const csvData = [];

  switch (params.metric) {
    case 'mOrganizations':
      csvData.push(
        ['date', 'billable', 'trial'],
        ...extractOrgData(organizations),
      );
      break;
    case 'mApplicationCount':
      csvData.push(
        ['date', 'applications'],
        ...extractData(applications),
      );
      break;
    case 'mServiceCount':
      csvData.push(
        ['date', 'services'],
        ...extractData(services),
      );
      break;
    default:
      throw new NotFoundError('Performance metric not recognised');
  }

  return {
    download: {
      data: csvData.map(line => line.join(',')).join('\n'),
      name: `govuk-paas-performance-${params.metric}.csv`,
    },
    mimeType: 'text/csv',
  };
}
