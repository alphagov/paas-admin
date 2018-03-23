import axios from 'axios';

const DEFAULT_TIMEOUT = 1000;

export default class UAAClient {
  constructor({apiEndpoint, clientCredentials, accessToken}) {
    this.apiEndpoint = apiEndpoint;
    /* istanbul ignore next */
    if (!this.apiEndpoint) {
      throw new Error('UAAClient: apiEndpoint is required');
    }
    this.accessToken = accessToken;
    this.clientCredentials = clientCredentials;
    this.signingKey = null;
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    if (this.clientCredentials) {
      this.accessToken = await authenticate(this.apiEndpoint, this.clientCredentials);
    }
    if (!this.accessToken) {
      throw new Error(`UAAClient: unable to get access token: accessToken or clientID and clientSecret must be provided`);
    }
    return this.accessToken;
  }

  async getSigningKey() {
    if (this.signingKey) {
      return this.signingKey;
    }

    const response = await axios.request({
      url: '/token_keys',
      method: 'get',
      baseURL: this.apiEndpoint,
      validateStatus: status => status > 0 && status < 500
    });

    if (response.status < 200 || response.status >= 300) {
      let msg = `uaa: failed to obtain signing key due to status ${response.status}`;
      /* istanbul ignore next */
      if (typeof response.data === 'object') {
        msg = `${msg} and data ${JSON.stringify(response.data)}`;
      }
      throw new Error(msg);
    }

    this.signingKey = response.data.keys[0].value;

    return this.signingKey;
  }

  async request(method, url, opts) {
    const token = await this.getAccessToken();
    return request(this.apiEndpoint, method, url, {
      headers: {Authorization: `Bearer ${token}`},
      ...opts
    });
  }

  async findUser(email) {
    const params = {filter: `email eq ${JSON.stringify(email)}`};
    const response = await this.request('get', '/Users', {params});
    return response.data.resources[0];
  }

  async inviteUser(email, clientID, redirectURI) {
    const data = {emails: [email]};
    const response = await this.request('post', `/invite_users?redirect_uri=${redirectURI}&client_id=${clientID}`, {data});
    return response.data.new_invites[0];
  }
}

async function request(endpoint, method, url, opts) {
  const response = await axios.request({
    url,
    method,
    baseURL: endpoint,
    data: opts.data,
    params: opts.params,
    validateStatus: status => status > 0 && status < 501,
    ...opts
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

export async function authenticate(endpoint, {clientID, clientSecret}) {
  if (!clientID) {
    throw new TypeError('authenticate: clientID is required');
  }
  if (!clientSecret) {
    throw new TypeError('authenticate: clientSecret is required');
  }
  const response = await request(endpoint, 'post', '/oauth/token', {
    timeout: DEFAULT_TIMEOUT,
    params: {
      grant_type: 'client_credentials' // eslint-disable-line camelcase
    },
    withCredentials: true, // TODO: I think this might be leaking the auth details in the url - consider using header directly?
    auth: {
      username: clientID,
      password: clientSecret
    }
  });
  return response.data.access_token; // eslint-disable-line camelcase
}
