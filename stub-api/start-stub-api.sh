#!/usr/bin/env bash
set -euo pipefail

source ./stub-api/stub-apis-env.sh; ts-node stub-api/index.ts
