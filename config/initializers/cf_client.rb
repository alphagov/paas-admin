require 'cf'

Rails.configuration.cf_client =
  if Rails.env.test?
    require_relative '../../spec/fakes/cf/fake_client'
    CF::FakeClient.new
  else
    CF::Client.new
  end
