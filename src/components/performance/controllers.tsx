import axios from 'axios';
import moment from 'moment';
import React from 'react';

import { Template } from '../../layouts';
import { IMetric, IMetricSerie } from '../../lib/metrics';
import { IParameters, IResponse, NotFoundError } from '../../lib/router';
import { IContext } from '../app';

import { IScrapedData, period } from './scraper';
import { MetricPage } from './views';

function extractData(data: ReadonlyArray<IMetricSerie> | undefined): ReadonlyArray<ReadonlyArray<string>> {
  const defaultData: ReadonlyArray<{ readonly metrics: ReadonlyArray<IMetric>}> = [{ metrics: [] }];
  const metrics = (data || defaultData)[0].metrics;

  return metrics.map(metric => [
    moment(metric.date).format('YYYY-MM-DD[T]HH:mm'),
    metric.value.toString(),
  ]);
}

function extractOrgData(data: ReadonlyArray<IMetricSerie> | undefined): ReadonlyArray<ReadonlyArray<string>> {
  const defaultData: ReadonlyArray<{ readonly metrics: ReadonlyArray<IMetric>}> = [{ metrics: [] }, { metrics: [] }];
  const billable = (data || defaultData)[0].metrics;
  const trial = (data || defaultData)[1].metrics;

  return billable.map((metric, index) => [
    moment(metric.date).format('YYYY-MM-DD[T]HH:mm'),
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
  const { applications, organizations, services } = metrics.data;

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
