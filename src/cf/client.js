import axios from 'axios';

export default class Client {
  constructor(apiURL, accessToken) {
    this.api = apiURL;
    this.accessToken = accessToken;
  }

  request(method, url, data, params) {
    return axios.request({
      url,
      method,
      baseURL: `${this.api}`,
      data,
      params,
      headers: {Authorization: `Bearer ${this.accessToken}`}
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
    const response = await this.request('get', '/v2/info');
    return response.data;
  }

  async organizations() {
    const response = await this.request('get', `/v2/organizations`);
    return this.allResources(response);
  }

  async spaces(organization) {
    const response = await this.request('get', `/v2/organizations/${organization}/spaces`);
    return this.allResources(response);
  }

  async applications(space) {
    const response = await this.request('get', `/v2/spaces/${space}/apps`);
    return this.allResources(response);
  }

  async services(space) {
    const response = await this.request('get', `/v2/spaces/${space}/service_instances`);
    return this.allResources(response);
  }

  async users(organization) {
    const response = await this.request('get', `/v2/organizations/${organization}/users`);
    return this.allResources(response);
  }
}
