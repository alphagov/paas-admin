import axios, { AxiosResponse } from 'axios';

import { authenticate } from '../uaa';
import * as cf from './types';

// FIXME: We're hitting issues with long running requests to CF API. We're setting a hard limit here,
// but intend to roll it back to more acceptable/desired behavior in the future.
const DEFAULT_TIMEOUT = 30000;

interface IClientCredentials {
  readonly clientID: string;
  readonly clientSecret: string;
}

interface IClientConfig {
  readonly accessToken?: string;
  readonly apiEndpoint: string;
  readonly clientCredentials?: IClientCredentials;
  readonly tokenEndpoint?: string;
}

export default class CloudFoundryClient {
  private accessToken: string;
  private readonly apiEndpoint: string;
  private tokenEndpoint: string;
  private readonly clientCredentials: IClientCredentials;

  constructor(config: IClientConfig) {
    this.apiEndpoint = config.apiEndpoint;
    this.tokenEndpoint = config.tokenEndpoint || '';

    this.accessToken = config.accessToken || '';
    this.clientCredentials = config.clientCredentials || {clientID: '', clientSecret: ''};
  }

  public async getTokenEndpoint() {
    /* istanbul ignore next */
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

  public async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    if (this.clientCredentials.clientSecret !== '') {
      const tokenEndpoint = await this.getTokenEndpoint();
      this.accessToken = await authenticate(tokenEndpoint, this.clientCredentials);
    }

    if (!this.accessToken) {
      throw new TypeError('CFClient: either an accessToken or clientCredentials are required to authenticate');
    }

    return this.accessToken;
  }

  public async request(method: string, url: string, data?: any, params?: any): Promise<AxiosResponse> {
    const token = await this.getAccessToken();
    return request(this.apiEndpoint, method, url, {
      headers: {Authorization: `Bearer ${token}`},
      data,
      params,
    });
  }

  public async allResources(response: AxiosResponse): Promise<any> {
    const data = response.data.resources;

    if (!response.data.next_url) {
      return data;
    }

    const newResponse = await this.request('get', response.data.next_url);
    const newData = await this.allResources(newResponse);

    return [...data, ...newData];
  }

  public async info(): Promise<cf.IInfo> {
    const response = await request(this.apiEndpoint, 'get', '/v2/info');
    return response.data;
  }

  public async organizations(): Promise<cf.IOrganization[]> {
    const response = await this.request('get', `/v2/organizations`);
    return this.allResources(response);
  }

  public async organization(organizationGUID: string): Promise<cf.IOrganization> {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}`);
    return response.data;
  }

  public async organizationQuota(quotaGUID: string): Promise<cf.IOrganizationQuota> {
    const response = await this.request('get', `/v2/quota_definitions/${quotaGUID}`);
    return response.data;
  }

  public async spaces(organizationGUID: string): Promise<cf.ISpace[]> {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}/spaces`);
    return this.allResources(response);
  }

  public async space(spaceGUID: string): Promise<cf.ISpace> {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}`);
    return response.data;
  }

  public async spaceSummary(spaceGUID: string): Promise<cf.ISpaceSummary> {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/summary`);
    return response.data;
  }

  public async spaceQuota(quotaGUID: string): Promise<cf.ISpaceQuota> {
    const response = await this.request('get', `/v2/space_quota_definitions/${quotaGUID}`);
    return response.data;
  }

  public async spacesForUserInOrganization(user: string, organization: string): Promise<cf.IResource[]> {
    const response = await this.request('get', `/v2/users/${user}/spaces?q=organization_guid:${organization}`);
    return this.allResources(response);
  }

  public async applications(spaceGUID: string): Promise<cf.IApplication[]> {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/apps`);
    return this.allResources(response);
  }

  public async application(applicationGUID: string): Promise<cf.IApplication> {
    const response = await this.request('get', `/v2/apps/${applicationGUID}`);
    return response.data;
  }

  public async applicationSummary(applicationGUID: string): Promise<cf.IApplicationSummary> {
    const response = await this.request('get', `/v2/apps/${applicationGUID}/summary`);
    return response.data;
  }

  public async services(spaceGUID: string): Promise<cf.IServiceInstance[]> {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/service_instances`);
    return this.allResources(response);
  }

  public async serviceInstance(instanceGUID: string): Promise<cf.IServiceInstance> {
    const response = await this.request('get', `/v2/service_instances/${instanceGUID}`);
    return response.data;
  }

  public async service(serviceGUID: string): Promise<cf.IService> {
    const response = await this.request('get', `/v2/services/${serviceGUID}`);
    return response.data;
  }

  public async servicePlan(planGUID: string): Promise<cf.IServicePlan> {
    const response = await this.request('get', `/v2/service_plans/${planGUID}`);
    return response.data;
  }

  public async usersForOrganization(organizationGUID: string): Promise<cf.IOrganizationUserRoles[]> {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}/user_roles`);
    return this.allResources(response);
  }

  public async usersForSpace(spaceGUID: string): Promise<cf.ISpaceUserRoles[]> {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/user_roles`);
    return this.allResources(response);
  }

  public async setOrganizationRole(
    organizationGUID: string,
    userGUID: string,
    role: cf.OrganizationUserRoleEndpoints,
    mod: boolean,
  ): Promise<cf.IResource> {
    const response = await this.request(
      mod ? 'put' : 'delete',
      `/v2/organizations/${organizationGUID}/${role}/${userGUID}`,
    );
    return response.data;
  }

  public async setSpaceRole(spaceGUID: string, userGUID: string, role: string, mod: boolean): Promise<cf.IResource> {
    const response = await this.request(mod ? 'put' : 'delete', `/v2/spaces/${spaceGUID}/${role}/${userGUID}`);
    return response.data;
  }

  public async assignUserToOrganizationByUsername(organizationGUID: string, username: string): Promise<cf.IResource> {
    const response = await this.request('put', `/v2/organizations/${organizationGUID}/users`, {username});
    return response.data;
  }

  public async hasOrganizationRole(
    organizationGUID: string,
    userGUID: string,
    role: cf.OrganizationUserRoles,
  ): Promise<boolean> {
    const users = await this.usersForOrganization(organizationGUID);
    const user = users.find((u: cf.IOrganizationUserRoles) => u.metadata.guid === userGUID);

    if (!user) {
      return false;
    }

    return user.entity.organization_roles.includes(role);
  }
}

async function request(endpoint: string, method: string, url: string, opts?: any): Promise<AxiosResponse> {
  const response = await axios.request({
    method,
    url,
    baseURL: endpoint,
    validateStatus: (status: number) => status > 0 && status < 501,
    timeout: DEFAULT_TIMEOUT,
    ...opts,
  });

  if (response.status < 200 || response.status >= 300) {
    let msg = `cf: ${method} ${url} failed with status ${response.status}`;
    if (typeof response.data === 'object') {
      msg = `${msg} and data ${JSON.stringify(response.data)}`;
    }

    const err = new Error(msg);
    /* istanbul ignore next */
    if (typeof response.data === 'object' && response.data.error_code) {
      // err.code = response.data.error_code;
    }

    throw err;
  }

  return response;
}
