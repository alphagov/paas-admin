require "cf/org"

module CF
  class FakeClient
    def self.orgs
      @orgs ||= []
    end

    def self.reset!
      @orgs = []
    end

    def initialize(token: nil, api_endpoint: nil, skip_tls_verification: false); end

    def orgs
      self.class.orgs
    end

    def create_org(**args)
      args[:guid] = "FAKE_GUID_#{orgs.size}"
      o = Org.new(**args)
      orgs << o
      o
    end

    def delete_org(guid)
      orgs.reject! {|org| org.guid == guid }
    end
  end
end
