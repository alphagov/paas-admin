class OrgsController < ApplicationController
  before_action :require_login

  def index
    @token = session[:access_token]
  end

  private

  def require_login
    redirect_to('/auth/cloudfoundry') unless logged_in?
  end

  def logged_in?
    session[:access_token].present?
  end
end
