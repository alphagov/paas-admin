module CF
  class Org
    ACTIVE = "active"

    attr_reader :name, :status

    def initialize(name: nil, status: nil)
      @name = name
      @status = status
    end

    def ==(other)
      [@name, @status] ==
        [other.instance_variable_get(:@name), other.instance_variable_get(:@status)]
    end
  end
end
