import axios from 'axios';

const DEFAULT_TIMEOUT = 1000;

interface IClientCredentials {
  readonly clientID: string;
  readonly clientSecret: string;
}

interface IClientConfig {
  readonly apiEndpoint: string;
  readonly clientCredentials: IClientCredentials;
  readonly accessToken?: string;
  readonly signingKeys?: ReadonlyArray<string>;
}

export default class UAAClient {
  private accessToken: string;
  private readonly apiEndpoint: string;
  private readonly clientCredentials: IClientCredentials;
  private signingKeys: ReadonlyArray<string>;

  constructor(config: IClientConfig) {
    this.apiEndpoint = config.apiEndpoint;
    /* istanbul ignore next */
    if (!this.apiEndpoint) {
      throw new Error('UAAClient: apiEndpoint is required');
    }
    this.accessToken = config.accessToken || '';
    this.clientCredentials = config.clientCredentials;
    this.signingKeys = config.signingKeys || [];
  }

  public async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }

    /* istanbul ignore next */
    if (this.clientCredentials) {
      this.accessToken = await authenticate(this.apiEndpoint, this.clientCredentials);
    }

    /* istanbul ignore next */
    if (!this.accessToken) {
      throw new Error(`UAAClient: unable to get access token: accessToken ` +
        `or clientID and clientSecret must be provided`);
    }

    return this.accessToken;
  }

  public async getSigningKeys(): Promise<ReadonlyArray<string>> {
    if (this.signingKeys && this.signingKeys.length > 0) {
      return this.signingKeys;
    }

    const response = await axios.request({
      url: '/token_keys',
      method: 'get',
      baseURL: this.apiEndpoint,
      validateStatus: (status: number) => status > 0 && status < 500,
    });

    if (response.status < 200 || response.status >= 300) {
      let msg = `uaa: failed to obtain signing key due to status ${response.status}`;
      /* istanbul ignore next */
      if (typeof response.data === 'object') {
        msg = `${msg} and data ${JSON.stringify(response.data)}`;
      }
      throw new Error(msg);
    }

    this.signingKeys = response.data.keys.map((key: any) => key.value);
    return this.signingKeys;
  }

  public async request(method: string, url: string, opts: any = {}) {
    const token = await this.getAccessToken();
    return request(this.apiEndpoint, method, url, {
      headers: {Authorization: `Bearer ${token}`},
      ...opts,
    });
  }

  public async findUser(email: string) {
    const params = {filter: `email eq ${JSON.stringify(email)}`};
    const response = await this.request('get', '/Users', {params});
    return response.data.resources[0];
  }

  public async inviteUser(email: string, clientID: string, redirectURI: string) {
    const data = {emails: [email]};
    const response = await this.request(
      'post',
      `/invite_users?redirect_uri=${redirectURI}&client_id=${clientID}`,
      {data},
    );
    return response.data.new_invites[0];
  }
}

async function request(endpoint: string, method: string, url: string, opts: any) {
  const response = await axios.request({
    url,
    method,
    baseURL: endpoint,
    data: opts.data,
    params: opts.params,
    validateStatus: status => status > 0 && status < 501,
    ...opts,
  });
  if (response.status < 200 || response.status >= 300) {
    let msg = `uaa: ${method} ${url} failed with status ${response.status}`;
    if (typeof response.data === 'object') {
      msg = `${msg} and data ${JSON.stringify(response.data)}`;
    }
    throw new Error(msg);
  }
  return response;
}

export async function authenticate(endpoint: string, clientCredentials: IClientCredentials) {
  /* istanbul ignore next */
  if (!clientCredentials.clientID) {
    throw new TypeError('authenticate: clientID is required');
  }

  /* istanbul ignore next */
  if (!clientCredentials.clientSecret) {
    throw new TypeError('authenticate: clientSecret is required');
  }

  const response = await request(endpoint, 'post', '/oauth/token', {
    timeout: DEFAULT_TIMEOUT,
    params: {
      grant_type: 'client_credentials',
    },
    // TODO: I think this might be leaking the auth details in the url - consider using header directly?
    withCredentials: true,
    auth: {
      username: clientCredentials.clientID,
      password: clientCredentials.clientSecret,
    },
  });
  return response.data.access_token;
}
