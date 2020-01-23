import { forIn } from 'lodash';
import moment from 'moment';
import React, { ReactElement, ReactNode } from 'react';

import { bytesToHuman, DATE_TIME } from '../../layouts';
import { IServiceInstance } from '../../lib/cf/types';
import { IMetricSerieSummary } from '../../lib/metrics';
import { RouteActiveChecker, RouteLinker } from '../app';
import { ServiceTab } from '../services/views';

interface ISummaryRowProperties {
  readonly format?: string;
  readonly title: string;
  readonly property: 'average' | 'latest' | 'min' | 'max';
  readonly instances: ReadonlyArray<IMetricSerieSummary>;
}

interface IMetricChartProperties {
  readonly chart: string;
}

export interface IMetricProperties {
  readonly id: string;
  readonly downloadLink: string;
  readonly metric: string;
  readonly units: string;
  readonly format?: string;
  readonly title: ReactNode;
  readonly description: ReactNode;
  readonly chart: SVGElement;
  readonly summaries: ReadonlyArray<IMetricSerieSummary>;
}

interface IRangePickerProperties {
  readonly csrf: string;
  readonly organizationGUID: string;
  readonly spaceGUID: string;
  readonly rangeStart: Date;
  readonly rangeStop: Date;
  readonly linkTo: RouteLinker;
  readonly service: IServiceInstance;
  readonly period: moment.Duration;
}

interface IPageProperties {
  readonly organizationGUID: string;
  readonly spaceGUID: string;
  readonly linkTo: RouteLinker;
  readonly routePartOf: RouteActiveChecker;
  readonly service: IServiceInstance;
}

interface IMetricPageProperties extends IPageProperties {
  readonly csrf: string;
  readonly rangeStart: Date;
  readonly rangeStop: Date;
  readonly serviceLabel: string;
  readonly period: moment.Duration;
  readonly metrics: ReadonlyArray<IMetricProperties>;
}

function formatValue(value: number, format?: string): ReactNode {
  switch (format) {
    case 'bytes':
      return bytesToHuman(value);
    case 'percentile':
      return `${value.toFixed(2)}%`;
    default:
      return value.toFixed(2);
  }
}

function parseURL(path: string, params: object): string {
  const u = new URL(`https://example.com/${path}`);
  forIn(params, (value, key) => {
    u.searchParams.set(key, value);
  });

  return `${u.pathname}${u.search}`;
}

class MetricChart extends React.Component {
  constructor(public props: IMetricChartProperties) {
    super(props);
  }

  public render(): ReactElement {
    return this.MetricChartGraph();
  }

  private MetricChartGraph(): ReactElement {
    return (
      <div dangerouslySetInnerHTML={{__html: this.props.chart as unknown as string}}></div>
    );
  }
}

function SummaryRow(props: ISummaryRowProperties): ReactElement {
  return (
    <tr className="govuk-table__row">
      <th scope="row" className="govuk-table__header">
        <small>{props.title}</small>
      </th>
      {props.instances.map(series => (
        <td key={series.label} className="govuk-table__cell govuk-table__cell--numeric">
          <small>{formatValue(series[props.property], props.format)}</small>
        </td>
      ))}
    </tr>
  );
}

