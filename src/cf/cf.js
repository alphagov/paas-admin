import axios from 'axios';
import {authenticate} from '../uaa';

const DEFAULT_TIMEOUT = 5000;

export default class CloudFoundryClient {
  constructor({apiEndpoint, tokenEndpoint, accessToken, clientCredentials}) {
    this.apiEndpoint = apiEndpoint;
    this.tokenEndpoint = tokenEndpoint;
    if (!this.apiEndpoint) {
      throw new Error('CFClient: apiEndpoint is required');
    }
    this.accessToken = accessToken;
    this.clientCredentials = clientCredentials;
  }

  async getTokenEndpoint() {
    if (this.tokenEndpoint) {
      return this.tokenEndpoint;
    }
    const info = await this.info();
    /* istanbul ignore next */
    if (!info.token_endpoint) {
      throw new Error('CFClient: failed to discover tokenEndpoint from info');
    }
    this.tokenEndpoint = info.token_endpoint;
    return this.tokenEndpoint;
  }

  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    if (this.clientCredentials) {
      const tokenEndpoint = await this.getTokenEndpoint();
      this.accessToken = await authenticate(tokenEndpoint, this.clientCredentials);
    }
    if (!this.accessToken) {
      throw new Error('CFClient: either an accessToken or clientCredentials are required to authenticate');
    }
    return this.accessToken;
  }

  async request(method, url, data, params) {
    const token = await this.getAccessToken();
    return request(this.apiEndpoint, method, url, {
      headers: {Authorization: `Bearer ${token}`},
      data,
      params
    });
  }

  async allResources(response) {
    const data = response.data.resources;

    if (!response.data.next_url) {
      return data;
    }

    const newResponse = await this.request('get', response.data.next_url);
    const newData = await this.allResources(newResponse);

    return [...data, ...newData];
  }

  async info() {
    const response = await request(this.apiEndpoint, 'get', '/v2/info');
    return response.data;
  }

  async organizations() {
    const response = await this.request('get', `/v2/organizations`);
    return this.allResources(response);
  }

  async organization(organizationGUID) {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}`);
    return response.data;
  }

  async organizationQuota(quotaGUID) {
    const response = await this.request('get', `/v2/quota_definitions/${quotaGUID}`);
    return response.data;
  }

  async spaces(organizationGUID) {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}/spaces`);
    return this.allResources(response);
  }

  async space(spaceGUID) {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}`);
    return response.data;
  }

  async spaceSummary(spaceGUID) {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/summary`);
    return response.data;
  }

  async spaceQuota(quotaGUID) {
    const response = await this.request('get', `/v2/space_quota_definitions/${quotaGUID}`);
    return response.data;
  }

  async spacesForUserInOrganization(user, organization) {
    const response = await this.request('get', `/v2/users/${user}/spaces?q=organization_guid:${organization}`);
    return this.allResources(response);
  }

  async applications(spaceGUID) {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/apps`);
    return this.allResources(response);
  }

  async application(applicationGUID) {
    const response = await this.request('get', `/v2/apps/${applicationGUID}`);
    return response.data;
  }

  async applicationSummary(applicationGUID) {
    const response = await this.request('get', `/v2/apps/${applicationGUID}/summary`);
    return response.data;
  }

  async services(spaceGUID) {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/service_instances`);
    return this.allResources(response);
  }

  async serviceInstance(instanceGUID) {
    const response = await this.request('get', `/v2/service_instances/${instanceGUID}`);
    return response.data;
  }

  async service(serviceGUID) {
    const response = await this.request('get', `/v2/services/${serviceGUID}`);
    return response.data;
  }

  async servicePlan(planGUID) {
    const response = await this.request('get', `/v2/service_plans/${planGUID}`);
    return response.data;
  }

  async usersForOrganization(organizationGUID) {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}/user_roles`);
    return this.allResources(response);
  }

  async usersForSpace(spaceGUID) {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/user_roles`);
    return this.allResources(response);
  }

  async setOrganizationRole(organizationGUID, userGUID, role, mod) {
    const response = await this.request(mod ? 'put' : 'delete', `/v2/organizations/${organizationGUID}/${role}/${userGUID}`);
    return response.data;
  }

  async setSpaceRole(spaceGUID, userGUID, role, mod) {
    const response = await this.request(mod ? 'put' : 'delete', `/v2/spaces/${spaceGUID}/${role}/${userGUID}`);
    return response.data;
  }

  async assignUserToOrganizationByUsername(organizationGUID, username) {
    const response = await this.request('put', `/v2/organizations/${organizationGUID}/users`, {username});
    return response.data;
  }

}

async function request(endpoint, method, url, opts) {
  const response = await axios.request({
    method,
    url,
    baseURL: endpoint,
    validateStatus: status => status > 0 && status < 501,
    timeout: DEFAULT_TIMEOUT,
    ...opts
  });
  if (response.status < 200 || response.status >= 300) {
    let msg = `cf: ${method} ${url} failed with status ${response.status}`;
    if (typeof response.data === 'object') {
      msg = `${msg} and data ${JSON.stringify(response.data)}`;
    }
    const err = new Error(msg);
    /* istanbul ignore next */
    if (typeof response.data === 'object' && response.data.error_code) {
      err.code = response.data.error_code;
    }
    throw err;
  }
  return response;
}

