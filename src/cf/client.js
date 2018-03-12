import axios from 'axios';

export default class Client {
  constructor(apiURL, accessToken) {
    this.api = apiURL;
    this.accessToken = accessToken;
  }

  _request(method, url, data, params) {
    return axios.request({
      url,
      method,
      baseURL: `${this.api}`,
      data,
      params,
      headers: {Authorization: `Bearer ${this.accessToken}`}
    });
  }

  async request(method, url, data, params) {
    try {
      return await this._request(method, url, data, params);
    } catch (err) {
      if (err.response && err.response.data && err.response.data.description) {
        throw new Error(`${url}: ${err.response.data.description}`);
      }
      throw err;
    }
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
    const response = await this.request('get', '/v2/info');
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

  async applicationSummary(applicationGUID) {
    const response = await this.request('get', `/v2/apps/${applicationGUID}/summary`);
    return response.data;
  }

  async services(space) {
    const response = await this.request('get', `/v2/spaces/${space}/service_instances`);
    return this.allResources(response);
  }

  async usersInOrganization(organization) {
    const response = await this.request('get', `/v2/organizations/${organization}/user_roles`);
    return this.allResources(response);
  }
}
