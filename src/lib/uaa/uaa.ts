import axios from 'axios';
import pLimit from 'p-limit';

import * as types from './uaa.types';

const DEFAULT_TIMEOUT = 1000;
const CONCURRENCY_LIMIT = 5;

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

export type UaaOrigin = 'uaa' | 'google' | 'microsoft';

export interface IUaaInvitation {
  readonly userId: string;
  readonly inviteLink: string;
}

async function request(
  endpoint: string,
  method: string,
  url: string,
  opts: any,
) {
  const response = await axios.request({
    baseURL: endpoint,
    data: opts.data,
    method,
    params: opts.params,
    url,
    validateStatus: status => status > 0 && status < 501,

    ...opts,
  });
  if (response.status < 200 || response.status >= 300) {
    const msg = `UAAClient: ${method} ${url} failed with status ${response.status}`;
    if (typeof response.data === 'object') {
      throw new Error(`${msg} and data ${JSON.stringify(response.data)}`);
    }
    throw new Error(msg);
  }

  return response;
}

export async function authenticate(
  endpoint: string,
  clientCredentials: IClientCredentials,
) {
  /* istanbul ignore next */
  if (!clientCredentials.clientID) {
    throw new TypeError('UAAClient: authenticate: clientID is required');
  }

  /* istanbul ignore next */
  if (!clientCredentials.clientSecret) {
    throw new TypeError('UAAClient: authenticate: clientSecret is required');
  }

  const response = await request(endpoint, 'post', '/oauth/token', {
    auth: {
      password: clientCredentials.clientSecret,
      username: clientCredentials.clientID,
    },
    params: {
      grant_type: 'client_credentials',
    },
    timeout: DEFAULT_TIMEOUT,
    withCredentials: true,
  });

  return response.data.access_token;
}

export async function authenticateUser(
  endpoint: string,
  userCredentials: IUserCredentials,
) {
  /* istanbul ignore next */
  if (!userCredentials.username) {
    throw new TypeError('UAAClient: authenticateUser: username is required');
  }

  /* istanbul ignore next */
  if (!userCredentials.password) {
    throw new TypeError('UAAClient: authenticateUser: password is required');
  }

  const response = await request(endpoint, 'post', '/oauth/token', {
    auth: {
      username: 'cf',
    },
    params: {
      grant_type: 'password',
      response_type: 'token',

      ...userCredentials,
    },
    timeout: DEFAULT_TIMEOUT,
    withCredentials: true,
  });

  return response.data.access_token;
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
      this.accessToken = await authenticate(
        this.apiEndpoint,
        this.clientCredentials,
      );
    }

    /* istanbul ignore next */
    if (!this.accessToken) {
      throw new Error(
        'UAAClient: unable to get access token: accessToken ' +
          'or clientID and clientSecret must be provided',
      );
    }

    return this.accessToken;
  }

  public async getSigningKeys(): Promise<ReadonlyArray<string>> {
    if (this.signingKeys && this.signingKeys.length > 0) {
      return this.signingKeys;
    }

    const response = await axios.request({
      baseURL: this.apiEndpoint,
      method: 'get',
      url: '/token_keys',
      validateStatus: (status: number) => status > 0 && status < 500,
    });

    if (response.status < 200 || response.status >= 300) {
      const msg = `UAAClient: failed to obtain signing key due to status ${response.status}`;
      /* istanbul ignore next */
      if (typeof response.data === 'object') {
        throw new Error(`${msg} and data ${JSON.stringify(response.data)}`);
      }
      /* istanbul ignore next */
      throw new Error(msg);
    }

    this.signingKeys = response.data.keys.map((key: any) => key.value);

    return this.signingKeys;
  }

  public async request(method: string, url: string, opts: any = {}) {
    const token = await this.getAccessToken();
    const requiredHeaders = { Authorization: `Bearer ${token}` };

    opts.headers = { ...(opts.headers || {}), ...requiredHeaders };

    return request(this.apiEndpoint, method, url, {
      ...opts,
    });
  }

  public async getUser(userGUID: string): Promise<types.IUaaUser> {
    const response = await this.request('get', `/Users/${userGUID}`);

    return response.data as types.IUaaUser;
  }

  public async getUsers(
    userGUIDs: ReadonlyArray<string>,
  ): Promise<ReadonlyArray<types.IUaaUser | null>> {
    // Limit number of users fetched from UAA concurrently
    const pool = pLimit(CONCURRENCY_LIMIT);
    const uaaUsers = await Promise.all(
      userGUIDs.map(async guid =>
        await pool(async () => {
          try {
            const user = await this.getUser(guid);

            return user;
          } catch {
            return new Promise(resolve =>
              resolve(null),
            ) as Promise<types.IUaaUser | null>;
          }
        }),
      ),
    );

    return uaaUsers;
  }

  public async findUser(email: string): Promise<types.IUaaUser> {
    const params = { filter: `email eq "${email}"` };
    const response = await this.request('get', '/Users', { params });

    return response.data.resources[0] as types.IUaaUser;
  }

  public async inviteUser(
    email: string,
    clientID: string,
    redirectURI: string,
  ): Promise<IUaaInvitation> {
    const data = { emails: [email] };
    const response = await this.request(
      'post',
      `/invite_users?redirect_uri=${redirectURI}&client_id=${clientID}`,
      { data },
    );

    // It seems the base URL for UAA is only configurable when using SAML
    //
    // We use UAA as an IDP and as an SP; we use UAA on two domains:
    // uaa.((system_domain)) and login.((system_domain))
    //
    // When we invite users we want to redirect them to login.((system_domain))
    // Otherwise they successfully set a password
    // Then they log in on the UAA subdomain
    // Then they are redirected to the login subdomain
    // But they do not have a valid session in the login subdomain cookie
    // So they have to log in again, which is bad user experience and confusing
    const responseWithUpdatedLink = response.data.new_invites[0];
    responseWithUpdatedLink.inviteLink = responseWithUpdatedLink.inviteLink.replace(
      'https://uaa.',
      'https://login.',
    );

    return responseWithUpdatedLink;
  }

  public async createUser(email: string, password: string) {
    const data = {
      active: true,
      emails: [{ value: email, primary: true }],
      name: {},
      password,
      userName: email,
      verified: true,
    };
    const response = await this.request('post', '/Users', { data });

    return response.data;
  }

  public async deleteUser(userId: string) {
    const response = await this.request('delete', `/Users/${userId}`);

    return response.data;
  }

  public async setUserOrigin(
    userId: string,
    origin: UaaOrigin,
    originIdentifier?: string,
  ): Promise<types.IUaaUser> {
    const user = await this.getUser(userId);
    user.origin = origin;

    /* istanbul ignore if */
    if (originIdentifier) {
      user.userName = originIdentifier;
    }

    const reqOpts = {
      data: user,
      headers: {
        'If-Match': '*',
      },
    };
    const response = await this.request('put', `/Users/${userId}`, reqOpts);

    return response.data as types.IUaaUser;
  }

  public async obtainPasswordResetCode(username: string): Promise<string> {
    const response = await this.request('post', '/password_resets', {
      data: username,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    return response.data.code;
  }

  public async resetPassword(code: string, password: string): Promise<types.IUaaUser> {
    const response = await this.request('post', '/password_change', { data: { code, new_password: password } });

    return response.data;
  }
}
