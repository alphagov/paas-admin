require "cf"

Rails.configuration.cf_api_endpoint = ENV.fetch("CF_API_ENDPOINT")
Rails.configuration.skip_tls_verification = ENV["SKIP_TLS_VERIFICATION"] == "true"

Rails.configuration.cf_client = case Rails.env
                                when "test", "design"
                                  require_relative "../../spec/fakes/cf/fake_client"
                                  CF::FakeClient
                                else
                                  CF::Client
                                end
