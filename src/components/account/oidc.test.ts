import jwt from 'jsonwebtoken';
import nock from 'nock';
import * as jose from 'node-jose';
import {URL} from 'url';
import UAAClient from '../../lib/uaa/uaa';
import {createTestContext} from '../app/app.test-helpers';
import OIDC, * as oidc from './oidc';
import * as fixtures from './oidc.test.fixtures';

jest.mock('../../lib/uaa/uaa');

const nockDiscovery = nock('https://login.microsoftonline.com').persist();

nockDiscovery
  .get('/tenant_id/v2.0/.well-known/openid-configuration')
  .reply(200, JSON.stringify(fixtures.microsoftDiscoveryDoc));

const nockGoogleDiscovery = nock('https://accounts.google.com').persist();

nockGoogleDiscovery
  .get('/.well-known/openid-configuration')
  .reply(200, JSON.stringify(fixtures.googleDiscoveryDoc));

describe('oidc test suite', () => {
  const redirectURL = 'https://admin.cloud.service.gov.uk/oidc/callback';
  const clientID = 'CLIENTID';
  const clientSecret = 'CLIENTSECRET';
  const discoveryURL = 'https://login.microsoftonline.com/tenant_id/v2.0/.well-known/openid-configuration';

  beforeEach(() => {
    // @ts-ignore
    UAAClient.mockClear();
  });

  it('generates a correct auth url based on openid discovery', async () => {
    const oidcClient = new OIDC(clientID, clientSecret, discoveryURL, redirectURL);
    const ctx = createTestContext();

    const response = await oidcClient.getAuthorizationOIDCURL(ctx.session);

    let url: URL | undefined;
    expect(() => {
      url = new URL(response);
    }).not.toThrowError();

    expect(url).not.toBeFalsy();
    if (url) {
      expect(url.hostname).toEqual('login.microsoftonline.com');
      expect(url.pathname).toEqual('/tenant_id/oauth2/v2.0/authorize');
      expect(url.searchParams.get('response_type')).toEqual('code');
      expect(url.searchParams.get('client_id')).toEqual(clientID);
      expect(url.searchParams.get('redirect_uri')).toEqual(redirectURL);
      expect(url.searchParams.has('scope')).toEqual(true);
      expect(url.searchParams.get('scope')).toContain('openid');
      expect(url.searchParams.has('state')).toEqual(true);
    }
  });

  it('trades an authorization code for an id token', async () => {
    // Create signing key
    const key = await createJOSEKey();

    // Serve signing key at JWKS uri
    configureJWKSEndpoint(fixtures.microsoftDiscoveryDoc.jwks_uri, key);

    // Create and sign token
    const token = createAndSignIDToken(key);

    // Serve token from token endpoint
    const tokenNock = configureTokenEndpoint(fixtures.microsoftDiscoveryDoc.token_endpoint, token);

    // Set up OIDC client
    const uaa = new UAAClient({apiEndpoint: ''});
    const ctx = createTestContext();
    const authResponse: oidc.IAuthorizationCodeResponse = {code: 'testcode', state: 'teststate'};
    ctx.session[oidc.KEY_STATE] = {state: authResponse.state, response_type: 'code'};
    const providerName = 'microsoft';

    const client = new OIDC(clientID, clientSecret, discoveryURL, redirectURL);

    const success = await client.oidcCallback(ctx, authResponse, uaa, providerName);

    expect(tokenNock.isDone()).toBeTruthy();
    expect(success).toBeTruthy();
  });

  it('updates the UAA user with the Microsoft OID from the id token', async () => {
    // Create signing key
    const key = await createJOSEKey();

    // Serve signing key at JWKS uri
    configureJWKSEndpoint(fixtures.microsoftDiscoveryDoc.jwks_uri, key);

    // Create and sign token
    const token = createAndSignIDToken(key);

    // Serve token from token endpoint
    configureTokenEndpoint(fixtures.microsoftDiscoveryDoc.token_endpoint, token, true);

    // Set up OIDC client
    const uaa = new UAAClient({apiEndpoint: ''});
    const ctx = createTestContext();
    const authResponse: oidc.IAuthorizationCodeResponse = {code: 'testcode', state: 'teststate'};
    ctx.session[oidc.KEY_STATE] = {state: authResponse.state, response_type: 'code'};
    const providerName = 'microsoft';

    const client = new OIDC(clientID, clientSecret, discoveryURL, redirectURL);

    const success = await client.oidcCallback(ctx, authResponse, uaa, providerName);

    expect(success).toBeTruthy();
    expect(uaa.setUserOrigin).toHaveBeenCalledWith(ctx.token.userID, providerName, 'ms-oid');
  });

  it('updates the UAA user with the Google SUB from the id token', async () => {
    // Create signing key
    const key = await createJOSEKey();

    // Serve signing key at JWKS uri
    configureJWKSEndpoint(fixtures.googleDiscoveryDoc.jwks_uri, key);

    // Create and sign token
    const token = createAndSignIDTokenGoogle(key);

    // Serve token from token endpoint
    configureTokenEndpoint(fixtures.googleDiscoveryDoc.token_endpoint, token, true);

    // Set up OIDC client
    const uaa = new UAAClient({apiEndpoint: ''});
    const ctx = createTestContext();
    const authResponse: oidc.IAuthorizationCodeResponse = {code: 'testcode', state: 'teststate'};
    ctx.session[oidc.KEY_STATE] = {state: authResponse.state, response_type: 'code'};
    const providerName = 'google';
    const googleDiscoveryURL = 'https://accounts.google.com/.well-known/openid-configuration';

    const client = new OIDC(clientID, clientSecret, googleDiscoveryURL, redirectURL);

    const success = await client.oidcCallback(ctx, authResponse, uaa, providerName);

    expect(success).toBeTruthy();
    expect(uaa.setUserOrigin).toHaveBeenCalledWith(ctx.token.userID, providerName, 'google-sub');
  });

  it('returns false and log an error when the authorization code cannot be traded for an access token', async () => {
    // Create two keys. One to sign the token, one to serve from the JWKS endpoint.
    // This will trigger an error, because the token can't be validated.
    const signingKey = await createJOSEKey();
    const jwksKey = await createJOSEKey();

    // Serve jwksKey at JWKS endpoint
    configureJWKSEndpoint(fixtures.microsoftDiscoveryDoc.jwks_uri, jwksKey);

    // Create and sign token with signing key
    const token = createAndSignIDToken(signingKey);

    // Serve token from token endpoint
    configureTokenEndpoint(fixtures.microsoftDiscoveryDoc.token_endpoint, token, true);

    // Create a mocked UAA client
    const uaa = new UAAClient({apiEndpoint: ''});

    // Set up session state
    const ctx = createTestContext();
    const authResponse: oidc.IAuthorizationCodeResponse = {code: 'testcode', state: 'teststate'};
    ctx.session[oidc.KEY_STATE] = {state: authResponse.state, response_type: 'code'};

    // Set up logger mock
    ctx.app.logger.error = jest.fn();

    // Create an OIDC client
    const client = new OIDC(clientID, clientSecret, discoveryURL, redirectURL);

    const actual = await client.oidcCallback(ctx, authResponse, uaa, 'microsoft');

    expect(actual).toBeFalsy();
    expect(ctx.app.logger.error).toHaveBeenCalledTimes(1);
  });
});

