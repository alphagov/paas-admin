class OrgsController < ApplicationController
  def index
    redirect_to '/auth/cloudfoundry'
  end
end
