#!/bin/bash

set -e
set -x

export AUTH_SERVER_URL=$(cf curl /v2/info | jq -r .authorization_endpoint)
export TOKEN_SERVER_URL=$(cf curl /v2/info | jq -r .token_endpoint)
export OAUTH_CLIENT_ID="paas-admin"
export OAUTH_CLIENT_SECRET=$(aws s3 cp s3://gds-paas-${DEPLOY_ENV}-state/cf-secrets.yml - | awk '/uaa_clients_paas_admin_secret/ { print $2 }')
export SKIP_TLS_VERIFICATION="true"
export CF_API_ADDRESS="https://api.${DEPLOY_ENV}.dev.cloudpipeline.digital"
export CONTRACT_TEST_TOKEN=$(cf oauth-token | cut -d ' ' -f2)

bundle exec rspec
# bundle exec rails s
