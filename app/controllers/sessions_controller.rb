class SessionsController < ApplicationController
  skip_before_action :require_login

  def create
    session[:access_token] = auth_hash.credentials.token
    redirect_to root_url
  end

  def failure
    render :status => 401
  end

  private

  def auth_hash
    request.env['omniauth.auth']
  end
end
