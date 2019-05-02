import axios, { AxiosResponse } from 'axios';
import { BaseLogger } from 'pino';

import { authenticate } from '../uaa';
import * as cf from './types';

import {intercept} from '../axios-logger/axios';

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
  readonly logger: BaseLogger;
}

type httpMethod = 'post' | 'get' | 'put' | 'delete';

export default class CloudFoundryClient {
  private accessToken: string;
  private readonly apiEndpoint: string;
  private tokenEndpoint: string;
  private readonly clientCredentials: IClientCredentials;

  private readonly logger: BaseLogger;

  constructor(config: IClientConfig) {
    this.apiEndpoint = config.apiEndpoint;
    this.tokenEndpoint = config.tokenEndpoint || '';

    this.accessToken = config.accessToken || '';
    this.clientCredentials = config.clientCredentials || {clientID: '', clientSecret: ''};

    this.logger = config.logger;
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

  public async request(method: httpMethod, url: string, data?: any, params?: any): Promise<AxiosResponse> {
    const token = await this.getAccessToken();
    return request(this.apiEndpoint, method, url, this.logger, {
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
    const response = await request(this.apiEndpoint, 'get', '/v2/info', this.logger);
    return response.data;
  }

  public async createOrganization(orgRequest: cf.IOrganizationRequest): Promise<cf.IOrganization> {
    const response = await this.request('post', `/v2/organizations`, orgRequest);
    return response.data;
  }

  public async organizations(): Promise<ReadonlyArray<cf.IOrganization>> {
    const response = await this.request('get', `/v2/organizations`);
    return this.allResources(response);
  }

  public async organization(organizationGUID: string): Promise<cf.IOrganization> {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}`);
    return response.data;
  }

  public async deleteOrganization(orgRequest: {
    readonly guid: string,
    readonly recursive: boolean,
    readonly async: boolean,
  }): Promise<void> {
    const query = `?recursive=${orgRequest.recursive}&async=${orgRequest.async}`;
    await this.request('delete', `/v2/organizations/${orgRequest.guid}${query}`, orgRequest);
  }

  public async quotaDefinitions(search?: { readonly name: string }): Promise<ReadonlyArray<cf.IOrganizationQuota>> {
    let query = '';
    if (search && search.name) {
      query = `?q=name:${search.name}`;
    }
    const response = await this.request('get', `/v2/quota_definitions${query}`);
    const all = await this.allResources(response);
    return all;
  }

  public async organizationQuota(quotaGUID: string): Promise<cf.IOrganizationQuota> {
    const response = await this.request('get', `/v2/quota_definitions/${quotaGUID}`);
    return response.data;
  }

  public async spaces(organizationGUID: string): Promise<ReadonlyArray<cf.ISpace>> {
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

  public async spacesForUserInOrganization(user: string, organization: string): Promise<ReadonlyArray<cf.IResource>> {
    const response = await this.request('get', `/v2/users/${user}/spaces?q=organization_guid:${organization}`);
    return this.allResources(response);
  }

  public async applications(spaceGUID: string): Promise<ReadonlyArray<cf.IApplication>> {
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

  public async services(spaceGUID: string): Promise<ReadonlyArray<cf.IServiceInstance>> {
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

  public async createUser(userId: string): Promise<cf.IUser> {
    const response = await this.request('post', '/v2/users', { guid: userId });
    return response.data;
  }

  public async deleteUser(userId: string): Promise<void> {
    await this.request('delete', `/v2/users/${userId}?async=false`);
  }

  public async usersForOrganization(organizationGUID: string): Promise<ReadonlyArray<cf.IOrganizationUserRoles>> {
    const response = await this.request('get', `/v2/organizations/${organizationGUID}/user_roles`);
    return this.allResources(response);
  }

  public async usersForSpace(spaceGUID: string): Promise<ReadonlyArray<cf.ISpaceUserRoles>> {
    const response = await this.request('get', `/v2/spaces/${spaceGUID}/user_roles`);
    return this.allResources(response);
  }

  public async userServices(spaceGUID: string): Promise<ReadonlyArray<cf.IUserServices>> {
    const response = await this.request('get', `/v2/user_provided_service_instances?q=space_guid:${spaceGUID}`);
    return this.allResources(response);
  }

  public async userServiceInstance(instanceGUID: string): Promise<cf.IServiceInstance> {
    const response = await this.request('get', `/v2/user_provided_service_instances/${instanceGUID}`);
    return response.data;
  }

  public async stacks(): Promise<ReadonlyArray<cf.IStack>> {
    const response = await this.request('get', `/v2/stacks`);
    return this.allResources(response);
  }

  public async stack(stackGUID: string): Promise<cf.IStack> {
    const response = await this.request('get', `/v2/stacks/${stackGUID}`);
    return response.data;
  }

  public async cflinuxfs2StackGUID(): Promise<string | undefined> {
    const response = await this.stacks();
    const cflinuxfs2 = response.filter((stack: cf.IStack) => stack.entity.name === 'cflinuxfs2');
    return cflinuxfs2.length > 0 ? cflinuxfs2[0].metadata.guid : undefined;
  }

  public async setOrganizationRole(
    organizationGUID: string,
    userGUID: string,
    role: cf.OrganizationUserRoleEndpoints,
    mod: boolean,
  ): Promise<cf.IResource> {
    const response = await this.request(
      mod ? 'put' : 'delete',
      `/v2/organizations/${organizationGUID}/${role}/${userGUID}?recursive=true`,
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

async function request(
  endpoint: string,
  method: httpMethod,
  url: string,
  logger: BaseLogger,
  opts?: any,
): Promise<AxiosResponse> {

  const instance = axios.create();
  intercept(instance, 'cf', logger);

  const response = await instance.request({
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
