require 'cf/org'
require 'faraday'
require 'json'

module CF
  class Client
    def initialize(token: nil, api_endpoint: nil, skip_tls_verification: false)
      @conn = Faraday.new(
        url: api_endpoint,
        headers: {
          "Authorization" => "bearer #{token}",
          "Content-Type" => "application/json",
          "User-Agent" => "paas-admin-client",
          "Accept" => "application/json",
        },
        ssl: {
          verify: !skip_tls_verification
        }
      )
    end

    def orgs
      r = conn.get do |req|
        req.url "/v2/organizations"
      end
      if r.status != 200
        raise "bad thing status: #{r.status}"
      end
      res = JSON.parse(r.body)
      pages = res["total_pages"].to_i
      raise "pagination not implemented" if pages > 1
      resources = res["resources"]
      resources.map do |resource|
        CF::Org.new(
          guid: resource["metadata"]["guid"],
          name: resource["entity"]["name"],
          status: resource["entity"]["status"],
        )
      end
    end

    def create_org(**args)
      r = conn.post do |req|
        req.url "/v2/organizations"
        req.body = args.to_json
      end
      if r.status != 201
        raise "error creating org. Status code: #{r.status}"
      end
      resource = JSON.parse(r.body)
      CF::Org.new(
        guid: resource["metadata"]["guid"],
        name: resource["entity"]["name"],
        status: resource["entity"]["status"],
      )
    end

    def delete_org(guid)
      r = conn.delete do |req|
        req.url "/v2/organizations/#{guid}"
        req.params['recursive'] = false
        req.params['async'] = false
      end
      if r.status != 204
        raise "error deleting org. Status code: #{r.status}"
      end
    end

    private

    attr_reader :conn
  end
end
