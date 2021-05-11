import { IUaaUser } from '../../lib/uaa'

export class AccountUser {
  constructor (private readonly user: IUaaUser) {}

  get name (): string {
    return `${this.user.name.givenName} ${this.user.name.familyName}`
  }

  get username (): string {
    return this.user.userName
  }

  get authenticationMethod (): string {
    switch (this.user.origin) {
      case 'uaa':
        return 'Username & password'
      case 'google':
        return 'Google'
    }

    return 'Unknown'
  }

  get origin (): string {
    return this.user.origin
  }
}
