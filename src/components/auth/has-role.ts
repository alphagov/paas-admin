import jwt from 'jsonwebtoken';

export const CLOUD_CONTROLLER_ADMIN = 'cloud_controller.admin';
export const CLOUD_CONTROLLER_READ_ONLY_ADMIN = 'cloud_controller.admin_read_only';
export const CLOUD_CONTROLLER_GLOBAL_AUDITOR = 'cloud_controller.global_auditor';

interface IToken {
  readonly exp: number;
  readonly scope: ReadonlyArray<string>;
  readonly user_id: string;
  readonly origin: string;
}

export class Token {
  public readonly expiry: number;
  public readonly scopes: ReadonlyArray<string>;
  public readonly userID: string;
  public readonly origin: string;

  constructor(public readonly accessToken: string, public readonly signingKeys: ReadonlyArray<string>) {
    const rawToken = verify(accessToken, signingKeys);

    this.expiry = rawToken.exp;
    this.scopes = rawToken.scope;
    this.userID = rawToken.user_id;
    this.origin = rawToken.origin;
  }

  public hasScope(scope: string): boolean {
    return this.scopes.includes(scope);
  }

  public hasAnyScope(...scopes: string[]): boolean { // tslint:disable-line:readonly-array
    for (const scope of scopes) {
      if (this.scopes.includes(scope)) {
        return true;
      }
    }

    return false;
  }
}

function verify(accessToken: string, signingKeys: ReadonlyArray<string>): IToken {
  let rawToken: any;
  let jwtError;

  for (const key of signingKeys) {
    try {
      rawToken = jwt.verify(accessToken, key);
      break; // Break out of the for loop, in order not to continue testing remaining keys.
    } catch (err) {
      // We're iterating over each key, in attempt to verify the JWT token.
      // Throwing an error would prevent the next key to be tried.
      jwtError = err;
    }
  }

  if (typeof rawToken === 'undefined') {
    throw jwtError;
  }

  if (typeof rawToken !== 'object') {
    throw new Error('jwt: could not verify the token as no object has been verified');
  }

  if (!rawToken.exp) {
    throw new Error('jwt: could not verify the token as no exp has been decoded');
  }

  if (!rawToken.origin) {
    throw new Error('jwt: could not verify the token as no origin has been decoded');
  }

  if (!Array.isArray(rawToken.scope)) {
    throw new Error('jwt: could not verify the token as no scope(s) has been decoded');
  }

  return {
    exp: rawToken.exp,
    scope: rawToken.scope,
    user_id: rawToken.user_id,
    origin: rawToken.origin,
  };
}
