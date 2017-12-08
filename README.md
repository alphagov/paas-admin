# paas-admin

## Overview

WIP Web based UI for [paas-cf](https://github.com/alphagov/paas-cf) probably pronounced "paz-min" ;-)

## Configuration

Configuration is via the following environment variables

| Name | Required | Default | Description |
|:---|:---:|:---:|---:|
| `SECRET_KEY_BASE` | ✓ | - | Used for encrypting session data |
| `CF_API_ENDPOINT` | ✓ | - | Cloud Controller API address |
| `CF_AUTH_ENDPOINT` | ✓ | - | UAA login address |
| `CF_TOKEN_ENDPOINT` | ✓ | - | UAA token address |
| `CF_CLIENT_ID` | ✓ | - | UAA client ID |
| `CF_CLIENT_SECRET` | ✓ | - | UAA client Secret |
| `SKIP_TLS_VERIFICATION` | - | false | Disable TLS certificate verification |


The following variables alter test behaviour

| Name | Required | Default | Description |
|:---|:---:|:---:|---:|
| `CONTRACT_TEST_TOKEN` | - | - | An oauth token to enable integration tests |


## Starting & Running tests

### Running locally

First of all, you'll need to configure the UAA client to redirect you to your locally running app:

```
cd paas-cf/scripts
bundle exec uaac target https://login.${DEPLOY_ENV}.dev.cloudpipeline.digital
bundle exec uaac token client get admin -s "$(aws s3 cp s3://gds-paas-${DEPLOY_ENV}-state/cf-secrets.yml - | awk '/uaa_admin_client_secret/ { print $2 }')"
bundle exec uaac client update paas-admin --redirect_uri http://localhost:3000/auth/cloudfoundry/callback
```

You'll need to configure your environment to run the server and/or tests locally. There is an [.envrc](.envrc) file to aid with setting up the required environment, which can be sourced manually (or automatically if you use `direnv`):

```bash
~/src/paas-admin$ source .envrc
```

Run the tests

```bash
~/src/paas-admin$ ./scripts/run-tests.sh
```

Starting the server

```bash
~/src/paas-admin$ ./scripts/run.sh
```

### Production deployments

You will need to set the `SECRET_KEY_BASE` environment variable for the encryption of cookies.

