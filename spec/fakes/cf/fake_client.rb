require 'cf/org'

module CF
  class FakeClient
    def initialize
      reset!
    end

    def reset!
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
