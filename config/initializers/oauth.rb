Rails.application.config.middleware.use OmniAuth::Builder do
  auth_server_url = ENV.fetch("AUTH_SERVER_URL")
  token_server_url = ENV.fetch("TOKEN_SERVER_URL")
  client_id = ENV.fetch('OAUTH_CLIENT_ID')
  secret = ENV.fetch('OAUTH_CLIENT_SECRET')

  provider(
    :cloudfoundry,
    client_id,
    secret,
    auth_server_url: auth_server_url,
    token_server_url: token_server_url
  )
end
