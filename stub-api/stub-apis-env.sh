#!/bin/sh

export PORT=${PORT-3000}
export DOMAIN_NAME="http://localhost:3000/"

export STUB_ACCOUNTS_PORT=${STUB_ACCOUNTS_PORT-1337}
export STUB_BILLING_PORT=${STUB_BILLING_PORT-1338}
export STUB_CF_PORT=${STUB_CF_PORT-1339}
export STUB_UAA_PORT=${STUB_UAA_PORT-1340}
export STUB_AWS_PORT=${STUB_AWS_PORT-1341}


export ACCOUNTS_URL=http://0:${STUB_ACCOUNTS_PORT}
export BILLING_URL=http://0:${STUB_BILLING_PORT}
export API_URL=http://0:${STUB_CF_PORT}
export UAA_URL=http://0:${STUB_UAA_PORT}
export AUTHORIZATION_URL=http://0:${STUB_UAA_PORT}
export AWS_CLOUDWATCH_ENDPOINT=http://0:${STUB_AWS_PORT}

export OAUTH_CLIENT_ID=my-client-id
export OAUTH_CLIENT_SECRET=my-secret
export ACCOUNTS_SECRET=my-accounts-secret
export NOTIFY_API_KEY=qwerty123456
export NOTIFY_WELCOME_TEMPLATE_ID=qwerty123456
export AWS_REGION=eu-west-2
export MS_CLIENT_ID=clientid
export MS_CLIENT_SECRET=clientsecret
export MS_TENANT_ID=tenantid
export GOOGLE_CLIENT_ID=googleclientid
export GOOGLE_CLIENT_SECRET=googleclientsecret

export AWS_ACCESS_KEY_ID=some-key-id
export AWS_SECRET_ACCESS_KEY=some-secret-key