async function createJOSEKey(): Promise<jose.JWK.Key> {
  const store: jose.JWK.KeyStore = jose.JWK.createKeyStore();
  const key: jose.JWK.Key = await store.generate(
    'RSA',
    1024,
    {
      use: 'sig',
    });

  await store.add(key);

  return key;
}

function createAndSignIDToken(key: jose.JWK.Key) {
  const payload: object = {
    oid: 'ms-oid',
    iss: 'https://login.microsoftonline.com/tenant_id/v2.0',
    aud: 'CLIENTID',
    sub: 'subject',
    iat: (Date.now() / 1000) - 100,
    exp: (Date.now() / 1000) + 100,
  };
  return jwt.sign(
    payload,
    key.toPEM(true),
    {keyid: key.kid, algorithm: 'RS256'},
  );
}

function createAndSignIDTokenGoogle(key: jose.JWK.Key) {
  const payload: object = {
    iss: 'https://accounts.google.com',
    aud: 'CLIENTID',
    sub: 'google-sub',
    iat: (Date.now() / 1000) - 100,
    exp: (Date.now() / 1000) + 100,
  };
  return jwt.sign(
    payload,
    key.toPEM(true),
    {keyid: key.kid, algorithm: 'RS256'},
  );
}

function configureJWKSEndpoint(jwksEndpoint: string, key: jose.JWK.Key) {
  const jwksEndpointURL = new URL(jwksEndpoint);
  nock(jwksEndpointURL.origin)
    .get(jwksEndpointURL.pathname).reply(200, JSON.stringify({keys: [key]}));
}

function configureTokenEndpoint(tokenEndpoint: string, token: string, persist: boolean = false): nock.Scope {
  const tokenEndpointURL = new URL(tokenEndpoint);
  const tokenNock = nock(tokenEndpointURL.origin);

  if (persist) {
    tokenNock.persist();
  }
  tokenNock.post(tokenEndpointURL.pathname).reply(200, JSON.stringify({
    id_token: token,
    token_type: 'bearer',
    expires_in: 10000,
  }));

  return tokenNock;
}
