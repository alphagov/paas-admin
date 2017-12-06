class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  before_action :require_login

  protected

  def cf
    Rails.configuration.cf_client.new(
      token: session[:access_token],
      api_endpoint: Rails.configuration.api_endpoint,
      skip_tls_verification: Rails.configuration.skip_tls_verification,
    )
  end

  private

  def require_login
    redirect_to('/auth/cloudfoundry') unless logged_in?
  end

  def logged_in?
    session[:access_token].present?
  end
end
