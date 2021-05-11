export const microsoftDiscoveryDoc = {
  authorization_endpoint: 'https://login.microsoftonline.com/tenant_id/oauth2/v2.0/authorize',
  claims_supported: [
    'sub',
    'iss',
    'cloud_instance_name',
    'cloud_instance_host_name',
    'cloud_graph_host_name',
    'msgraph_host',
    'aud',
    'exp',
    'iat',
    'auth_time',
    'acr',
    'nonce',
    'preferred_username',
    'name',
    'tid',
    'ver',
    'at_hash',
    'c_hash',
    'email'
  ],
  cloud_graph_host_name: 'graph.windows.net',
  cloud_instance_name: 'microsoftonline.com',
  end_session_endpoint: 'https://login.microsoftonline.com/tenant_id/oauth2/v2.0/logout',
  frontchannel_logout_supported: true,
  http_logout_supported: true,
  id_token_signing_alg_values_supported: ['RS256'],
  issuer: 'https://login.microsoftonline.com/tenant_id/v2.0',
  jwks_uri: 'https://login.microsoftonline.com/tenant_id/discovery/v2.0/keys',
  msgraph_host: 'graph.microsoft.com',
  rbac_url: 'https://pas.windows.net',
  request_uri_parameter_supported: false,
  response_modes_supported: ['query', 'fragment', 'form_post'],
  response_types_supported: [
    'code',
    'id_token',
    'code id_token',
    'id_token token'
  ],
  scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
  subject_types_supported: ['pairwise'],
  tenant_region_scope: 'EU',
  token_endpoint: 'https://login.microsoftonline.com/tenant_id/oauth2/v2.0/token',
  token_endpoint_auth_methods_supported: [
    'client_secret_post',
    'private_key_jwt',
    'client_secret_basic'
  ],
  userinfo_endpoint: 'https://graph.microsoft.com/oidc/userinfo'
}

export const googleDiscoveryDoc = {
  authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  claims_supported: [
    'aud',
    'email',
    'email_verified',
    'exp',
    'family_name',
    'given_name',
    'iat',
    'iss',
    'locale',
    'name',
    'picture',
    'sub'
  ],
  code_challenge_methods_supported: ['plain', 'S256'],
  id_token_signing_alg_values_supported: ['RS256'],
  issuer: 'https://accounts.google.com',
  jwks_uri: 'https://www.googleapis.com/oauth2/v3/certs',
  response_types_supported: [
    'code',
    'token',
    'id_token',
    'code token',
    'code id_token',
    'token id_token',
    'code token id_token',
    'none'
  ],
  revocation_endpoint: 'https://oauth2.googleapis.com/revoke',
  scopes_supported: ['openid', 'email', 'profile'],
  subject_types_supported: ['public'],
  token_endpoint: 'https://oauth2.googleapis.com/token',
  token_endpoint_auth_methods_supported: [
    'client_secret_post',
    'client_secret_basic'
  ],
  userinfo_endpoint: 'https://openidconnect.googleapis.com/v1/userinfo'
}
