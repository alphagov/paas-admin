class OrgsController < ApplicationController
  def index
    redirect_to Rails.configuration.x.oauth.redirect_url
  end
end
