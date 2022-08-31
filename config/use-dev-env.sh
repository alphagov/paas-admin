#!/usr/bin/env sh

DEPLOY_ENV="$1"
SYSTEM_DOMAIN="${DEPLOY_ENV}.dev.cloudpipeline.digital"

function service_domain () {
  echo "https://${1}.${SYSTEM_DOMAIN}"
}

echo "You will need to access to Credhub for ${DEPLOY_ENV}."
echo "In the paas-cf repository run"
echo "  gds aws paas-dev-admin -- make ${DEPLOY_ENV} credhub"
echo "and follow the instructions on screen"
echo ""


## Set up environment
export PORT=${PORT-3000}
export DOMAIN_NAME="http://localhost:3000/"

export STUB_ACCOUNTS_PORT=${STUB_ACCOUNTS_PORT-1337}
export STUB_BILLING_PORT=${STUB_BILLING_PORT-1338}
export STUB_CF_PORT=${STUB_CF_PORT-1339}
export STUB_UAA_PORT=${STUB_UAA_PORT-1340}
export STUB_AWS_PORT=${STUB_AWS_PORT-1341}
export STUB_PROMETHEUS_PORT=${STUB_PROMETHEUS_PORT-1342}

export ACCOUNTS_URL=$(service_domain "accounts")
export BILLING_URL=$(service_domain "billing")
export API_URL=$(service_domain "api")
export UAA_URL=$(service_domain "uaa")
export AUTHORIZATION_URL=$(service_domain "uaa")

export AWS_REGION=eu-west-1
export AWS_CLOUDWATCH_ENDPOINT="https://monitoring.${AWS_REGION}.amazonaws.com"
export PROMETHEUS_ENDPOINT=http://0:${STUB_PROMETHEUS_PORT}
export PROMETHEUS_USERNAME=not-used
export PROMETHEUS_PASSWORD=not-used

read -p $'Enter the PaaS accounts secret: (credhub get -q -n "/concourse/main/create-cloudfoundry/paas_accounts_password")\n' accounts_secret
export ACCOUNTS_SECRET="${accounts_secret}"

read -p $'Enter the Notify API key: (credhub get -q -n "/concourse/main/create-cloudfoundry/notify_api_key")\n' notify_api_key
export NOTIFY_API_KEY="${notify_api_key}"
export NOTIFY_WELCOME_TEMPLATE_ID="1859ce68-f133-4218-ac6e-a8ef32a41292"

export OAUTH_CLIENT_ID=paas-admin-local
export OAUTH_CLIENT_SECRET=local-dev
export GOOGLE_CLIENT_ID=googleclientid
export GOOGLE_CLIENT_SECRET=googleclientsecret

## Start the dev server
npm start
