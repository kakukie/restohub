#!/usr/bin/env bash
# Ensure bash even if invoked via sh
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

# Run APK build inside specified Docker containers without requiring apt-get or
# download tools inside the container. We copy a JDK tarball from the host.
#
# Defaults (override with env vars):
#   CONTAINERS: "meenuin-app-1 meenuin-app-2"
#   APP_PATH: "/app"                  (path to repo inside container)
#   NODE_BIN: "/usr/local/bin/node"   (node path inside container)
#   JAVA_HOME_DOCKER: "/usr/lib/jvm/java-21-openjdk-amd64" (preinstalled JDK path)
#   JDK_TARBALL_HOST: "/tmp/jdk21.tar.gz" (host path to tarball)
#   JDK_DIR_IN_CONTAINER: "/tmp/jdk21"    (where tarball is extracted)
#   JDK_URL_DEFAULT: Temurin 21.0.3 hotspot x64 Linux tarball

CONTAINERS=${CONTAINERS:-"meenuin-app-1 meenuin-app-2"}
APP_PATH=${APP_PATH:-"/app"}
NODE_BIN=${NODE_BIN:-"/usr/local/bin/node"}
JAVA_HOME_DOCKER=${JAVA_HOME_DOCKER:-"/usr/lib/jvm/java-21-openjdk-amd64"}
JDK_TARBALL_HOST=${JDK_TARBALL_HOST:-"/tmp/jdk21.tar.gz"}
JDK_DIR_IN_CONTAINER=${JDK_DIR_IN_CONTAINER:-"/tmp/jdk21"}
JDK_URL_DEFAULT=${JDK_URL_DEFAULT:-"https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.3%2B9/OpenJDK21U-jdk_x64_linux_hotspot_21.0.3_9.tar.gz"}

ensure_host_jdk_tarball() {
  if [ -f "$JDK_TARBALL_HOST" ]; then
    return 0
  fi
  echo "Host: downloading JDK tarball to $JDK_TARBALL_HOST ..."
  if command -v curl >/dev/null 2>&1; then
    curl -L "$JDK_URL_DEFAULT" -o "$JDK_TARBALL_HOST"
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$JDK_TARBALL_HOST" "$JDK_URL_DEFAULT"
  elif command -v python3 >/dev/null 2>&1; then
    python3 - <<PY
import urllib.request
url = "$JDK_URL_DEFAULT"
urllib.request.urlretrieve(url, "$JDK_TARBALL_HOST")
PY
  else
    echo "ERROR: need curl/wget/python3 on host to fetch JDK tarball (or set JDK_TARBALL_HOST to an existing file)." >&2
    exit 1
  fi
}

copy_tarball_into_container() {
  local c="$1"
  ensure_host_jdk_tarball
  echo "Copying JDK tarball into container $c ..."
  docker cp "$JDK_TARBALL_HOST" "${c}:/tmp/jdk21.tar.gz"
}

run_in_container() {
  local c="$1"
  echo "== Building inside container $c =="
  copy_tarball_into_container "$c"

  docker exec -i "$c" /bin/bash -lc "
    set -euo pipefail
    export NODE_BIN=\"$NODE_BIN\"

    # Prefer provided JAVA_HOME_DOCKER if it exists
    if [ -n \"${JAVA_HOME_DOCKER}\" ] && [ -d \"${JAVA_HOME_DOCKER}\" ]; then
      export JAVA_HOME=\"${JAVA_HOME_DOCKER}\"
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    elif command -v javac >/dev/null 2>&1; then
      JBIN=\$(command -v javac)
      export JAVA_HOME=\$(cd \$(dirname \"\$JBIN\")/../.. && pwd)
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    else
      # Extract host-provided tarball inside container
      if [ ! -f /tmp/jdk21.tar.gz ]; then
        echo \"ERROR: /tmp/jdk21.tar.gz missing inside container $c\" >&2
        exit 1
      fi
      rm -rf \"${JDK_DIR_IN_CONTAINER}\"
      mkdir -p \"${JDK_DIR_IN_CONTAINER}\"
      tar -xzf /tmp/jdk21.tar.gz -C \"${JDK_DIR_IN_CONTAINER}\" --strip-components=1
      export JAVA_HOME=\"${JDK_DIR_IN_CONTAINER}\"
      export PATH=\"\$JAVA_HOME/bin:\$PATH\"
    fi

    if ! command -v javac >/dev/null 2>&1; then
      echo \"ERROR: javac not available after JDK setup in container $c\" >&2
      exit 1
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
