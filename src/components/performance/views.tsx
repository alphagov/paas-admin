import React, { ReactElement, ReactNode } from 'react';

import { IMetricSerie } from '../../lib/metrics';
import { RouteLinker } from '../app';
import { drawLineGraph } from '../charts/line-graph';
import { numberLabel } from '../service-metrics/metrics';
import { MetricChart, parseURL } from '../service-metrics/views';

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
  readonly children: ReactNode;
}

interface IMetricPageProperties {
  readonly applicationCount?: ReadonlyArray<IMetricSerie>;
  readonly linkTo: RouteLinker;
  readonly organizations?: ReadonlyArray<IMetricSerie>;
  readonly period: moment.Duration;
  readonly region: string;
  readonly serviceCount?: ReadonlyArray<IMetricSerie>;
}

export function latestValue(data: IMetricSerie): number {
  return data.metrics.reduce((value, m) => (!isNaN(m.value) ? m.value : value), 0);
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
      </div>

      {props.children}

      <div className="govuk-grid-column-full">
        <a href={downloadLink.toString()} className="govuk-link" download>
          Download &quot;{props.titleText || props.title}&quot; as a CSV
        </a>
      </div>
    </div>
  );
}

export function MetricPage(props: IMetricPageProperties): ReactElement {
  return (
    <div className="govuk-width-container">
      <div className="govuk-grid-row">
        <div className="govuk-grid-column-two-thirds-from-desktop">
          <h1 className="govuk-heading-xl">
            <span className="govuk-caption-xl">GOV.UK Platform as a Service</span> {}
            {props.region} performance dashboard
          </h1>
          <p className="govuk-body">
            GOV.UK PaaS is a shared platform that public sector service teams can use to quickly host their applications
            in the cloud.
          </p>

          <p className="govuk-body">
            Each point on the charts is aggregated data over {}
            <strong className="non-breaking">{props.period.humanize()}</strong>.
            Each chart shows 1 year of data.
          </p>

          <hr className="govuk-section-break govuk-section-break--m govuk-section-break--visible" />

          <div className="govuk-grid-row govuk-!-padding-bottom-9">
            <div className="govuk-grid-column-full">
              <h2 className="govuk-heading-m" id="uptime">
                Uptime
              </h2>
            </div>

            <div className="govuk-grid-column-full">
              <p className="govuk-body">
                Uptime is measured as the availability of the GOV.UK PaaS API.
              </p>
            </div>

            <div className="govuk-grid-column-one-half">
              <p className="govuk-body">
                <strong className="govuk-!-font-size-48">99.95%</strong><br />
                <small className="govuk-!-font-size-27">uptime in the {props.region} region over the last year</small>
              </p>
            </div>
          </div>

          {props.organizations
            ? <Metric
                id="organisations"
                format="number"
                title="Number of organisations"
                // eslint-disable-next-line max-len
                description="An organisation represents an account that can contain a group of users (team members), applications and environments. We have 2 types of organisation: 3 month trial accounts and billable accounts."
                chart={drawLineGraph(
                  'number of organisations',
                  'Number',
                  numberLabel,
                  [
                    { ...props.organizations[0], label: 'billable' },
                    { ...props.organizations[1], label: 'trial' },
                  ],
                )}
                units="number"
                metric="mOrganizations"
                downloadLink={props.linkTo('performance.download', { metric: 'mOrganizations' })}
              >
                <div className="govuk-grid-column-one-half">
                  <p className="govuk-body">
                    <strong className="govuk-!-font-size-48">{latestValue(props.organizations[0])}</strong><br />
                    <small className="govuk-!-font-size-27">number of billable organisations</small>
                  </p>
                </div>
                <div className="govuk-grid-column-one-half">
                  <p className="govuk-body">
                    <strong className="govuk-!-font-size-48">{latestValue(props.organizations[1])}</strong><br />
                    <small className="govuk-!-font-size-27">number of trial organisations</small>
                  </p>
                </div>
              </Metric>
            : <p className="govuk-body">The number of organisations chart is currently not available.</p> }

          {props.applicationCount
           ? <Metric
                id="applicationCount"
                format="number"
                title="Number of running applications"
                description={`The number of applications running in the ${props.region} region.`}
                chart={drawLineGraph(
                  'number of running applications',
                  'Number',
                  numberLabel,
                  props.applicationCount,
                )}
                units="number"
                metric="mApplicationCount"
                downloadLink={props.linkTo('performance.download', { metric: 'mApplicationCount' })}
              >
                <div className="govuk-grid-column-one-half">
                  <p className="govuk-body">
                    <strong className="govuk-!-font-size-48">{latestValue(props.applicationCount[0])}</strong><br />
                    <small className="govuk-!-font-size-27">currently running applications</small>
                  </p>
                </div>
              </Metric>
            : <p className="govuk-body">The number of running applications chart is currently not available.</p> }

          {props.serviceCount
            ? <Metric
                id="serviceCount"
                format="number"
                title="Number of backing services"
                // eslint-disable-next-line max-len
                description={`Applications may rely on backing services such as databases, caching or a monitoring system. The number of backing services running in the ${props.region} region.`}
                chart={drawLineGraph(
                  'number of backing services',
                  'Number',
                  numberLabel,
                  props.serviceCount,
                )}
                units="number"
                metric="mServiceCount"
                downloadLink={props.linkTo('performance.download', { metric: 'mServiceCount' })}
              >
                <div className="govuk-grid-column-one-half">
                  <p className="govuk-body">
                    <strong className="govuk-!-font-size-48">{latestValue(props.serviceCount[0])}</strong><br />
                    <small className="govuk-!-font-size-27">current backing services</small>
                  </p>
                </div>
              </Metric>
            : <p className="govuk-body">The number of backing services chart is currently not available.</p> }
        </div>
      </div>
    </div>
  );
}
