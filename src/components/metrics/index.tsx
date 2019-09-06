// tslint:disable:max-classes-per-file
import { Line } from '@nivo/line';
import moment from 'moment-timezone';
import React, {Component} from 'react';

import {IApplication} from '../../lib/cf/types';
import { timeOffsets } from '../../lib/metrics';
import { IPrometheusValDatum } from '../../lib/prom';

const datetimeLocalFmt = 'YYYY-MM-DDTHH:mm';
const govukLightBlue = '#5694ca';
const govukBlue = '#1d70b8';
const govukDarkBlue = '#003078';
const govukOrange = '#f47738';
const govukRed = '#d4351c';

const http1xxColor = govukLightBlue;
const http2xxColor = govukBlue;
const http3xxColor = govukDarkBlue;
const http4xxColor = govukOrange;
const http5xxColor = govukRed;

const singleChartColor = govukBlue;
// tslint:disable:no-unused
const httpColorRange = [
http1xxColor, http2xxColor, http3xxColor,
http4xxColor, http5xxColor,
];
// tslint:enable:no-unused

export interface IDatePickerComponentProps {
  readonly instantTime: Date;
  readonly historicTime: Date;
  readonly isOpen: boolean;
}

export class DatePickerComponent extends Component<IDatePickerComponentProps, {}> {
  public render() {
    return <div>
      <p className="govuk-body">
        This is showing the <span>
          {this.timeDelta(this.props.historicTime, this.props.instantTime)}
        </span> between <span>
          {this.props.historicTime.toISOString()}
        </span> and <span>
          {this.props.instantTime.toISOString()}</span>.
      </p>

      <details className="govuk-details" open={this.props.isOpen}>
        <summary className="govuk-details__summary">
          <span className="govuk-details__summary-text">
            Choose a time range
          </span>
        </summary>

        <div className="govuk-details__text">
          <div className="govuk-grid-row">
            <div className="govuk-grid-column-one-half">
              <ul className="govuk-list">
                {Object.keys(timeOffsets).map(offset => {
                  return <li key={offset}><a href={`?nice-offset=${offset}&open=true`}
                       className="govuk-list">{offset.replace(/-/g, ' ')}</a></li>;
                })}
              </ul>
            </div>
            <div className="govuk-grid-column-one-half">
              <form>
                <div className="govuk-form-group">
                  <label className="govuk-label" htmlFor="start-time">Start time</label>
                  <input type="datetime-local"
                     id="start-time"
                     name="start-time"
                     className="govuk-input"
                     defaultValue={moment.tz(this.props.historicTime, 'Europe/London').format(datetimeLocalFmt)}/>
                </div>

                <div className="govuk-form-group">
                  <label className="govuk-label" htmlFor="end-time">End time</label>
                  <input type="datetime-local"
                     id="end-time"
                     name="end-time"
                     className="govuk-input"
                     defaultValue={moment.tz(this.props.instantTime, 'Europe/London').format(datetimeLocalFmt)}/> </div>

                <input type="hidden" name="open" defaultValue="true"/>

                <div className="govuk-form-group">
                  <button className="govuk-button">Filter</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </details>
    </div>;
  }

  private timeDelta(historicTime: Date, instantTime: Date): number {
    return instantTime.getTime() - historicTime.getTime();
  }
}

export type SingleStatValFormatter = (val: number) => string;

export interface ISingleStatComponentProps {
  readonly val: number;
}

export interface IHTTPReliabilitySingleStatComponentProps extends ISingleStatComponentProps {
  readonly interval: number;
  readonly intervalUnit: string;
}

export class HTTPReliabilitySingleStatComponent extends Component<IHTTPReliabilitySingleStatComponentProps, {}> {
  public render() {
    return <div>
      <h3 className="govuk-heading-m">Reliability</h3>

      <h2 className="govuk-heading-m">
        <span id="http-reliability-value">
          {this.props.val.toFixed(2)}
        </span>
        <span>%</span>
      </h2>

      <p className="govuk-body-s">
        Percentage of HTTP 1XX/2XX/3XX responses compared to all HTTP responses over the last
        <span> {this.props.interval}</span>
        <span> {this.props.intervalUnit}</span>
      </p>
    </div>;
  }
}

export interface IHTTPLatencySingleStatComponentProps extends ISingleStatComponentProps {
  readonly interval: number;
  readonly intervalUnit: string;
}

export class HTTPLatencySingleStatComponent extends Component<IHTTPLatencySingleStatComponentProps, {}> {
  public render() {
    return <div>
      <h3 className="govuk-heading-m">Mean latency</h3>

      <h2 className="govuk-heading-m">
        <span id="latency-value">
          {this.props.val.toFixed(2)}
        </span>
        <span>ms</span>
      </h2>

      <p className="govuk-body-s">
        Mean latency in milliseconds over the last
        <span> {this.props.interval}</span>
        <span> {this.props.intervalUnit}</span>
      </p>
    </div>;
  }
}

export interface INivoLinePoint {
  x: string | Date | number;
  y: number;
}

