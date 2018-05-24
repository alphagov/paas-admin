import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import moment from 'moment';

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
    });
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
    return Object.values(
      data.map(parseUserDocument)
      .reduce(latestOnly, initialMap),
    ).filter(pendingOnly);
  }
}

function pendingOnly(doc: IUserDocument) {
  return doc.agreementDate === null;
}

function latestOnly(docs: {[key: string]: IUserDocument}, doc: IUserDocument) {
    if (!docs[doc.name]) {
      docs[doc.name] = doc;
    }
    if (docs[doc.name].validFrom < doc.validFrom) {
      docs[doc.name] = doc;
    }
    return docs;
}

function parseTimestamp(s: string): Date {
  const m = moment(s, moment.ISO_8601);
  if (!m.isValid()) {
    throw new Error(`invalid date format: ${s}`);
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

async function request(req: AxiosRequestConfig): Promise<AxiosResponse> {
  const reqWithDefaults = {
    method: 'get',
    validateStatus,
    timeout: DEFAULT_TIMEOUT,
    ...req,
  };
  const response = await axios.request(reqWithDefaults);
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
