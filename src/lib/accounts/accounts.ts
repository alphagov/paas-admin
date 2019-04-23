import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import moment from 'moment';
import { BaseLogger } from 'pino';

import {intercept} from '../axios-logger/axios';

const DEFAULT_TIMEOUT = 5000;

export interface IDocumentResponse {
  name: string;
  valid_from: string;
  content: string;
}

export interface IUserDocumentResponse extends IDocumentResponse {
  agreement_date: string | null;
}

export interface IDocument {
  name: string;
  validFrom: Date;
  content: string;
}

export interface IUserDocument extends IDocument {
  agreementDate: Date | null;
}

export interface IAccountsClientConfig {
  readonly apiEndpoint: string;
  readonly secret: string;
  readonly logger: BaseLogger;
}

export class AccountsClient {
  constructor(private readonly config: IAccountsClientConfig) {
    this.config = config;
  }

  public async request(req: AxiosRequestConfig): Promise<AxiosResponse> {
    return request({
      baseURL: this.config.apiEndpoint,
      auth: {
        username: 'admin',
        password: this.config.secret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      ...req,
    }, this.config.logger);
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

  public async createAgreement(documentName: string, userUUID: string): Promise<boolean> {
    await this.request({
      method: 'POST',
      url: `/agreements`,
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

  public async getPendingDocumentsForUserUUID(uuid: string): Promise<ReadonlyArray<IUserDocument>> {
    const response = await this.request({
      url: `/users/${uuid}/documents`,
    });
    const data: ReadonlyArray<IUserDocumentResponse> = response.data;
    const initialMap: {[key: string]: IUserDocument} = {};
    return Object.values(data.map(parseUserDocument).reduce(latestOnly, initialMap))
      .filter(pendingOnly);
  }
}

function pendingOnly(doc: IUserDocument): boolean {
  return doc.agreementDate === null;
}

function latestOnly(docs: {readonly [key: string]: IUserDocument}, doc: IUserDocument) {
  const reducedDocs = {...docs};

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
    agreementDate: doc.agreement_date ? parseTimestamp(doc.agreement_date) : null,
  };
}

async function request(req: AxiosRequestConfig, logger: BaseLogger): Promise<AxiosResponse> {
  const reqWithDefaults = {
    method: 'get',
    validateStatus,
    timeout: DEFAULT_TIMEOUT,
    ...req,
  };
  const instance = axios.create();
  intercept(instance, 'billing', logger);
  const response = await instance.request(reqWithDefaults);
  if (response.status < 200 || response.status >= 300) {
    let msg = `AccountsClient: ${reqWithDefaults.method} ${reqWithDefaults.url} failed with status ${response.status}`;
    if (typeof response.data === 'object') {
      msg = `${msg} and data ${JSON.stringify(response.data)}`;
    }
    throw new Error(msg);
  }
  return response;
}

function validateStatus(status: number) {
  return status > 0 && status < 501;
}
