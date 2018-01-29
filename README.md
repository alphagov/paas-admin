# GOV.UK PaaS Admin

It's a web UI for interacting with GOV.UK PaaS (Cloudfoundry).

It aims to be a progressive enhanced, well tested and user researched tool that
tenants could use to replace the need of using CLI.

## Other tools

This project is fairly young and may not be a right fit for different needs yet.

You may be interested in investigating other tools, such as
[Stratos](https://github.com/cloudfoundry-incubator/stratos) which may become a
official tool some day.

## Usage

```sh
npm run test                     # run all tests
npm run test:unit                # run unit tests
npm run test:vulnerabilities     # check for vulns via snyk
npm run lint                     # lint all code
npm run lint:js                  # lint js code
npm run lint:sass                # lint scss/sass
npm run fix                      # try to autofix everything
npm run fix:js                   # try to autofix js code
npm run fix:sass                 # try to autofix scss/sass code
npm run fix:vulnerabilities      # try to apply snyk module patches
npm run dev:build                # compile a development build to ./dist/
npm run dev:start                # compile, run and hot-reload the dev server
npm run production:build         # compile a production build to ./dist/
npm run production:start         # compile and run a production server
npm run production:push          # compile and push to cf
```

## Running locally

To run the application, you will need a node environment set up beforehand.

We chose `Node 8 LTS` to be a minimum version of node we'd like to support.

### Installing the dependencies

Before getting started, you will need to install any dependencies the project
requires at given time. Whilst being in the root directory of the application,
run:

```sh
npm install
```

### Running the server in dev mode

In dev mode webpack will be watching the src and hot-reload any code changes to avoid having to restart the server.

```sh
npm run dev:start
```

### Running the server in production mode

To compile the app for production you can do:

```sh
npm run production:build
```

Which will produce a build in `./dist/` which you can distribute and run via:

```sh
node ./dist/main.js
```

For convenience there is a script to do this:

```sh
npm run production:start
```

### Testing

We've prepared some tooling to keep the code clean, maintainable and in working
order.

The following command will execute unit tests, lint js/sass code, and ensure there is 100% test coverage.

```sh
npm run test
```

There also is a command to checkup on dependencies to discover any recorded
vulnerabilities. This command is run by travis and our CI.

```sh
npm run fix:vulnerabilities
```

