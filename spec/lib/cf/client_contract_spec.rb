require 'cf/client'
require_relative '../../fakes/cf/fake_client'

shared_examples_for "a CF client" do
  it "can create, list and delete orgs" do
    client.orgs.each do |org|
      client.delete_org(org)
    end

    client.create_org(
      name: "PaaS Team",
      status: CF::Org::ACTIVE,
    )

    client.create_org(
      name: "gov.uk Team",
      status: CF::Org::ACTIVE,
    )

    orgs = client.orgs

    expect(orgs).to eq([
      CF::Org.new(
        name: "PaaS Team",
        status: CF::Org::ACTIVE,
      ),
      CF::Org.new(
        name: "gov.uk Team",
        status: CF::Org::ACTIVE,
      ),
    ])
  end
end

module CF
  describe Client do
    it_behaves_like "a CF client" do
      subject(:client) { Client.new }
    end
  end

  describe FakeClient do
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

      client.reset!

      expect(client.orgs).to be_empty
    end
  end
end
