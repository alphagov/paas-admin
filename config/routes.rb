Rails.application.routes.draw do
  get '/auth/:provider/callback', to: 'sessions#create'
  get '/auth/failure', to: 'sessions#failure'
  root to: 'orgs#index'
end
