Rails.application.configure do
  # Settings specified here will take precedence over those in config/application.rb.

  # In the design environment your application's code is reloaded on
  # every request. This slows down response time but is perfect for development
  # since you don't have to restart the web server when you make code changes.
  config.cache_classes = false

  # Do not eager load code on boot.
  config.eager_load = false

  # Show full error reports.
  config.consider_all_requests_local = true

  # Disable caching. By default caching is disabled.
  config.action_controller.perform_caching = false

  # Don't care if the mailer can't send.
  config.action_mailer.raise_delivery_errors = false
  config.action_mailer.perform_caching = false

  # Print deprecation notices to the Rails logger.
  config.active_support.deprecation = :log

  # Debug mode disables concatenation and preprocessing of assets.
  # This option may cause significant delays in view rendering with a large
  # number of complex assets.
  config.assets.debug = true

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # Raises error for missing translations
  # config.action_view.raise_on_missing_translations = true

  # Use an evented file watcher to asynchronously detect changes in source code,
  # routes, locales, etc. This feature depends on the listen gem.
  config.file_watcher = ActiveSupport::EventedFileUpdateChecker

  # We can override the default environment we don't want to really connect to
  # anything in design mode
  ENV["CF_API_ENDPOINT"] = "none"
  ENV["CF_TOKEN_ENDPOINT"] = "none"
  ENV["CF_AUTH_ENDPOINT"] = "none"
  ENV["CF_CLIENT_ID"] = "none"
  ENV["CF_CLIENT_SECRET"] = "none"

  # If design mode we skip authentication and use the CF::FakeClient preloaded with
  # a bunch of fixtures. This makes working on styling easier and without the
  # need to have a full cf environment running
  OmniAuth.config.test_mode = true
  OmniAuth.config.mock_auth[:cloudfoundry] = OmniAuth::AuthHash.new(
    info:        {
      name: "jeff.jefferson@not-real.dept.gov.uk",
    },
    credentials: {
      token:  CF::UAA::TokenCoder.encode({
        exp: Time.now.to_i + 10000,
      }, skey: "shhh"),
      secret: "shhh",
    },
    provider:    "cloudfoundry",
    uid:         "123456",
  )

  # create some fixtures to load into the environment
  require_relative "../../spec/fakes/cf/fake_client"
  CF::FakeClient.reset!
  cf = CF::FakeClient.new
  cf.create_org(
    name:   "org 1",
    status: CF::Org::ACTIVE,
  )
  cf.create_org(
    name:   "org 2",
    status: CF::Org::ACTIVE,
  )
end
