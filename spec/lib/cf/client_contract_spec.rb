require 'cf/client'
require_relative '../../fakes/cf/fake_client'

RSpec.shared_examples_for "a CF client" do
  it "can create, list and delete orgs" do
    org1_name = generate_org_name
    org2_name = generate_org_name
    expect(org1_name).not_to be_empty
    expect(org1_name).not_to eq(org2_name)

    org1 = client.create_org(
      name: org1_name,
      status: CF::Org::ACTIVE,
    )
    expect(org1.guid).not_to be_empty
    expect(org1.name).to eq(org1_name)
    expect(org1.status).to eq(CF::Org::ACTIVE)

    org2 = client.create_org(
      name: org2_name,
      status: CF::Org::ACTIVE,
    )
    expect(org2.guid).not_to be_empty
    expect(org2.name).to eq(org2_name)
    expect(org2.status).to eq(CF::Org::ACTIVE)

    orgs = client.orgs
    expect(orgs).to include(org1)
    expect(orgs).to include(org2)

    client.delete_org(org1.guid)
    client.delete_org(org2.guid)

    orgs = client.orgs
    expect(orgs).not_to include(org1)
    expect(orgs).not_to include(org2)
  end
end

module CF
  RSpec.describe Client do
    test_token = ENV.fetch('CONTRACT_TEST_TOKEN', '')
    before do
      if test_token.empty?
        skip('
          Skipping client integration tests.
          Environment variable CONTRACT_TEST_TOKEN not set.

          Set CF_API_ENDPOINT and CONTRACT_TEST_TOKEN to enable.
        ')
      end
    end

    it_behaves_like "a CF client" do
      subject(:client) {
        Client.new(
          api_endpoint: Rails.configuration.cf_api_endpoint,
          token: test_token,
          skip_tls_verification: Rails.configuration.skip_tls_verification,
        )
      }
    end
  end

  RSpec.describe FakeClient do
    subject(:client) { FakeClient.new }

    it_behaves_like "a CF client"

    it "can reset its own state, for easier testing" do
      client.create_org(
        name: "Jess's team",
        status: CF::Org::ACTIVE,
      )
      client.create_org(
        name: "Bob's team",
        status: CF::Org::ACTIVE,
      )

      FakeClient.reset!

      expect(client.orgs).to be_empty
    end
  end
end

def generate_org_name
  "test-org-#{(0...8).map { (65 + rand(26)).chr }.join}"
end
