import axios, { AxiosResponse } from 'axios';
import { BaseLogger } from 'pino';

import { intercept } from '../axios-logger/axios';
import { IMetricSerie } from '../metrics';

const DEFAULT_TIMEOUT = 30000;

type PrometheusValue = readonly [number, string];

interface IPrometheusResponseResultBase {
  readonly metric: {
    readonly __name__: string;
    readonly [label: string]: string;
  };
}

interface IPrometheusQueryResponseResult extends IPrometheusResponseResultBase {
  readonly value: PrometheusValue;
}

interface IPrometheusQueryRangeResponseResult
  extends IPrometheusResponseResultBase {
  readonly values: ReadonlyArray<PrometheusValue>;
}

interface IPrometheusResponseData<T> {
  readonly resultType: 'matrix' | 'vector' | 'scalar' | 'string';
  readonly result: ReadonlyArray<T>;
}

interface IPrometheusResponse<T> {
  readonly status: string;
  readonly data: IPrometheusResponseData<T>;
}

export default class PromClient {
  private readonly username: string;
  private readonly password: string;
  private readonly apiEndpoint: string;
  private readonly logger: BaseLogger;

  constructor(
    endpoint: string,
    username: string,
    password: string,
    logger: BaseLogger,
  ) {
    this.apiEndpoint = endpoint;
    this.username = username;
    this.password = password;
    this.logger = logger;
  }

  public async getValue(
    query: string,
    time: Date,
  ): Promise<ReadonlyArray<number> | undefined> {
    const promResponse: AxiosResponse<IPrometheusResponse<
      IPrometheusQueryResponseResult
    >> = await this.request('/api/v1/query', {
      query,
      time: time.getTime() / 1000,
    });
    const promValues = promResponse.data.data.result;

    if (promValues.length === 0) {
      return;
    }

    return promValues.map(val => parseFloat(val.value[1]));
  }

  public async getSeries(
    query: string,
    step: number,
    start: Date,
    end: Date,
  ): Promise<ReadonlyArray<IMetricSerie> | undefined> {
    const promResponse: AxiosResponse<IPrometheusResponse<
      IPrometheusQueryRangeResponseResult
    >> = await this.request('/api/v1/query_range', {
      end: end.getTime() / 1000,
      query,
      start: start.getTime() / 1000,
      step: parseInt(step.toFixed(0), 10),
    });

    if (!promResponse.data || !promResponse.data.data || promResponse.data.data.result.length === 0) {
      return;
    }

    const promSeries = promResponse.data.data.result;

    return promSeries.map(series => {
      const metrics = series.values;

      return {
        label: series.metric.instance,
        metrics: metrics.map(metric => {
          const date = new Date(metric[0]);
          const value = parseFloat(metric[1] as string);

          return { date, value };
        }),
      };
    });
  }

  private async request(
    path: string,
    params: { readonly [key: string]: string | number },
  ): Promise<AxiosResponse> {
    const instance = axios.create();
    intercept(instance, 'prom', this.logger);

    const method = 'GET';
    const response = await instance.request({
      auth: {
        password: this.password,
        username: this.username,
      },
      baseURL: this.apiEndpoint,
      method,
      params,
      timeout: DEFAULT_TIMEOUT,
      url: path,
      validateStatus: (status: number) => status > 0 && status < 501,
    });

    if (response.status < 200 || response.status >= 300) {
      let msg = `prom: ${method} ${this.apiEndpoint}${path} failed with status ${response.status}`;
      if (typeof response.data === 'object') {
        msg = `${msg} and data ${JSON.stringify(response.data)}`;
      }

      const err = new Error(msg);
      /* istanbul ignore next */
      if (typeof response.data === 'object' && response.data.error_code) {
        // err.code = response.data.error_code;
      }

      throw err;
    }

    return response;
  }
}
