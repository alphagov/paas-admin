class OrgsController < ApplicationController
  def index
    @orgs = cf.orgs
  end

end
