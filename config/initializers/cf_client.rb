require 'cf'

Rails.configuration.cf_client =
  if Rails.env.test?
    require_relative '../../spec/fakes/cf/fake_client'
    CF::FakeClient
  else
    CF::Client
  end
