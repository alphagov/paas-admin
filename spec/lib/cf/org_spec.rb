require "cf/org"

module CF
  RSpec.describe Org do
    it "is comparable" do
      expect(Org.new(name: "foo", status: Org::ACTIVE)).
        to eq(Org.new(name: "foo", status: Org::ACTIVE))

      expect(Org.new(name: "foo", status: Org::ACTIVE)).
        not_to eq(Org.new(name: "bar", status: Org::ACTIVE))
    end

    it "has readers" do
      org = Org.new(name: "foo", status: Org::ACTIVE)
      expect(org.name).to eq("foo")
      expect(org.status).to eq(Org::ACTIVE)
    end
  end
end
