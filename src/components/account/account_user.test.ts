
import { AccountUser } from './account_user';

describe('AccountUser', () => {

  describe('name', () => {
    it('name combines user\'s given and family names', () => {
      // We don't have a full implementation of this type
      // because it's used to represent a JSON payload
      const uaaUser: any = {
        name: {
          givenName: 'User',
          familyName: 'Name',
        },
      };

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.name).toEqual('User Name');
    });
  });

  describe('username', () => {
    it('returns the users username', () => {
      const uaaUser: any = {userName: 'foo@bar.org'};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.username).toEqual('foo@bar.org');
    });
  });

  describe('isGDSUser', () => {
    it('returns false if the user\'s username isn\'t a GDS one', () => {
      const uaaUser: any = {userName: 'foo@bar.org'};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.isGDSUser).toBeFalsy();
    });

    it('returns true if the user\'s primary email address is a GDS one', () => {
      const uaaUser: any = {userName: 'fake.address+paas-admin@digital.cabinet-office.gov.uk'};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.isGDSUser).toBeTruthy();
    });
  });

  describe('authenticationMethod', () => {
    it('returns u&p if the user\'s origin is uaa', () => {
      const uaaUser: any = {origin: 'uaa'};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.authenticationMethod).toEqual('Username & password');
    });

    it('returns google if the user\'s origin is google', () => {
      const uaaUser: any = {origin: 'google'};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.authenticationMethod).toEqual('Google');
    });

    it('returns microsoft if the user\'s origin is microsoft', () => {
      const uaaUser: any = {origin: 'microsoft'};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.authenticationMethod).toEqual('Microsoft');
    });

    it('returns unknown if the user\'s origin is not uaa or google', () => {
      const uaaUser: any = {origin: null};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.authenticationMethod).toEqual('Unknown');
    });
  });

  describe('origin', () => {
    it('returns the origin of the underlying user', () => {
      const uaaUser: any = {origin: 'foo'};

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.origin).toEqual('foo');
    });
  });
});
