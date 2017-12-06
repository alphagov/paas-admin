require 'cf/org'

module CF
  class Client
    def initialize
      @orgs = []
    end

    def orgs
      @orgs
    end

    def create_org(*args)
      @orgs << Org.new(*args)
    end
  end
end
