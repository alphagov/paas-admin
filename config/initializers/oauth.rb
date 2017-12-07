
Rails.application.config.middleware.use OmniAuth::Builder do

  auth_server_url = ENV.fetch("CF_AUTH_ENDPOINT")
  token_server_url = ENV.fetch("CF_TOKEN_ENDPOINT")
  client_id = ENV.fetch('CF_CLIENT_ID')
  secret = ENV.fetch('CF_CLIENT_SECRET')

  provider(
    :cloudfoundry,
    client_id,
    secret,
    auth_server_url: auth_server_url,
    token_server_url: token_server_url,
    skip_ssl_validation: ENV['SKIP_TLS_VERIFICATION'] == 'true',
  )
end