function Metric(props: IMetricProperties): ReactElement {
  const downloadLink = parseURL(props.downloadLink, { metric: props.metric, units: props.units });

  return (
    <div className="govuk-grid-row govuk-!-padding-bottom-9">
      <div className="govuk-grid-column-full">
        <h3 className="govuk-heading-m" id={props.id}>
          {props.title}
        </h3>
      </div>

      <div className="govuk-grid-column-two-thirds-from-desktop">
          <p className="govuk-body">{props.description}</p>

          <MetricChart chart={props.chart.outerHTML} />

          <a href={downloadLink.toString()} className="govuk-link">Download as a CSV</a>
      </div>
      <div className="govuk-grid-column-one-third-from-desktop">
        <table className="govuk-table">
          <caption className="govuk-table__caption govuk-visually-hidden">Summary</caption>
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th scope="col" className={`govuk-table__header ${props.summaries.length === 1 ? 'govuk-visually-hidden' : ''}`}><small>Instance</small></th>
              {props.summaries.map(series => (
                <th key={series.label} scope="col" className={`govuk-table__header govuk-table__header--numeric ${props.summaries.length === 1 ? 'govuk-visually-hidden' : ''}`}>
                  <small>{series.label}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            <SummaryRow title="Latest" property="latest" format={props.format} instances={props.summaries} />
            <SummaryRow title="Average" property="average" format={props.format} instances={props.summaries} />
            <SummaryRow title="Min" property="min" format={props.format} instances={props.summaries} />
            <SummaryRow title="Max" property="max" format={props.format} instances={props.summaries} />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RangePicker(props: IRangePickerProperties): ReactElement {
  return (
    <div className="paas-statement-filters">
      <p className="govuk-body">
        Showing metrics for <a href={props.linkTo('admin.organizations.spaces.services.view', {
          organizationGUID: props.organizationGUID,
          spaceGUID: props.spaceGUID,
          serviceGUID: props.service.metadata.guid,
        })} className="govuk-link non-breaking">{props.service.entity.name}</a> between <br />
        <strong>{moment(props.rangeStart).format(DATE_TIME)}</strong>
        <br /> and <br />
        <strong>{moment(props.rangeStop).format(DATE_TIME)}</strong>
      </p>

      <p className="govuk-body">
        Each point is an average over <strong className="non-breaking">{props.period.humanize()}</strong>.
      </p>

      <details className="govuk-details" data-module="govuk-details">
        <summary className="govuk-details__summary">
          <span className="govuk-details__summary-text">
            Change time period
          </span>
        </summary>

        <ol className="govuk-list">
          {[
            { short: '1h', long: '1 hour' },
            { short: '3h', long: '3 hours' },
            { short: '12h', long: '12 hours' },
            { short: '24h', long: '24 hours' },
            { short: '7d', long: '7 days' },
            { short: '30d', long: '30 days' },
          ].map(last => (
            <li key={last.short}>
              <a href={props.linkTo('admin.organizations.spaces.services.metrics.redirect', {
                organizationGUID: props.organizationGUID,
                spaceGUID: props.spaceGUID,
                serviceGUID: props.service.metadata.guid,
                offset: last.short,
              })} className="govuk-link" title={`last ${last.long}`}>Last {last.long}</a>
            </li>
          ))}
        </ol>

        <form method="get"
          action={props.linkTo('admin.organizations.spaces.services.metrics.view', {
            organizationGUID: props.organizationGUID,
            spaceGUID: props.spaceGUID,
            serviceGUID: props.service.metadata.guid,
          })}>
          <input type="hidden" name="_csrf" value={props.csrf} />

          <h3 className="govuk-heading-s">Or provide custom date</h3>
          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="rangeStart">Start time</label>
            <input type="datetime-local"
              id="rangeStart"
              name="rangeStart"
              className="govuk-input"
              defaultValue={moment(props.rangeStart).format('YYYY-MM-DD[T]HH:mm')} />
          </div>

          <div className="govuk-form-group">
            <label className="govuk-label" htmlFor="rangeStop">End time</label>
            <input type="datetime-local"
              id="rangeStop"
              name="rangeStop"
              className="govuk-input"
              defaultValue={moment(props.rangeStop).format('YYYY-MM-DD[T]HH:mm')} />
          </div>

          <button className="govuk-button" data-module="govuk-button" data-prevent-double-click={true}>
            Update
          </button>
        </form>
      </details>
    </div>
  );
}

function ExperimentalWarning(): ReactElement {
  return (
    <div className="border-bottom-box">
      <p className="govuk-body">
        <strong className="govuk-tag">
          experimental
        </strong>
      </p>

      <p className="govuk-body">
        Backing service metrics is a new feature under active development. Expect frequent changes.
      </p>

      <p className="govuk-body">
        Please email us at
        {' '}
        <a href="mailto:gov-uk-paas-support@digital.cabinet-office.gov.uk" className="govuk-link">
          gov-uk-paas-support@digital.cabinet-office.gov.uk
        </a>
        {' '}
        if you have any feedback.
      </p>
    </div>
  );
}

export function UnsupportedServiceMetricsPage(props: IPageProperties): ReactElement {
  return (
    <ServiceTab {...props}>
      <ExperimentalWarning />

      <p>Metrics are not available for this service yet.</p>
    </ServiceTab>
  );
}

export function MetricPage(props: IMetricPageProperties): ReactElement {
  return (
    <ServiceTab {...props}>
      <ExperimentalWarning />

      <div className="govuk-width-container">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds-from-desktop">
            <p>Currently the available metrics for {props.serviceLabel} are:</p>
            <ul className="govuk-list">
              {props.metrics.map(metric => (
                <li key={metric.id}>
                  <a href={`#${metric.id}`} className="govuk-link">{metric.title}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="govuk-grid-column-one-third-from-desktop">
            <RangePicker
              organizationGUID={props.organizationGUID}
              spaceGUID={props.spaceGUID}
              csrf={props.csrf}
              rangeStart={props.rangeStart}
              rangeStop={props.rangeStop}
              period={props.period}
              linkTo={props.linkTo}
              service={props.service}
            />
          </div>
        </div>
      </div>

      <div className="govuk-width-container">
        {props.metrics.map(metric => (
          <Metric
            key={metric.id}
            id={metric.id}
            format={metric.format}
            title={metric.title}
            description={metric.description}
            chart={metric.chart}
            units={metric.units}
            metric={metric.metric}
            summaries={metric.summaries}
            downloadLink={metric.downloadLink}
          />
        ))}
      </div>
    </ServiceTab>
  );
}
