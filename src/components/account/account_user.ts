import {IUaaUser} from '../../lib/uaa';

export class AccountUser {
  constructor(private user: IUaaUser) {
  }

  get name(): string {
    return `${this.user.name.givenName} ${this.user.name.familyName}`;
  }

  get username(): string {
    return this.user.userName;
  }

  get authenticationMethod(): string {
    switch (this.user.origin) {
      case 'uaa':
        return 'Username & password';
      case 'google':
        return 'Google';
      case 'microsoft':
        return 'Microsoft';
    }

    return 'Unknown';
  }

  get isGDSUser(): boolean {
    return this.username.endsWith('@digital.cabinet-office.gov.uk');
  }

  get origin(): string {
    return this.user.origin;
  }
}
