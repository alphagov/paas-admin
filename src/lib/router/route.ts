import RouteParser from 'route-parser';
import { URLSearchParams } from 'url';

export interface IParameters {
  readonly [i: string]: any;
}

export interface IDownload {
  readonly data: string;
  readonly name: string;
}

export interface IResponse {
  readonly body?: object | string;
  readonly download?: IDownload;
  readonly redirect?: string;
  readonly status?: number;
}

export type ActionFunction = (ctx: any, params: IParameters, body?: any) => Promise<IResponse>;

export interface IRouteDefinition {
  readonly action: ActionFunction;
  readonly method?: string;
  readonly name: string;
  readonly path: string;
}

export default class Route {
  public readonly definition: IRouteDefinition;
  public readonly method: string;
  public readonly parser: RouteParser;

  constructor(definition: IRouteDefinition) {
    this.definition = definition;
    this.method = (definition.method || 'get').toLowerCase();

    this.parser = new RouteParser(definition.path);
  }

  public composeURL(params: IParameters = {}): string {
    const url = this.parser.reverse(params);
    if (!url) {
      throw new Error(`could not compose url: ${this.definition.path}`);
    }

    const used = this.parser.match(url);
    const extra = Object.keys(params).reduce((extraKeys: IParameters, param: string) => {
      if (used && used[param] === undefined) {
        return {...extraKeys, [param]: params[param]};
      }

      return extraKeys;
    }, {});

    if (Object.keys(extra).length === 0) {
      return url;
    }

    const searchParams = new URLSearchParams(extra);

    return `${url}?${searchParams.toString()}`;
  }

  public matches(path: string): boolean {
    return this.parser.match(path) !== false;
  }
}
