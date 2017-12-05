require 'rails_helper'
require 'rack/test'

describe "listing orgs" do
  include Rack::Test::Methods

  def app
    Rails.application
  end

  context "when not authenticated" do
    it "sends the user to the special omniauth location" do
      get '/'
      follow_redirect!
      expect(last_response.status).to eq(302)
      actual = last_response.header['Location']

      expected = [
        ENV.fetch('AUTH_SERVER_URL'),
        '/oauth/authorize',
        "?client_id=#{ENV.fetch('OAUTH_CLIENT_ID')}",
        '&response_type=code',
        "&redirect_uri=#{CGI.escape("http://example.org/auth/cloudfoundry/callback")}",
        "&state="
      ].join
      expect(actual).to start_with(expected)
    end
  end

  context "when authenticated" do
    it "displays the user's orgs"
  end
end
