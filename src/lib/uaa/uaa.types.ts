// These interfaces are extracted
// from the example payloads given
// by the UAA API documentation

export interface IUaaName {
  readonly familyName: string
  readonly givenName: string
}

export interface IUaaEmail {
  readonly value: string
  readonly primary: boolean
}

export interface IUaaGroup {
  readonly display: string
  readonly type: string
  readonly value: string
}

export interface IUaaApproval {
  readonly clientId: string
  readonly lastUpdatedAt: string
  readonly scope: string
  readonly userId: string
  readonly expiresAt: string
  readonly status: string
}

export interface IUaaPhoneNumber {
  readonly value: string
}

export interface IUaaUserMeta {
  readonly created: string
  readonly lastModified: string
  readonly version: number
}

export interface IUaaUser {
  readonly id: string
  readonly externalId: string
  readonly meta: IUaaUserMeta
  readonly userName: string
  readonly name: IUaaName
  readonly emails: readonly IUaaEmail[]
  readonly groups: readonly IUaaGroup[]
  readonly approvals: readonly IUaaApproval[]
  readonly phoneNumbers: readonly IUaaPhoneNumber[]
  readonly active: boolean
  readonly verified: boolean
  readonly origin: string
  readonly zoneId: string
  readonly passwordLastModified: string
  readonly previousLogonTime: number
  readonly lastLogonTime: number
  readonly schemas: readonly string[]
}