// tslint:disable:readonly-array
export interface INivoLineSerie {
  id: string;
  color: string;
  data: INivoLinePoint[];
}

export interface ISingleSeriesComponentProps {
  readonly data: ReadonlyArray<IPrometheusValDatum>;
}

export class SingleSeriesComponent extends Component<ISingleSeriesComponentProps, {}> {
  public render() {
    return <Line
      data={this.promToNivo(this.props.data)}
      width={440} height={200}
      margin={{
        top: 5, right: 5,
        bottom: 25, left: 25,
      }}
      xScale={{ type: 'time', format: '%Q', precision: 'minute' }}
      yScale={{ type: 'linear', stacked: false, min: 'auto', max: 'auto' }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        orient: 'bottom',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        format: '%y-%m-%d %H:%M',
        tickValues: 5,
      }}
      axisLeft={{
        orient: 'left',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        tickValues: 5,
      }}
      colors={singleChartColor}
      enablePoints={false}
      useMesh={true}
    />;
  }

  private promToNivo(promData: ReadonlyArray<IPrometheusValDatum>): INivoLineSerie[] {
    return [{
      id: 'serie',
      color: 'tomato',
      data: promData.map(datum => {
        return { x: datum.timestamp, y: datum.val };
      }),
    }];
  }
}
// tslint:enable:readonly-array

export interface IAppMetricsComponentProps {
  readonly application: IApplication;

  readonly datePickerProps: IDatePickerComponentProps;

  readonly httpReliabilitySingleStatProps: IHTTPReliabilitySingleStatComponentProps;
  readonly httpLatencySingleStatProps: IHTTPLatencySingleStatComponentProps;

  readonly httpCountAggregatedSeriesProps: ISingleSeriesComponentProps;
  readonly httpLatencyAggregatedSeriesProps: ISingleSeriesComponentProps;

  readonly cpuUsageAggregatedSeriesProps: ISingleSeriesComponentProps;
  readonly memoryUsageAggregatedSeriesProps: ISingleSeriesComponentProps;
  readonly diskUsageAggregatedSeriesProps: ISingleSeriesComponentProps;
}

export class AppMetricsComponent extends Component<IAppMetricsComponentProps, {}> {
  public render() {
    return <div>
      <script dangerouslySetInnerHTML={{
        __html: `window.PazminHydrate.AppMetricsComponentProps = ${
          JSON.stringify(this.props).replace(/</g, '\\u003c')
        }`,
      }}/>
      <DatePickerComponent {...this.props.datePickerProps}/>

      <h2 className="govuk-heading-m">Metrics</h2>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half" tabIndex={0}>
          <HTTPReliabilitySingleStatComponent {...this.props.httpReliabilitySingleStatProps}/>
        </div>

        <div className="govuk-grid-column-one-half" tabIndex={0}>
          <HTTPLatencySingleStatComponent {...this.props.httpLatencySingleStatProps}/>
        </div>
      </div>

      <div className="govuk-grid-row">
        <div className="govuk-grid-column-one-half" tabIndex={0}>
          <h3 className="govuk-heading-m">
            HTTP responses
          </h3>

          <SingleSeriesComponent {...this.props.httpCountAggregatedSeriesProps}/>

          <p className="govuk-body-s">
            The count of HTTP responses served by
            <code>{this.props.application.entity.name}</code>
            segmented by HTTP response code
          </p>
        </div>

        <div className="govuk-grid-column-one-half" tabIndex={0}>
          <h3 className="govuk-heading-m">
            Latency
          </h3>

          <SingleSeriesComponent {...this.props.httpLatencyAggregatedSeriesProps}/>

          <p className="govuk-body-s">
            The mean response latency for
            <code>{this.props.application.entity.name}</code>
            in milliseconds, segmented by status code
          </p>
        </div>

        <div className="govuk-grid-column-one-half" tabIndex={0}>
          <h3 className="govuk-heading-m">
            CPU
          </h3>

          <SingleSeriesComponent {...this.props.cpuUsageAggregatedSeriesProps}/>

          <p className="govuk-body-s">
            The percentage of CPU used by
            <code>{this.props.application.entity.name}</code>
          </p>
        </div>

        <div className="govuk-grid-column-one-half" tabIndex={0}>
          <h3 className="govuk-heading-m">
            Memory
          </h3>

          <SingleSeriesComponent {...this.props.memoryUsageAggregatedSeriesProps}/>

          <p className="govuk-body-s">
            The percentage of memory quota used by
            <code>{this.props.application.entity.name}</code>,
            out of a total of
            <code>{this.props.application.entity.memory}MB</code>
          </p>
        </div>

        <div className="govuk-grid-column-one-half" tabIndex={0}>
          <h3 className="govuk-heading-m">
            Disk
          </h3>

          <SingleSeriesComponent {...this.props.diskUsageAggregatedSeriesProps}/>

          <p className="govuk-body-s">
            The percentage of disk quota used by
            <code>{this.props.application.entity.name}</code>,
            out of a total of
            <code>{this.props.application.entity.disk_quota}MB</code>
          </p>
        </div>
      </div>
    </div>;
  }
}
