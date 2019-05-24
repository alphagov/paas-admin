// These interfaces are extracted
// from the example payloads given
// by the UAA API documentation

export interface IUaaName {
  familyName: string;
  givenName: string;
}

export interface IUaaEmail {
  value: string;
  primary: boolean;
}

export interface IUaaGroup {
  display: string;
  'type': string;
  value: string;
}

export interface IUaaApproval {
  clientId: string;
  lastUpdatedAt: string;
  scope: string;
  userId: string;
  expiresAt: string;
  status: string;
}

export interface IUaaPhoneNumber {
  value: string;
}

export interface IUaaUserMeta {
  created: string;
  lastModified: string;
  version: number;
}

export interface IUaaUser {
  id: string;
  externalId: string;
  meta: IUaaUserMeta;
  userName: string;
  name: IUaaName;
  emails: readonly IUaaEmail[];
  groups: readonly IUaaGroup[];
  approvals: readonly IUaaApproval[];
  phoneNumbers: readonly IUaaPhoneNumber[];
  active: boolean;
  verified: boolean;
  origin: string;
  zoneId: string;
  passwordLastModified: string;
  previousLogonTime: number;
  lastLogonTime: number;
  schemas: readonly string[];
}
