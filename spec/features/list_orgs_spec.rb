require 'rails_helper'
require 'rack/test'

describe "listing orgs" do
  include Rack::Test::Methods

  def app
    Rails.application
  end

  def oauth_redirect_url
    Rails.configuration.x.oauth['redirect_url']
  end

  it "is configured" do
    expect(oauth_redirect_url).to be_present
  end

  context "when not authenticated" do
    it "sends the user to the oauth URL" do
      get '/'
      expect(last_response.status).to eq(302)
      expect(last_response.header['Location']).
        to eq(oauth_redirect_url)
    end
  end

  context "when authenticated" do
    it "displays the user's orgs"
  end
end
