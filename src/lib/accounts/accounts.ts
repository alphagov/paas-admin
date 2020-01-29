import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import moment from 'moment';
import { BaseLogger } from 'pino';

import { intercept } from '../axios-logger/axios';

const DEFAULT_TIMEOUT = 5000;

export interface IDocumentResponse {
  name: string;
  valid_from: string;
  content: string;
}

export interface IUserDocumentResponse extends IDocumentResponse {
  agreement_date?: string;
}

export interface IDocument {
  name: string;
  validFrom: Date;
  content: string;
}

export interface IUserDocument extends IDocument {
  agreementDate?: Date;
}

export interface IAccountsClientConfig {
  readonly apiEndpoint: string;
  readonly secret: string;
  readonly logger: BaseLogger;
}

export interface IAccountsUserResponse {
  readonly user_uuid: string;
  readonly username: string;
  readonly user_email: string;
}

export interface IAccountsUsersResponse {
  readonly users: ReadonlyArray<IAccountsUserResponse>;
}

export interface IAccountsUser {
  readonly uuid: string;
  readonly username: string;
  readonly email: string;
}

export class AccountsClient {
  constructor(private readonly config: IAccountsClientConfig) {
    this.config = config;
  }

  public async request(req: AxiosRequestConfig): Promise<AxiosResponse> {
    return request(
      {
        baseURL: this.config.apiEndpoint,
        auth: {
          username: 'admin',
          password: this.config.secret,
        },
        headers: {
          'Content-Type': 'application/json',
        },
        ...req,
      },
      this.config.logger,
    );
  }

  public async getDocument(name: string): Promise<IDocument> {
    const response = await this.request({
      url: `/documents/${name}`,
    });
    const data: IDocumentResponse = response.data;

    return parseDocument(data);
  }

  public async putDocument(name: string, content: string): Promise<boolean> {
    await this.request({
      method: 'PUT',
      url: `/documents/${name}`,
      data: JSON.stringify({
        content,
      }),
      validateStatus(status: number) {
        return status === 201;
      },
    });

    return true;
  }

  public async createAgreement(
    documentName: string,
    userUUID: string,
  ): Promise<boolean> {
    await this.request({
      method: 'POST',
      url: '/agreements',
      data: JSON.stringify({
        user_uuid: userUUID,
        document_name: documentName,
      }),
      validateStatus(status: number) {
        return status === 201;
      },
    });

    return true;
  }

  public async getPendingDocumentsForUserUUID(
    uuid: string,
  ): Promise<ReadonlyArray<IUserDocument>> {
    const response = await this.request({
      url: `/users/${uuid}/documents`,
    });
    const data: ReadonlyArray<IUserDocumentResponse> = response.data;
    const initialMap: { [key: string]: IUserDocument } = {};

    return Object.values(
      data.map(parseUserDocument).reduce(latestOnly, initialMap),
    ).filter(pendingOnly);
  }

  public async getUser(uuid: string): Promise<IAccountsUser | undefined> {
    try {
      const response = await this.request({
        url: `/users/${uuid}`,
      });

      const data: IAccountsUserResponse = response.data;

      return parseUser(data);
    } catch (err) {
      if (err.response.status === 404) {
        return;
      }

      throw err;
    }
  }

  public async getUsers(
    uuids: ReadonlyArray<string>,
  ): Promise<ReadonlyArray<IAccountsUser>> {
    const response = await this.request({
      url: `/users?uuids=${uuids.join(',')}`,
      method: 'get',
    });

    const parsedResponse: IAccountsUsersResponse = response.data;

    return parsedResponse.users.map(parseUser);
  }

  public async getUserByEmail(
    email: string,
  ): Promise<IAccountsUser | undefined> {
    const response = await this.request({
      url: `/users?email=${email}`,
      method: 'get',
    });

    const parsedResponse: IAccountsUsersResponse = response.data;

    if (parsedResponse.users.length === 0) {
      return;
    }

    if (parsedResponse.users.length > 1) {
      throw new Error(
        'getUserByEmail received more than one result from Accounts API',
      );
    }

    return parseUser(parsedResponse.users[0]);
  }

  public async createUser(
    uuid: string,
    username: string,
    email: string,
  ): Promise<boolean> {
    const response = await this.request({
      url: '/users/',
      method: 'post',
      data: JSON.stringify({
        user_uuid: uuid,
        username,
        user_email: email,
      }),
    });

    return response.status === 201;
  }
}

function pendingOnly(doc: IUserDocument): boolean {
  return doc.agreementDate === undefined;
}

function latestOnly(
  docs: { readonly [key: string]: IUserDocument },
  doc: IUserDocument,
) {
  const reducedDocs = { ...docs };

  if (!reducedDocs[doc.name]) {
    reducedDocs[doc.name] = doc;
  }
  if (reducedDocs[doc.name].validFrom < doc.validFrom) {
    reducedDocs[doc.name] = doc;
  }

  return reducedDocs;
}

function parseTimestamp(s: string): Date {
  const m = moment(s, moment.ISO_8601);
  if (!m.isValid()) {
    throw new Error(`AccountsClient: invalid date format: ${s}`);
  }

  return moment(s, moment.ISO_8601).toDate();
}

function parseDocument(doc: IDocumentResponse): IDocument {
  return {
    name: doc.name,
    validFrom: parseTimestamp(doc.valid_from),
    content: doc.content,
  };
}

function parseUserDocument(doc: IUserDocumentResponse): IUserDocument {
  return {
    ...parseDocument(doc),
    agreementDate: doc.agreement_date
      ? parseTimestamp(doc.agreement_date)
      : undefined,
  };
}

function parseUser(user: IAccountsUserResponse): IAccountsUser {
  return {
    uuid: user.user_uuid,
    username: user.username,
    email: user.user_email,
  };
}

async function request(
  req: AxiosRequestConfig,
  logger: BaseLogger,
): Promise<AxiosResponse> {
  const reqWithDefaults: AxiosRequestConfig = {
    method: 'get',
    validateStatus,
    timeout: DEFAULT_TIMEOUT,
    ...req,
  };
  const instance = axios.create();
  intercept(instance, 'accounts', logger);
  const response = await instance.request(reqWithDefaults);
  if (response.status < 200 || response.status >= 300) {
    let msg = `AccountsClient: ${reqWithDefaults.method} ${reqWithDefaults.url} failed with status ${response.status}`;
    if (typeof response.data === 'object') {
      msg = `${msg} and data ${JSON.stringify(response.data)}`;
    }
    throw responseError(msg, req, response.status, reqWithDefaults, response);
  }

  return response;
}

function validateStatus(status: number) {
  return status > 0 && status < 501;
}

// This is taken from the unexported axios/lib/core/enhanceError.js.
// It's needed because we trap all response codes and wrap them in
// some error handling that sets a human friendly error message.
// That behaviour is expected by other methods.
function responseError(
  message: string,
  config: object,
  responseCode: number,
  req: AxiosRequestConfig,
  response: AxiosResponse,
) {
  const err = new Error(message) as any;
  err.config = config;
  err.code = responseCode;
  err.request = req;
  err.response = response;

  return err;
}
