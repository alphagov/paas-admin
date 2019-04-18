import { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { BaseLogger } from 'pino';

export function NewAxiosRequestInterceptor(name: string, logger: BaseLogger) {
  return (cfg: AxiosRequestConfig) => {
    const { url, method } = cfg;

    logger.info({
      name, method, url,
      message: `${name} making ${method} request to ${url}`,
    });

    (cfg as any).startTime = Date.now();

    return cfg;
  };
}

export function NewAxiosResponseInterceptor(name: string, logger: BaseLogger) {
  return (resp: AxiosResponse) => {
    const {config, status} = resp;
    const {url, method} = config;

    const timeDelta = Date.now() - (config as any).startTime;

    const contents = {
      name, method, url, status, time: timeDelta,
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

export function NewAxiosErrorInterceptor(name: string, logger: BaseLogger) {
  return (err: any) => {
    logger.error({
      error: err, message: `${name} encountered error`,
    });

    return err;
  };
}
