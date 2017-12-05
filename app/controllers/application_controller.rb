class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :require_login

  private

  def require_login
    redirect_to('/auth/cloudfoundry') unless logged_in?
  end

  def logged_in?
    session[:access_token].present?
  end
end
