class OrgsController < ApplicationController
  def index
    @token = session[:access_token]
  end
end
