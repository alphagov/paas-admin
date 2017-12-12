# paas-admin

## Overview

WIP Web based UI for [paas-cf](https://github.com/alphagov/paas-cf) probably pronounced "paz-min" ;-)

## Prerequisites

You will need to add a UAA client to your cloudfoundry deployment manifest, for example:

```
paas-admin:
	override: true
	authorized-grant-types: authorization_code,refresh_token
	autoapprove: true
	secret: [CF_CLIENT_SECRET]
	scope: openid,oauth.approvals,cloud_controller.read,cloud_controller.admin_read_only,cloud_controller.global_auditor
	authorities: uaa.none
	redirect-uri: "https://[pass-admin-domain.com]/auth/cloudfoundry/callback"
```

## Configuration

Configuration is via the following environment variables

| Name | Required | Default | Description |
|:---|:---:|:---:|---:|
| `RAILS_ENV` | - | development | Set which mode to run in |
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


## Usage

### Running in Design Mode

Set environment `RAILS_ENV=design` to run the application locally without the
need to connect to a real cloudfoundry environment. This mode is useful when
you are only interested in developing styling.

To start the server in "design" mode:

```
RAILS_ENV=design ./bin/rails s
```

### Running in Development Mode

Set environment `RAILS_ENV=development` to run the application locally against
a real cloudfoundry environment.

You will need a cloudfoundry environment/account with a UAA client configured
and must set all the required environment variables:

```
CF_API_ENDPOINT="http://api.cf.example.org" \
CF_AUTH_ENDPOINT="http://login.cf.example.org" \
CF_TOKEN_ENDPOINT="http://uaa.cf.example.org" \
CF_CLIENT_ID="paas-admin" \
CF_CLIENT_SECRET="sshhhsecret" \
SKIP_TLS_VERIFICATION="true" \
./bin/rails s
```

If running against a GOV.UK PaaS development environment you will want to alter
the existing `paas-admin` UAA client to point to your local machine:


```
cd paas-cf/scripts
bundle exec uaac target https://login.${DEPLOY_ENV}.dev.cloudpipeline.digital
bundle exec uaac token client get admin -s "$(aws s3 cp s3://gds-paas-${DEPLOY_ENV}-state/cf-secrets.yml - | awk '/uaa_admin_client_secret/ { print $2 }')"
bundle exec uaac client update paas-admin --redirect_uri http://localhost:3000/auth/cloudfoundry/callback
```

...you can then use the following example to setup the required variables...

```
CF_API_ENDPOINT="https://api.${DEPLOY_ENV}.dev.cloudpipeline.digital" \
CF_AUTH_ENDPOINT=$(cf curl /v2/info | jq -r .authorization_endpoint) \
CF_TOKEN_ENDPOINT=$(cf curl /v2/info | jq -r .token_endpoint) \
CF_CLIENT_ID="paas-admin" \
CF_CLIENT_SECRET=$(aws s3 cp s3://gds-paas-${DEPLOY_ENV}-state/cf-secrets.yml - | awk '/uaa_clients_paas_admin_secret/ { print $2 }') \
SKIP_TLS_VERIFICATION="true" \
./bin/rails s
```


### Running in Production mode

Set environment to `RAILS_ENV=production` to enable production configuration.

You will need to set the `SECRET_KEY_BASE` environment variable for the
encryption of cookies.


### Running Tests

Set environment to `RAILS_ENV=test` to enable test configuration. This is done
for you when running `rspec`.

To execute the **unit tests** alone you can just run rspec

```
./bin/rspec`
```

To execute the **contract tests** against a real environment you will need to
set the `CONTRACT_TEST_TOKEN` to a valid token in addition to any other
required environment variables.

that can manipulate a real cloudfoundry environment. Entities **will** be
created/destroyed in this mode.


```
CF_API_ENDPOINT="http://api.cf.example.org" \
CF_AUTH_ENDPOINT="http://login.cf.example.org" \
CF_TOKEN_ENDPOINT="http://uaa.cf.example.org" \
CF_CLIENT_ID="paas-admin" \
CF_CLIENT_SECRET="sshhhsecret" \
SKIP_TLS_VERIFICATION="true" \
CONTRACT_TEST_TOKEN=$(cf oauth-token | cut -d ' ' -f2) \
./bin/rspec
```

For example if you are running against a GOV.UK PaaS development environment
you can could execute the following:

```
CF_API_ENDPOINT="https://api.${DEPLOY_ENV}.dev.cloudpipeline.digital" \
CF_AUTH_ENDPOINT=$(cf curl /v2/info | jq -r .authorization_endpoint) \
CF_TOKEN_ENDPOINT=$(cf curl /v2/info | jq -r .token_endpoint) \
CF_CLIENT_ID="paas-admin" \
CF_CLIENT_SECRET=$(aws s3 cp s3://gds-paas-${DEPLOY_ENV}-state/cf-secrets.yml - | awk '/uaa_clients_paas_admin_secret/ { print $2 }') \
SKIP_TLS_VERIFICATION="true" \
CONTRACT_TEST_TOKEN=$(cf oauth-token | cut -d ' ' -f2) \
./bin/rspec
```

