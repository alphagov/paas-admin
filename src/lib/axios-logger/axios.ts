import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { BaseLogger } from 'pino';

function newAxiosRequestInterceptor(name: string, logger: BaseLogger) {
  return (cfg: AxiosRequestConfig) => {
    const { url, method } = cfg;

    logger.info({
      name,
      method,
      url,
      message: `${name} making ${method} request to ${url}`,
    });

    (cfg as any).startTime = Date.now();

    return cfg;
  };
}

function newAxiosResponseInterceptor(name: string, logger: BaseLogger) {
  return (resp: AxiosResponse) => {
    const { config, status } = resp;
    const { url, method } = config;

    const timeDelta = Date.now() - (config as any).startTime;

    const contents = {
      name,
      method,
      url,
      status,
      time: timeDelta,
      message: `${name} received ${status} when making ${method} request to ${url} in ${timeDelta}ms`,
    };

    if (200 <= status && status < 300) {
      logger.info(contents);
    } else {
      logger.warn(contents);
    }

    return resp;
  };
}

function newAxiosErrorInterceptor(name: string, logger: BaseLogger) {
  return (err: any) => {
    logger.error({ message: `${name} encountered error` });

    return err;
  };
}

export function intercept(inst: AxiosInstance, name: string, log: BaseLogger) {
  inst.interceptors.request.use(
    newAxiosRequestInterceptor(name, log),
    newAxiosErrorInterceptor(name, log),
  );
  inst.interceptors.response.use(
    newAxiosResponseInterceptor(name, log),
    newAxiosErrorInterceptor(name, log),
  );
}
