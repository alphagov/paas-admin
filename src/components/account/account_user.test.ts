import { AccountUser } from './account_user';

describe('AccountUser', () => {
  describe('name', () => {
    it('name combines user\'s given and family names', () => {
      // We don't have a full implementation of this type
      // because it's used to represent a JSON payload
      const uaaUser: any = {
        name: {
          familyName: 'Name',
          givenName: 'User',
        },
      };

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.name).toEqual('User Name');
    });
  });

  describe('username', () => {
    it('returns the users username', () => {
      const uaaUser: any = { userName: 'foo@bar.org' };

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.username).toEqual('foo@bar.org');
    });
  });

  describe('authenticationMethod', () => {
    it('returns u&p if the user\'s origin is uaa', () => {
      const uaaUser: any = { origin: 'uaa' };

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.authenticationMethod).toEqual('Username & password');
    });

    it('returns google if the user\'s origin is google', () => {
      const uaaUser: any = { origin: 'google' };

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.authenticationMethod).toEqual('Google');
    });

    it('returns unknown if the user\'s origin is not uaa or google', () => {
      const uaaUser: any = { origin: null };

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.authenticationMethod).toEqual('Unknown');
    });
  });

  describe('origin', () => {
    it('returns the origin of the underlying user', () => {
      const uaaUser: any = { origin: 'foo' };

      const acctUser = new AccountUser(uaaUser);
      expect(acctUser.origin).toEqual('foo');
    });
  });
});
