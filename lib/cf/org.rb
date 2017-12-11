module CF
  class Org
    ACTIVE = "active".freeze

    attr_reader :name, :status, :guid

    def initialize(name: nil, status: nil, guid: nil)
      @name = name
      @status = status
      @guid = guid
    end

    def ==(other)
      [@name, @status] ==
        [other.instance_variable_get(:@name), other.instance_variable_get(:@status)]
    end
  end
end
