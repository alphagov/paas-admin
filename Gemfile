source "https://rubygems.org"

ruby "2.4.2"

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

gem "faraday"
gem "omniauth-uaa-oauth2", github: "cloudfoundry/omniauth-uaa-oauth2"
gem "puma", "~> 3.7"
gem "rails", "~> 5.1.4"
gem "uglifier", ">= 1.3.0"

group :development, :test do
  gem "capybara"
  gem "pry-byebug"
  gem "rack_session_access"
  gem "rspec-rails"
end

group :development do
  gem "govuk-lint", "~> 3.4.0"
  gem "listen", ">= 3.0.5", "< 3.2"
  gem "rubocop", "~> 0.51.0", require: false
  gem "spring"
  gem "spring-watcher-listen", "~> 2.0.0"
  gem "web-console", ">= 3.3.0"
end

gem "tzinfo-data", platforms: %i[mingw mswin x64_mingw jruby]
