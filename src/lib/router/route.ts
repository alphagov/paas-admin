import { URL, URLSearchParams } from 'url';

import RouteParser from 'route-parser';

export interface IParameters {
  readonly [i: string]: any;
}

export interface IDownload {
  readonly data: string;
  readonly name: string;
}

export interface IResponse {
  readonly body?: object | string | Buffer;
  readonly download?: IDownload;
  readonly redirect?: string;
  readonly status?: number;
  readonly mimeType?: 'image/png' | 'text/csv' | 'text/plain';
}

export type ActionFunction = (
  ctx: any,
  params: IParameters,
  body?: any,
) => Promise<IResponse>;

export interface IRouteDefinition {
  readonly action: ActionFunction;
  readonly method?: string;
  readonly name: string;
  readonly path: string;
}

export interface IRouteHeader {
  readonly name: string;
  readonly value: string;
}

export default class Route {
  public readonly definition: IRouteDefinition;
  public readonly method: string;
  public readonly parser: RouteParser;
  public readonly headers: ReadonlyArray<IRouteHeader> = [];

  constructor(definition: IRouteDefinition, headers: ReadonlyArray<IRouteHeader> = []) {
    this.definition = definition;
    this.method = (definition.method || 'get').toLowerCase();
    this.headers = headers;

    this.parser = new RouteParser(definition.path);
  }

  public composeURL(params: IParameters = {}): string {
    const url = this.parser.reverse(params);
    if (!url) {
      throw new Error(`Route: could not compose url: ${this.definition.path}`);
    }

    const used = this.parser.match(url);
    const extra = Object.keys(params).reduce(
      (extraKeys: IParameters, param: string) => {
        if (used && used[param] === undefined) {
          return { ...extraKeys, [param]: params[param] };
        }

        return extraKeys;
      },
      {},
    );

    if (Object.keys(extra).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams(extra);

    return `${url}?${searchParams.toString()}`;
  }

  public composeAbsoluteURL(domain: string, params: IParameters = {}): string {
    const path = this.composeURL(params);
    const domainURL = new URL(path, domain);

    return domainURL.toString();
  }

  public matches(path: string): boolean {
    return this.parser.match(path) !== false;
  }
}
