# GOV.UK PaaS Admin

## Overview

A web UI for interacting with GOV.UK PaaS (CloudFoundry).

It aims to be a progressive enhanced, well tested and user researched tool that
tenants can use to compliment their use of the CLI.

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

```
paas-admin:
	override: true
	authorized-grant-types: authorization_code,client_credentials,refresh_token
	autoapprove: true
	secret: [CF_CLIENT_SECRET]
	scope: scim.me,openid,profile,roles,notification_preferences.read,user_attributes,uaa.user,notification_preferences.write,cloud_controller.read,password.write approvals.me,cloud_controller.write,cloud_controller_service_permissions.read,oauth.approvals
	authorities: clients.read,clients.write,clients.secret,uaa.admin,scim.read,scim.write,password.write,zone.admin
	redirect-uri: "https://[pass-admin-domain.com]/auth/cloudfoundry/callback"
```

## Requirements

* [Node.js](https://nodejs.org/en/) version `8 LTS`
* [npm](https://www.npmjs.com/) versions `>5`
* You will need a username/password for the govuk-frontend project ([why?](#updating-the-govuk-frontend-module))

TIP: You can use [nvm](https://github.com/creationix/nvm) to manage installing
specific versions.

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
npm start
```

You should be able to edit files in the `./src` directory and the changes will
automatically be updated.

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
