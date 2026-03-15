#!/usr/bin/env bash
# Ensure bash even if invoked via sh
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Run APK build inside specified Docker containers.
# Defaults:
#   CONTAINERS: "meenuin-app-1 meenuin-app-2"
#   APP_PATH: "/app"   (path to repo inside container)
#   NODE_BIN: "/usr/local/bin/node"

CONTAINERS=${CONTAINERS:-"meenuin-app-1 meenuin-app-2"}
APP_PATH=${APP_PATH:-"/app"}
NODE_BIN=${NODE_BIN:-"/usr/local/bin/node"}

run_in_container() {
  local c="$1"
  echo "== Building inside container $c =="
  docker exec -i "$c" /bin/bash -lc "
    set -euo pipefail
    export NODE_BIN=\"$NODE_BIN\"
    cd \"$APP_PATH\"
    ./scripts/build-apk.sh
  "
  echo "== Done in $c =="
}

for c in $CONTAINERS; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${c}\$"; then
    echo "WARN: container ${c} not running, skip."
    continue
  }
  run_in_container "$c"
done
