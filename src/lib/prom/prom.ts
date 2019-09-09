import axios, { AxiosResponse } from 'axios';
import moment from 'moment';
import { BaseLogger } from 'pino';

import {intercept} from '../axios-logger/axios';

const DEFAULT_TIMEOUT = 30000;

export interface IPrometheusVectorDatum {
  readonly timestamp: number;
  readonly val: number;
}

export default class PromClient {
  private accessToken: string;
  private readonly apiEndpoint: string;
  private readonly logger: BaseLogger;

  constructor(endpoint: string, accessToken: string, logger: BaseLogger) {
    this.apiEndpoint = endpoint;
    this.accessToken = accessToken;
    this.logger = logger;
  }

  public async getValue(query: string, time: Date): Promise<number> {
    const metricVal = this.request(
      '/api/v1/query',
      { time: moment(time).toDate().getTime() / 1000, query },
    ).then(
      r => parseFloat(r.data.data.result[0].value[1]),
    );

    return metricVal;
  }

  public async getSeries(
    query: string,
    step: number,
    start: Date,
    end: Date,
  ): Promise<ReadonlyArray<IPrometheusVectorDatum>> {
    const metricSeries = this.request(
      '/api/v1/query_range',
      {
        start: moment(start).toDate().getTime() / 1000,
        end: moment(end).toDate().getTime() / 1000,
        step: parseInt(step.toFixed(0), 10),
        query,
      },
    ).then(
      r => r.data.data.result[0].values.map((p: Array<number | string>) => {
        const timestamp = (p[0] as number) * 1000;
        const val = parseFloat(p[1] as string);
        return {timestamp, val};
      }),
    );

    return metricSeries;
  }

  private async request(
    path: string,
    params: {readonly [key: string]: string | number},
  ): Promise<AxiosResponse> {

    const instance = axios.create();
    intercept(instance, 'cf', this.logger);

    const method = 'GET';
    const response = await instance.request({
      method, params, baseURL: this.apiEndpoint,
      url: path,
      validateStatus: (status: number) => status > 0 && status < 501,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
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
