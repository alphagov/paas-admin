import axios from 'axios';
import * as types from './uaa.types';

const DEFAULT_TIMEOUT = 1000;

interface IClientCredentials {
  readonly clientID: string;
  readonly clientSecret: string;
}

interface IUserCredentials {
  readonly username: string;
  readonly password: string;
}

interface IClientConfig {
  readonly apiEndpoint: string;
  readonly clientCredentials?: IClientCredentials;
  readonly accessToken?: string;
  readonly signingKeys?: ReadonlyArray<string>;
}

export type UaaOrigin = 'uaa' | 'google';

export interface IUaaInvitation {
  userId: string;
  inviteLink: string;
}

export default class UAAClient {
  private accessToken: string;
  private readonly apiEndpoint: string;
  private readonly clientCredentials?: IClientCredentials;
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
      let msg = `UAAClient: failed to obtain signing key due to status ${response.status}`;
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
    const requiredHeaders = {Authorization: `Bearer ${token}`};

    opts.headers = { ...(opts.headers || {}), ...requiredHeaders };
    return request(this.apiEndpoint, method, url, {
      ...opts,
    });
  }

  public async getUser(userGUID: string): Promise<types.IUaaUser> {
    const response = await this.request('get', `/Users/${userGUID}`);
    return response.data as types.IUaaUser;
  }

  public async findUser(email: string): Promise<types.IUaaUser> {
    const params = {filter: `email eq ${JSON.stringify(email)}`};
    const response = await this.request('get', '/Users', {params});
    return response.data.resources[0] as types.IUaaUser;
  }

  public async inviteUser(email: string, clientID: string, redirectURI: string): Promise<IUaaInvitation> {
    const data = {emails: [email]};
    const response = await this.request(
      'post',
      `/invite_users?redirect_uri=${redirectURI}&client_id=${clientID}`,
      {data},
    );
    return response.data.new_invites[0];
  }

  public async createUser(email: string, password: string) {
    const data = {
      userName: email,
      password,
      name: {},
      emails: [{value: email, primary: true}],
      active: true,
      verified: true,
    };
    const response = await this.request(
      'post',
      '/Users',
      {data},
    );
    return response.data;
  }

  public async deleteUser(userId: string) {
    const response = await this.request(
      'delete',
      `/Users/${userId}`,
    );
    return response.data;
  }

  public async setUserOrigin(userId: string, origin: UaaOrigin): Promise<types.IUaaUser> {
    const user = await this.getUser(userId);
    user.origin = origin;
    const reqOpts = {
      data: user,
      headers: {
        'If-Match': '*',
      },
    };
    const response = await this.request('put', `/Users/${userId}`, reqOpts);
    return response.data as types.IUaaUser;
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
    let msg = `UAAClient: ${method} ${url} failed with status ${response.status}`;
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
    throw new TypeError('UAAClient: authenticate: clientID is required');
  }

  /* istanbul ignore next */
  if (!clientCredentials.clientSecret) {
    throw new TypeError('UAAClient: authenticate: clientSecret is required');
  }

  const response = await request(endpoint, 'post', '/oauth/token', {
    timeout: DEFAULT_TIMEOUT,
    params: {
      grant_type: 'client_credentials',
    },

    withCredentials: true,
    auth: {
      username: clientCredentials.clientID,
      password: clientCredentials.clientSecret,
    },
  });
  return response.data.access_token;
}

export async function authenticateUser(endpoint: string, userCredentials: IUserCredentials) {
  /* istanbul ignore next */
  if (!userCredentials.username) {
    throw new TypeError('UAAClient: authenticateUser: username is required');
  }

  /* istanbul ignore next */
  if (!userCredentials.password) {
    throw new TypeError('UAAClient: authenticateUser: password is required');
  }

  const response = await request(endpoint, 'post', '/oauth/token', {
    timeout: DEFAULT_TIMEOUT,
    params: {
      response_type: 'token',
      grant_type: 'password',
      ...userCredentials,
    },
    withCredentials: true,
    auth: {
      username: 'cf',
    },
  });
  return response.data.access_token;
}
