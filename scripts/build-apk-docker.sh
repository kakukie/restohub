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
JAVA_HOME_DOCKER=${JAVA_HOME_DOCKER:-"/usr/lib/jvm/java-21-openjdk-amd64"}

run_in_container() {
  local c="$1"
  echo "== Building inside container $c =="
  docker exec -i "$c" /bin/bash -lc "
    set -euo pipefail
    export NODE_BIN=\"$NODE_BIN\"
    JHD=\"${JAVA_HOME_DOCKER:-}\"
    if [ -n \"\$JHD\" ] && [ -d \"\$JHD\" ]; then
      export JAVA_HOME=\"\$JHD\"
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    elif command -v javac >/dev/null 2>&1; then
      JBIN=\$(command -v javac)
      export JAVA_HOME=\$(cd \$(dirname \"\$JBIN\")/../.. && pwd)
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    elif command -v apt-get >/dev/null 2>&1; then
      echo \"Installing OpenJDK 21 inside container $c...\"
      export DEBIAN_FRONTEND=noninteractive
      if [ -w /var/lib/apt/lists ] && [ -w /var/cache/apt/archives ]; then
        apt-get update -y && apt-get install -y openjdk-21-jdk
      elif command -v sudo >/dev/null 2>&1; then
        sudo apt-get update -y && sudo apt-get install -y openjdk-21-jdk
      else
        echo \"ERROR: No permission to run apt-get inside $c; set JAVA_HOME_DOCKER to an existing JDK path.\" && exit 1
      fi
      JBIN=\$(command -v javac)
      export JAVA_HOME=\$(cd \$(dirname \"\$JBIN\")/../.. && pwd)
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    else
      echo \"ERROR: javac not found and apt-get not available in container $c\" && exit 1
    fi
    cd \"$APP_PATH\"
    chmod +x scripts/build-apk.sh
    ./scripts/build-apk.sh
  "
  echo "== Done in $c =="
}

for c in $CONTAINERS; do
  if ! docker ps --format '{{.Names}}' | grep -q "^${c}\$"; then
    echo "WARN: container ${c} not running, skip."
    continue
  fi
  run_in_container "$c"
done
