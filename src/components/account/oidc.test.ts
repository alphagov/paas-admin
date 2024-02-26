import { URL } from 'url';

import jwt from 'jsonwebtoken';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import * as jose from 'node-jose';
import { CallbackParamsType } from 'openid-client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import UAAClient from '../../lib/uaa/uaa';
import { createTestContext } from '../app/app.test-helpers';

import OIDC, * as oidc from './oidc';
import * as fixtures from './oidc.test.fixtures';

vi.mock('../../lib/uaa/uaa');

async function createJOSEKey(): Promise<jose.JWK.Key> {
  const store: jose.JWK.KeyStore = jose.JWK.createKeyStore();
  const key: jose.JWK.Key = await store.generate('RSA', 2048, {
    use: 'sig',
  });

  await store.add(key);

  return key;
}

function createAndSignIDToken(key: jose.JWK.Key, claims?: {}) {
  const payload: object = {
    aud: 'CLIENTID',
    exp: Math.round(Date.now() / 1000 + 100),
    iat: Math.round(Date.now() / 1000 - 100),
    iss: 'https://login.microsoftonline.com/tenant_id/v2.0',
    oid: 'ms-oid',
    sub: 'subject',

    ...(claims || {}),
  };

  return jwt.sign(payload, key.toPEM(true), {
    algorithm: 'RS256',
    keyid: key.kid,
  });
}

describe('oidc test suite', () => {

  const mockGoogleDiscoveryUrl = 'https://accounts.google.com';
  const mockMicrosoftDiscoveryUrl = 'https://login.microsoftonline.com';

  const handlers = [
    http.get(`${mockGoogleDiscoveryUrl}/.well-known/openid-configuration`, () => {
      return new HttpResponse(
        JSON.stringify(fixtures.googleDiscoveryDoc),
      );
    }),
    http.get(`${mockMicrosoftDiscoveryUrl}/tenant_id/v2.0/.well-known/openid-configuration`, () => {
      return new HttpResponse(
        JSON.stringify(fixtures.microsoftDiscoveryDoc),
      );
    }),
  ];
  const server = setupServer(...handlers);

  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  beforeEach(() => {
    server.resetHandlers();
    // @ts-ignore
    UAAClient.mockClear();
  });
  afterAll(() => server.close());

  const redirectURL = 'https://admin.cloud.service.gov.uk/oidc/callback';
  const clientID = 'CLIENTID';
  const clientSecret = 'CLIENTSECRET';
  const discoveryURL = 'https://login.microsoftonline.com/tenant_id/v2.0/.well-known/openid-configuration';

  it('generates a correct auth url based on openid discovery', async () => {

    const oidcClient = new OIDC(
      clientID,
      clientSecret,
      discoveryURL,
      redirectURL,
    );
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

  it('updates the UAA user with the Google SUB from the id token', async () => {
    // Create signing key
    const key = await createJOSEKey();
    const jwskEndpointURL = new URL(fixtures.googleDiscoveryDoc.jwks_uri);
    const tokenEndpointURL = new URL(fixtures.googleDiscoveryDoc.token_endpoint);

    // Create and sign token
    const token = createAndSignIDToken(key, {
      iss: 'https://accounts.google.com',
      oid: 'ms-oid',
      sub: 'google-sub',
    });

    server.use(
      http.get(`${jwskEndpointURL.origin}${jwskEndpointURL.pathname}`, () => {
        return new HttpResponse(
          JSON.stringify({ keys: [key] }),
        );
      }),
      http.get(`${jwskEndpointURL.origin}${jwskEndpointURL.pathname}`, () => {
        return new HttpResponse(
          JSON.stringify({ keys: [key] }),
        );
      }),
      http.post(`${tokenEndpointURL.origin}${tokenEndpointURL.pathname}`, () => {
        return new HttpResponse(
          JSON.stringify({
            expires_in: 10000,
            id_token: token,
            token_type: 'bearer',
          }),
        );
      }),
    );

    // Set up OIDC client
    const uaa = new UAAClient({ apiEndpoint: '' });
    const ctx = createTestContext();
    const authResponse: CallbackParamsType = {
      code: 'testcode',
      state: 'teststate',
    };
    ctx.session[oidc.KEY_STATE] = {
      response_type: 'code',
      state: authResponse.state,
    };
    const providerName = 'google';
    const googleDiscoveryURL =
      'https://accounts.google.com/.well-known/openid-configuration';

    const client = new OIDC(
      clientID,
      clientSecret,
      googleDiscoveryURL,
      redirectURL,
    );

    const success = await client.oidcCallback(
      ctx,
      authResponse,
      uaa,
      providerName,
    );

    expect(success).toBeTruthy();
    expect(uaa.setUserOrigin).toHaveBeenCalledWith(
      ctx.token.userID,
      'google',
      'google-sub',
    );
    expect(uaa.setUserOrigin).not.toHaveBeenCalledWith(
      ctx.token.userID,
      'microsoft',
      'ms-oid',
    );
  });

  it('returns false and log an error when the authorization code cannot be traded for an access token', async () => {
    // Create two keys. One to sign the token, one to serve from the JWKS endpoint.
    // This will trigger an error, because the token can't be validated.
    const signingKey = await createJOSEKey();
    const jwksKey = await createJOSEKey();

    // Create and sign token with signing key
    const token = createAndSignIDToken(signingKey);

    const jwskEndpointURL = new URL(fixtures.microsoftDiscoveryDoc.jwks_uri);
    const tokenEndpointURL = new URL(fixtures.microsoftDiscoveryDoc.token_endpoint);

    server.use(
      http.get(`${jwskEndpointURL.origin}${jwskEndpointURL.pathname}`, () => {
        return new HttpResponse(
          JSON.stringify({ keys: [jwksKey] }),
        );
      }),
      http.get(`${jwskEndpointURL.origin}${jwskEndpointURL.pathname}`, () => {
        return new HttpResponse(
          JSON.stringify({ keys: [jwksKey] }),
        );
      }),
      http.post(`${tokenEndpointURL.origin}${tokenEndpointURL.pathname}`, () => {
        return new HttpResponse(
          JSON.stringify({
            expires_in: 10000,
            id_token: token,
            token_type: 'bearer',
          }),
        );
      }),
    );

    // Create a mocked UAA client
    const uaa = new UAAClient({ apiEndpoint: '' });

    // Set up session state
    const ctx = createTestContext();
    const authResponse: CallbackParamsType = {
      code: 'testcode',
      state: 'teststate',
    };
    ctx.session[oidc.KEY_STATE] = {
      response_type: 'code',
      state: authResponse.state,
    };

    // Set up logger mock
    ctx.app.logger.error = vi.fn();

    // Create an OIDC client
    const client = new OIDC(clientID, clientSecret, discoveryURL, redirectURL);

    const actual = await client.oidcCallback(
      ctx,
      authResponse,
      uaa,
      'microsoft',
    );

    expect(actual).toBeFalsy();
    expect(ctx.app.logger.error).toHaveBeenCalledTimes(1);
  });
});