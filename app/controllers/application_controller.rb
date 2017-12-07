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
    if not valid_token?
      session[:access_token] = nil
      redirect_to('/auth/cloudfoundry')
    end
  end

  def valid_token?
    token = session[:access_token]
    return false if token.blank?
    decoded_token = CF::UAA::TokenCoder.decode(token, verify: false)
    return false unless decoded_token.has_key? "exp"
    decoded_token["exp"] > Time.now.to_i
  end
end
