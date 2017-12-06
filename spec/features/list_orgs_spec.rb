require 'rails_helper'
require 'capybara/rails'

describe "listing orgs" do
  include Rack::Test::Methods

  let(:client) { Rails.configuration.cf_client.new }

  around do |example|
    logger = OmniAuth.config.logger
    Rails.configuration.cf_client.reset!
    example.run
    OmniAuth.config.mock_auth[:cloudfoundry] = nil
    OmniAuth.config.logger = logger
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

      client.create_org(name: "Fleming Inc.")

      visit '/'

      expect(page.body).to include("Fleming Inc.")
    end
  end

  context "when not authorised to list orgs" do
    let(:null_logger) { double('null logger', error: nil) }

    before do
      OmniAuth.config.mock_auth[:cloudfoundry] = :not_allowed
      OmniAuth.config.logger = null_logger
    end

    it "displays an error" do
      visit '/'
      expect(page.body).to include('Unauthorised')
    end

    it "logs" do
      visit '/'
      expect(null_logger).to have_received(:error).
        with("(cloudfoundry) Authentication failure! not_allowed encountered.")
    end
  end
end
