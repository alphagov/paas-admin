// tslint:disable:max-classes-per-file
import React, {Component} from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

import {IApplication} from '../../lib/cf/types';

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
          {this.props.val}
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
          {this.props.val}
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

type PrometheusSeriesVal = ReadonlyArray<string | number>;
type PrometheusSeries = ReadonlyArray<PrometheusSeriesVal>;

export interface IRechartsVal {
  readonly timestamp: number;
  readonly val: number;
}

export interface ISingleSeriesComponentProps {
  readonly data: PrometheusSeries;
}

export class SingleSeriesComponent extends Component<ISingleSeriesComponentProps, {}> {
  public render() {
    return <LineChart data={this.promToRecharts(this.props.data)}
                      width={400} height={200}
                      margin={{ top: 10, right: 5, bottom: 10, left: 5 }}>
      <Line type="monotone" dataKey="val" stroke="#8884d8" />
      <XAxis dataKey="name" />
      <YAxis />
    </LineChart>;
  }

  private promToRecharts(promData: PrometheusSeries): ReadonlyArray<IRechartsVal> {
    return promData.map(val => {
      return { timestamp: val[0] as number * 1000, val: parseFloat(val[1] as string) };
    });
  }
}

export interface IAppMetricsComponentProps {
  readonly application: IApplication;

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
