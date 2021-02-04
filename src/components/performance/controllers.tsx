import moment from 'moment';
import React from 'react';

import { Template } from '../../layouts';
import { IMetric, IMetricSerie } from '../../lib/metrics';
import PromClient from '../../lib/prom';
import { IParameters, IResponse, NotFoundError } from '../../lib/router';
import { IContext } from '../app';

import { MetricPage } from './views';

const queries = {
  applicationCount: `sum (group by (organization_name,space_name,application_name) (
    cf_application_info{organization_name!~"(AIVENBACC|BACC|ACC|ASATS|SMOKE).*",state="STARTED"}
  ))`,
  organizations: `sum by (type) (label_replace(
    label_replace(
      cf_organization_info{organization_name!~"(AIVENBACC|BACC|ACC|ASATS|SMOKE).*"},
      "type", "billable", "quota_name", "(gds-non-chargeable|small|medium|large|xlarge|2xlarge|4xlarge|8xlarge)"
    ),
    "type", "trial", "quota_name", "default"
  ))`,
  serviceCount: 'sum (cf_service_instance_info{last_operation_type=~"create|update"})',
};

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

function timeRangeConfig(): { readonly yearAgo: Date, readonly now: Date, readonly period: moment.Duration } {
  return {
    now: moment().subtract(1, 'hour').toDate(),
    period: moment.duration(1, 'week'),
    yearAgo: moment().subtract(1, 'year').toDate(),
  };
}

export async function viewDashboard(ctx: IContext, _params: IParameters): Promise<IResponse> {
  const prometheus = new PromClient(
    ctx.app.platformPrometheusEndpoint,
    ctx.app.platformPrometheusUsername,
    ctx.app.platformPrometheusPassword,
    ctx.log,
  );

  const { yearAgo, now, period } = timeRangeConfig();

  const [ organizations, applicationCount, serviceCount ] = await Promise.all([
    prometheus.getSeries(queries.organizations, period.asSeconds(), yearAgo, now),
    prometheus.getSeries(queries.applicationCount, period.asSeconds(), yearAgo, now),
    prometheus.getSeries(queries.serviceCount, period.asSeconds(), yearAgo, now),
  ]);

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
        applicationCount={applicationCount}
        linkTo={ctx.linkTo}
        organizations={organizations}
        period={period}
        region={ctx.app.location}
        serviceCount={serviceCount}
      />,
    ),
  };
}

export async function downloadPerformanceData(ctx: IContext, params: IParameters): Promise<IResponse> {
  const prometheus = new PromClient(
    ctx.app.platformPrometheusEndpoint,
    ctx.app.platformPrometheusUsername,
    ctx.app.platformPrometheusPassword,
    ctx.log,
  );

  const csvData = [];
  const { yearAgo, now, period } = timeRangeConfig();

  switch (params.metric) {
    case 'mOrganizations':
      csvData.push(
        ['date', 'billable', 'trial'],
        ...extractOrgData(await prometheus.getSeries(queries.organizations, period.asSeconds(), yearAgo, now)),
      );
      break;
    case 'mApplicationCount':
      csvData.push(
        ['date', 'applications'],
        ...extractData(await prometheus.getSeries(queries.applicationCount, period.asSeconds(), yearAgo, now)),
      );
      break;
    case 'mServiceCount':
      csvData.push(
        ['date', 'services'],
        ...extractData(await prometheus.getSeries(queries.serviceCount, period.asSeconds(), yearAgo, now)),
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
