import { forIn } from 'lodash';
import moment from 'moment';
import React, { ReactElement, ReactNode } from 'react';

import { bytesToHuman, DATE_TIME } from '../../layouts';
import { Abbreviation } from '../../layouts/helpers';
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
  readonly titleText?: string;
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
  readonly persistancePeriod?: string;
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
  readonly persistancePeriod?: string;
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

export function parseURL(path: string, params: object): string {
  const u = new URL(`https://example.com/${path.replace(/^\/+/, '')}`);
  forIn(params, (value, key) => {
    u.searchParams.set(key, value);
  });

  return `${u.pathname}${u.search}`;
}

class MetricChart extends React.Component {
  constructor(public readonly props: IMetricChartProperties) {
    super(props);
  }

  public render(): ReactElement {
    return this.MetricChartGraph();
  }

  private MetricChartGraph(): ReactElement {
    return (
      <div
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          // eslint-disable-next-line react/prop-types
          __html: (this.props.chart as unknown) as string,
        }}
      ></div>
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
        <td
          key={series.label}
          className="govuk-table__cell govuk-table__cell--numeric"
        >
          <small>{formatValue(series[props.property], props.format)}</small>
        </td>
      ))}
    </tr>
  );
}

function Metric(props: IMetricProperties): ReactElement {
  const downloadLink = parseURL(props.downloadLink, {
    metric: props.metric,
    units: props.units,
  });

  return (
    <div className="govuk-grid-row govuk-!-padding-bottom-9">
      <div className="govuk-grid-column-full">
        <h2 className="govuk-heading-m" id={props.id}>
          {props.title}
        </h2>
      </div>

      <div className="govuk-grid-column-full">
        <p className="govuk-body">{props.description}</p>

        <MetricChart chart={props.chart.outerHTML} />

        <div className="scrollable-table-container">
          <table className="govuk-table">
          <caption className="govuk-table__caption govuk-visually-hidden">
            Summary of &quot;{props.titleText || props.title}&quot; data
          </caption>
          <thead className="govuk-table__head">
            <tr className="govuk-table__row">
              <th
                scope="col"
                className={`govuk-table__header ${
                  props.summaries.length === 1 ? 'govuk-visually-hidden' : ''
                }`}
              >
                <small>Instance</small>
              </th>
              {props.summaries.map((series, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`govuk-table__header govuk-table__header--numeric ${
                    props.summaries.length === 1 ? 'govuk-visually-hidden' : ''
                  }`}
                >
                  <small>
                    {series.label.length > 3 ? (
                      <Abbreviation description={series.label}>{String(index).padStart(3, '0')}</Abbreviation>
                    ) : (
                      series.label
                    )}
                  </small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="govuk-table__body">
            <SummaryRow
              title="Latest"
              property="latest"
              format={props.format}
              instances={props.summaries}
            />
            <SummaryRow
              title="Average"
              property="average"
              format={props.format}
              instances={props.summaries}
            />
            <SummaryRow
              title="Min"
              property="min"
              format={props.format}
              instances={props.summaries}
            />
            <SummaryRow
              title="Max"
              property="max"
              format={props.format}
              instances={props.summaries}
            />
          </tbody>
        </table>
        </div>
        <a href={downloadLink.toString()} className="govuk-link" download>
          Download &quot;{props.titleText || props.title}&quot; as a CSV
        </a>
      </div>
    </div>
  );
}

function RangePicker(props: IRangePickerProperties): ReactElement {
  return (
    <div className="paas-statement-filters">
      <h2 className="govuk-heading-m">Change time period</h2>
      <h3 className="govuk-heading-s">Chose a predefined period</h3>
        <ol className="govuk-list">
          {[
            { long: '1 hour', short: '1h' },
            { long: '3 hours', short: '3h' },
            { long: '12 hours', short: '12h' },
            { long: '24 hours', short: '24h' },
            { long: '7 days', short: '7d' },
            { long: '30 days', short: '30d' },
          ].map(last => (
            <li key={last.short}>
              <a
                href={props.linkTo(
                  'admin.organizations.spaces.services.metrics.redirect',
                  {
                    offset: last.short,
                    organizationGUID: props.organizationGUID,
                    serviceGUID: props.service.metadata.guid,
                    spaceGUID: props.spaceGUID,
                  },
                )}
                className="govuk-link"
              >
                <span className="govuk-visually-hidden">Change time period to:</span> Last {last.long}
              </a>
            </li>
          ))}
        </ol>
        <form
          noValidate
          method="get"
          action={props.linkTo(
            'admin.organizations.spaces.services.metrics.view',
            {
              organizationGUID: props.organizationGUID,
              serviceGUID: props.service.metadata.guid,
              spaceGUID: props.spaceGUID,
            },
          )}
        >
          <input type="hidden" name="_csrf" value={props.csrf} />

          <h3 className="govuk-heading-s">Provide custom date and time <span className="govuk-visually-hidden">for showing metrics</span></h3>
          <div className="govuk-form-group">
            <fieldset className="govuk-fieldset" role="group" aria-describedby="range-start-date-hint">
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                Enter start date
              </legend>
              <div id="range-start-date-hint" className="govuk-hint">
                For example, 12 11 2007
              </div>
              <div className="govuk-date-input" id="range-start">
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStartDay">
                      Day
                    </label>
                    <input 
                      className="govuk-input govuk-date-input__input govuk-input--width-2" 
                      id="rangeStartDay"
                      name="rangeStart[day]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStart).format('DD')}
                    />
                  </div>
                </div>
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="startMonth">
                      Month
                    </label>
                    <input 
                      className="govuk-input govuk-date-input__input govuk-input--width-2" 
                      id="rangeStartMonth"
                      name="rangeStart[month]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStart).format('MM')}
                      />
                  </div>
                </div>
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStartYear">
                      Year
                    </label>
                    <input
                      className="govuk-input govuk-date-input__input govuk-input--width-4"
                      id="rangeStartYear"
                      name="rangeStart[year]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStart).format('YYYY')}
                      />
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          <div className="govuk-form-group">
            <fieldset className="govuk-fieldset" role="group" aria-describedby="range-start-time-hint">
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                Enter start time
              </legend>
              <div id="range-start-time-hint" className="govuk-hint">
                For example, 08:10
              </div>
              <div className="govuk-date-input" id="range-start-time">
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStartHour">
                      Hours
                    </label>
                    <input
                      className="govuk-input govuk-date-input__input govuk-input--width-2"
                      id="rangeStartHour"
                      name="rangeStart[hour]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStart).format('HH')}
                    />
                  </div>
                </div>
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStartMinute">
                      Minutes
                    </label>
                    <input 
                      className="govuk-input govuk-date-input__input govuk-input--width-2"
                      id="rangeStartMinute"
                      name="rangeStart[minute]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStart).format('mm')} 
                    />
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          
          <div className="govuk-form-group">
            <fieldset className="govuk-fieldset" role="group" aria-describedby="range-end-date-hint">
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                Enter end date
              </legend>
              <div id="range-end-date-hint" className="govuk-hint">
                For example, 12 11 2007
              </div>
              <div className="govuk-date-input" id="range-end-date">
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStopDay">
                      Day
                    </label>
                    <input
                      className="govuk-input govuk-date-input__input govuk-input--width-2"
                      id="rangeStopDay"
                      name="rangeStop[day]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStop).format('DD')}
                      />
                  </div>
                </div>
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStopMonth">
                      Month
                    </label>
                    <input
                    className="govuk-input govuk-date-input__input govuk-input--width-2"
                    id="rangeStopMonth"
                    name="rangeStop[month]"
                    type="text"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    defaultValue={moment(props.rangeStop).format('MM')}
                  />
                  </div>
                </div>
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStopYear">
                      Year
                    </label>
                    <input
                      className="govuk-input govuk-date-input__input govuk-input--width-4"
                      id="rangeStopYear"
                      name="rangeStop[year]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStop).format('YYYY')}
                    />
                  </div>
                </div>
              </div>
            </fieldset>
          </div>
          <div className="govuk-form-group">
            <fieldset className="govuk-fieldset" role="group" aria-describedby="range-end-time-hint">
              <legend className="govuk-fieldset__legend govuk-fieldset__legend--s">
                Enter end time
              </legend>
              <div id="range-end-time-hint" className="govuk-hint">
                For example, 16:10
              </div>
              <div className="govuk-date-input" id="range-end-time">
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                    <label className="govuk-label govuk-date-input__label" htmlFor="rangeStopHour">
                      Hours
                    </label>
                    <input
                      className="govuk-input govuk-date-input__input govuk-input--width-2"
                      id="rangeStopHour"
                      name="rangeStop[hour]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      defaultValue={moment(props.rangeStop).format('HH')}
                    />
                  </div>
                </div>
                <div className="govuk-date-input__item">
                  <div className="govuk-form-group">
                  <label className="govuk-label govuk-date-input__label" htmlFor="rangeStopMinute">
                      Minutes
                    </label>
                    <input
                      className="govuk-input govuk-date-input__input govuk-input--width-2"
                      id="rangeStopMinute"
                      name="rangeStop[minute]"
                      type="text"
                      pattern="[0-9]*"
                      inputMode="numeric" 
                      defaultValue={moment(props.rangeStop).format('mm')}
                      />
                    </div>
                </div>
              </div>
            </fieldset>
          </div>
          
          <button
            className="govuk-button"
            data-module="govuk-button"
            data-prevent-double-click={true}
          >
            Update
          </button>
        </form>
    </div>
  );
}

function ExperimentalWarning(): ReactElement {
  return (
    <div className="border-bottom-box">
      <p className="govuk-body">
        <strong className="govuk-tag">experimental</strong>
      </p>

      <p className="govuk-body">
        Backing service metrics is a new feature under active development.
        Expect frequent changes.
      </p>

      <p className="govuk-body">
        Please email us at{' '}
        <a
          href="mailto:gov-uk-paas-support@digital.cabinet-office.gov.uk"
          className="govuk-link"
        >
          gov-uk-paas-support@digital.cabinet-office.gov.uk
        </a>{' '}
        if you have any feedback.
      </p>
    </div>
  );
}

export function UnsupportedServiceMetricsPage(
  props: IPageProperties,
): ReactElement {
  return (
    <ServiceTab {...props} pageTitle="Metrics">
      <ExperimentalWarning />

      <p>Metrics are not available for this service yet.</p>
    </ServiceTab>
  );
}

export function MetricPage(props: IMetricPageProperties): ReactElement {
  return (
    <ServiceTab {...props} pageTitle="Metrics">

      <div className="govuk-width-container">
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-two-thirds-from-desktop">
            <ExperimentalWarning />
            <p className="govuk-body">
              Currently the available metrics for {props.serviceLabel} are:
            </p>
            <ul className="govuk-list">
              {props.metrics.map(metric => (
                <li key={metric.id}>
                  <a href={`#${metric.id}`} className="govuk-link">
                    {metric.title} <span className="govuk-visually-hidden">metric</span>
                  </a>
                </li>
              ))}
            </ul>
            <hr className="govuk-section-break govuk-section-break--m" />
            <p className="govuk-body">
              Showing metrics between{' '}
              <strong>{moment(props.rangeStart).format(DATE_TIME)}</strong>{' '}
              and{' '}
              <strong>{moment(props.rangeStop).format(DATE_TIME)}</strong>
            </p>

            <p className="govuk-body">
              Metrics timestamps are in UTC format.
            </p>

            <p className="govuk-body">
              Each point on a graph is aggregated over
              {' '}
              <strong className="non-breaking">{props.period.humanize()}</strong>
              {' '}
              of data.
            </p>

            {props.persistancePeriod ? (
              <p className="govuk-body">
                These metrics are retained for up to{' '}
                <strong>{props.persistancePeriod}</strong>. While metrics are
                experimental, we cannot guarantee a minimum metrics retention period.
              </p>
            ) : (
              <></>
            )}
            <hr className="govuk-section-break govuk-section-break--m" />

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
    </ServiceTab>
  );
}
