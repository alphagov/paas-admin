Rails.configuration.x.oauth.redirect_url =
  ENV.fetch("OAUTH_REDIRECT_URL", "https://replace.this.invalid/address")
