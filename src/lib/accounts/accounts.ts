import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import moment from 'moment';
import { BaseLogger } from 'pino';

import { intercept } from '../axios-logger/axios';

const DEFAULT_TIMEOUT = 5000;

export interface IDocumentResponse {
  readonly name: string;
  readonly valid_from: string;
  readonly content: string;
}

export interface IUserDocumentResponse extends IDocumentResponse {
  readonly agreement_date?: string;
}

export interface IDocument {
  readonly name: string;
  readonly validFrom: Date;
  readonly content: string;
}

export interface IUserDocument extends IDocument {
  readonly agreementDate?: Date;
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

function pendingOnly(doc: IUserDocument): boolean {
  return doc.agreementDate === undefined;
}

function latestOnly(
  docs: { readonly [key: string]: IUserDocument },
  doc: IUserDocument,
): { readonly [key: string]: IUserDocument } {
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
    content: doc.content,
    name: doc.name,
    validFrom: parseTimestamp(doc.valid_from),
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
    email: user.user_email,
    username: user.username,
    uuid: user.user_uuid,
  };
}

function validateStatus(status: number): boolean {
  return status > 0 && status < 501;
}

// This is taken from the unexported axios/lib/core/enhanceError.js.
// It's needed because we trap all response codes and wrap them in
// some error handling that sets a human friendly error message.
// That behaviour is expected by other methods.
function responseError(
  message: string,
  responseCode: number,
  req: AxiosRequestConfig,
): any {
  const err = new Error(message) as any;
  err.code = responseCode;
  err.request = req;
  err.response = { status: responseCode };

  return err;
}

async function request(
  req: AxiosRequestConfig,
  logger: BaseLogger,
): Promise<AxiosResponse> {
  const reqWithDefaults: AxiosRequestConfig = {
    method: 'get',
    timeout: DEFAULT_TIMEOUT,
    validateStatus,

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
    throw responseError(
      msg,
      response.status,
      {
        ...reqWithDefaults,

        /* redacted fields */
        auth: undefined,
      });
  }

  return response;
}

export class AccountsClient {
  constructor(private readonly config: IAccountsClientConfig) {
    this.config = config;
  }

  public async request(req: AxiosRequestConfig): Promise<AxiosResponse> {
    return await request(
      {
        auth: {
          password: this.config.secret,
          username: 'admin',
        },
        baseURL: this.config.apiEndpoint,
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
      data: JSON.stringify({
        content,
      }),
      method: 'PUT',
      url: `/documents/${name}`,
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
      data: JSON.stringify({
        document_name: documentName,
        user_uuid: userUUID,
      }),
      method: 'POST',
      url: '/agreements',
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
    const initialMap: { readonly [key: string]: IUserDocument } = {};

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
      method: 'get',
      url: `/users?uuids=${uuids.join(',')}`,
    });

    const parsedResponse: IAccountsUsersResponse = response.data;

    return parsedResponse.users.map(parseUser);
  }

  public async getUserByEmail(
    email: string,
  ): Promise<IAccountsUser | undefined> {
    const response = await this.request({
      method: 'get',
      url: '/users',
      params: { email },
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
      data: JSON.stringify({
        user_email: email,
        user_uuid: uuid,
        username,
      }),
      method: 'post',
      url: '/users/',
    });

    return response.status === 201;
  }
}
