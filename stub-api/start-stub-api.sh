#!/usr/bin/env bash
set -euo pipefail

source ./stub-api/stub-apis-env.sh; node --no-warnings=ExperimentalWarning --loader ts-node/esm stub-api/index.ts
