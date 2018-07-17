# GOV.UK PaaS Admin

## Overview

A web UI for interacting with GOV.UK PaaS (CloudFoundry).

It aims to be a progressive enhanced, well tested and user researched tool that
tenants can use to complement their use of the CLI.

## Usage

```sh
npm run build              # compile the build to ./dist
npm run test               # run all the tests and linters
npm run test:unit          # only unit tests
npm run lint               # run code linters
npm run fix                # try to autofix problems with js/css
npm run start              # rebuild and start the server
npm run push               # rebuild and push to cloudfoundry
npm run clean              # destroy the ./dist build dir
```

## Prerequisites

You will need to add a UAA client to your CloudFoundry deployment manifest, for example:

```yaml
paas-admin:
  override: true
  authorized-grant-types: authorization_code,client_credentials,refresh_token
  autoapprove: true
  secret: [CF_CLIENT_SECRET]
  scope: cloud_controller.read,cloud_controller.admin_read_only,cloud_controller.global_auditor,cloud_controller.write,scim.me,openid,profile,uaa.user,cloud_controller.admincloud_controller.read,cloud_controller.admin_read_only,cloud_controller.global_auditor,cloud_controller.write,scim.me,openid,profile,uaa.user,cloud_controller.admin
  authorities: scim.userids,scim.invite,scim.read
  redirect-uri: "https://[pass-admin-domain.com]/auth/login/callback"
```

If you get problems with "Invalid redirect", use uaac to modify the
redirect-uri:

```
uaac target https://uaa.my.environment
uaac token client get admin -s my-uaa-admin-client-secret
uaac client update paas-admin --redirect-uri http://localhost:3000/auth/login/callback
```

## Requirements

* [Node.js](https://nodejs.org/en/) version `~ 8.9.0` LTS - consider using
  [NVM](https://github.com/creationix/nvm) (`nvm use` in this repo) for version
management
* [npm](https://www.npmjs.com/) versions `> 5.5.1`
* You will need a username/password for the govuk-frontend project ([why?](#updating-the-govuk-frontend-module))

## Getting Started

Clone this repository and then use `npm` to install the project dependencies:

```sh
npm install
```

Execute the unit tests to ensure everything looks good:

```sh
npm test
```

Start the server in development mode

```sh
API_URL="https://api.$DEPLOY_ENV.dev.cloudpipeline.digital" \
BILLING_URL="https://billing.$DEPLOY_ENV.dev.cloudpipeline.digital" \
UAA_URL="https://uaa.$DEPLOY_ENV.dev.cloudpipeline.digital" \
OAUTH_CLIENT_ID="my-client-id" \
OAUTH_CLIENT_SECRET="my-secret" \
NOTIFY_API_KEY="qwerty123456" \
NOTIFY_WELCOME_TEMPLATE_ID="qwerty123456" \
npm start
```

TIP: set `NODE_EXTRA_CA_CERTS=path/to/router-ca.crt` if your UAA/CF uses the
gorouter's self-signed cert (e.g. on bosh-lite).

(the above values make sense for the UK Government PaaS team)

You should be able to edit files in the `./src` directory and the changes will
automatically be updated.

## Quick local start for review/troubleshooting

Provided you have logged in CF and have AWS credentials

1. Update uaa user:

```
DEPLOY_ENV=...
uaac target https://uaa.${DEPLOY_ENV}.dev.cloudpipeline.digital
uaac token client get admin -s $(aws s3 cp s3://gds-paas-${DEPLOY_ENV}-state/cf-vars-store.yml  - | grep uaa_admin_client_secret | cut -f2 -d " ")
uaac client update paas-admin --redirect-uri http://localhost:3000/auth/login/callback
```

2. Get the command to start the server:

```
cf target -o admin -s public
cf env paas-admin | awk '/User-Provided/ { printing=1; next} /^$/ { printing=0 ; next} printing  {gsub(": ","=\""); gsub("$", "\" \\"); print; next  } END { print "npm start"}'

```

3. Undo the paas-admin client change once done:


```
uaac client update paas-admin --redirect-uri https://admin.${DEPLOY_ENV}.dev.cloudpipeline.digital/auth/login/callback
```


## Production builds

The `NODE_ENV` environment variable alters the build process to bundle all
dependencies into the `./dist/` directory.

```
NODE_ENV=production npm run build
```

The `./dist` folder should now be a distributable without the need for the
node_modules folder and should be executable on any environment that has a
supported version of Node.js, e.g., `cf push`.

To push the build to CloudFoundry there is a helper script that creates a
production build and calls `cf push`:

```sh
npm run push
```

## Updating the govuk-frontend module

Right now the lovely govuk-frontend project is in private beta and they require
a password to access their npm packages. We currently vendor the package to
avoid needing to distribute the password just to build `paas-admin`.

To update the module you must first login to npm as the `govuk-frontend-test`
user.

## Alternatives

This project is fairly young and may not be a right fit for different needs yet.

You may be interested in investigating other tools, such as
[Stratos](https://github.com/cloudfoundry-incubator/stratos) which may become
an official tool some day.

