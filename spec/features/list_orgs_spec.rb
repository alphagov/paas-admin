require 'rails_helper'
require 'rack/test'

describe "listing orgs" do
  include Rack::Test::Methods

  def app
    Rails.application
  end

  before do
    OmniAuth.config.mock_auth[:cloudfoundry] = nil
  end

  context "when authorised to list orgs" do
    it "greets the user" do
      token_body = {'foo': 'bar'}
      token = CF::UAA::TokenCoder.encode(token_body, skey: "ilovesecrets")

      OmniAuth.config.mock_auth[:cloudfoundry] = OmniAuth::AuthHash.new(
        info: {
          name: "Bob Fleming",
        },
        credentials: {
          token: token,
          secret: "deadbeeff33df00d",
        },
        provider: 'cloudfoundry',
        uid: '123456',
      )
      get '/'
      follow_redirect!
      follow_redirect!
      follow_redirect!

      expect(last_response.body).to include("Cool token: #{token}")
    end
  end

  context "when not authorised to list orgs" do
    it "displays an error" do
      OmniAuth.config.mock_auth[:cloudfoundry] = :not_allowed
      get '/'
      follow_redirect!
      follow_redirect!
      follow_redirect!

      expect(last_response.body).to include('Unauthorised')
    end
  end
end
